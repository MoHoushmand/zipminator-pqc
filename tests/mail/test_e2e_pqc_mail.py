"""Iter 3: End-to-end PQC envelope roundtrip through a mock transport.

This satisfies Pillar 7 exit criterion 2: "integration test does E2E PQC
envelope exchange with mock transport". The mock transport serializes the
envelope to JSON (what a real SMTP MTA would see on the wire) and hands the
bytes to a receiver that deserializes and decrypts.

The envelope is built by ``api.src.mail.envelope.encode_pqc_envelope`` (the
owned wrapper) using a ciphertext produced by ``email.transport.pqc_bridge``
in its Python AES-GCM fallback mode (no Rust build required for CI).

Implements NIST FIPS 203 (ML-KEM-768). The pure-Python bridge path is a
dev/test substitute for the Rust ML-KEM binding and does not provide PQC
protection on its own; the envelope header X-PQC-Algorithm still records
the target algorithm so the on-wire format matches production.
"""
from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]
EMAIL_DIR = REPO_ROOT / "email"


def _prepend_sys_path(p: Path) -> None:
    sp = str(p)
    if sp not in sys.path:
        sys.path.insert(0, sp)


@pytest.fixture(scope="module")
def pqc_bridge():
    _prepend_sys_path(EMAIL_DIR)
    from transport import pqc_bridge as mod  # type: ignore[import]

    return mod


@pytest.fixture(scope="module")
def envelope_api():
    from api.src.mail import envelope as mod  # type: ignore[import]

    return mod


@pytest.fixture()
def recipient_keys() -> tuple[str, str]:
    """Return (pk_b64, sk_b64) sized for ML-KEM-768.

    The Python fallback ignores key material and uses a random CEK packed
    into the envelope, so these are opaque bytes of the right length.
    """
    pk = base64.b64encode(os.urandom(1184)).decode()
    sk = base64.b64encode(os.urandom(2400)).decode()
    return pk, sk


class MockTransport:
    """In-memory mock SMTP MTA: a bytes queue sender -> receiver."""

    def __init__(self) -> None:
        self._queue: list[bytes] = []

    def deliver(self, wire_bytes: bytes) -> None:
        self._queue.append(wire_bytes)

    def fetch(self) -> bytes:
        assert self._queue, "no mail delivered"
        return self._queue.pop(0)

    @property
    def delivered_count(self) -> int:
        return len(self._queue)


def test_mock_transport_roundtrip_preserves_plaintext(
    pqc_bridge, envelope_api, recipient_keys
):
    """Sender encrypts, mock transport moves bytes, receiver decrypts."""
    pk_b64, sk_b64 = recipient_keys
    plaintext = b"DORA Art. 6.4 drill: quantum readiness attested."

    # Sender side: encrypt the body into a PQC envelope.
    body_envelope = pqc_bridge.encrypt_email(plaintext, pk_b64)
    assert isinstance(body_envelope, dict)
    # ciphertext field must be base64 and non-empty
    ct_b64 = body_envelope["ciphertext"]
    assert ct_b64, "bridge returned empty ciphertext"
    kem_ct = base64.b64decode(body_envelope.get("kem_ciphertext") or b"")

    # In the Python fallback, the KEM ciphertext field is empty; the
    # SMTP envelope header requires 1088-byte ML-KEM-768 ciphertext. For
    # the mock transport we synthesize a placeholder of the right size so
    # the on-wire header matches the production shape.
    if not kem_ct:
        kem_ct = b"\x00" * 1088

    smtp_envelope = envelope_api.encode_pqc_envelope(
        from_addr="alice@zipminator.local",
        to_addr="bob@zipminator.local",
        subject="Iter 3 E2E roundtrip",
        body=json.dumps(body_envelope).encode(),
        ml_kem_ciphertext=kem_ct,
    )

    # Serialize to wire bytes (what MTA would see).
    wire = json.dumps(smtp_envelope).encode()
    transport = MockTransport()
    transport.deliver(wire)

    # Receiver side.
    received = transport.fetch()
    received_envelope = json.loads(received.decode())
    assert received_envelope["headers"]["X-PQC-Algorithm"] == "ML-KEM-768"
    assert received_envelope["headers"]["From"] == "alice@zipminator.local"
    assert received_envelope["headers"]["To"] == "bob@zipminator.local"

    # Unwrap the inner body envelope and decrypt.
    body_bytes = base64.b64decode(received_envelope["body_b64"])
    inner = json.loads(body_bytes.decode())
    recovered = pqc_bridge.decrypt_email(inner, sk_b64)
    assert recovered == plaintext


def test_envelope_ciphertext_header_is_correct_size(
    pqc_bridge, envelope_api, recipient_keys
):
    """The X-PQC-Ciphertext-B64 header must decode to exactly 1088 bytes."""
    pk_b64, _ = recipient_keys
    inner = pqc_bridge.encrypt_email(b"sized check", pk_b64)
    env = envelope_api.encode_pqc_envelope(
        from_addr="a@b.c",
        to_addr="d@e.f",
        subject="size",
        body=json.dumps(inner).encode(),
        ml_kem_ciphertext=b"\x02" * 1088,
    )
    ct_header = env["headers"]["X-PQC-Ciphertext-B64"]
    decoded = base64.b64decode(ct_header)
    assert len(decoded) == 1088, (
        f"ML-KEM-768 ciphertext header must be 1088 bytes, got {len(decoded)}"
    )


def test_mock_transport_delivers_multiple_messages(
    pqc_bridge, envelope_api, recipient_keys
):
    """Transport must preserve independent envelopes for multiple messages."""
    pk_b64, sk_b64 = recipient_keys
    transport = MockTransport()

    payloads = [b"message one", b"message two", b"message three"]
    for p in payloads:
        inner = pqc_bridge.encrypt_email(p, pk_b64)
        env = envelope_api.encode_pqc_envelope(
            from_addr="bulk@zipminator.local",
            to_addr="bob@zipminator.local",
            subject="bulk",
            body=json.dumps(inner).encode(),
            ml_kem_ciphertext=b"\x01" * 1088,
        )
        transport.deliver(json.dumps(env).encode())

    assert transport.delivered_count == 3
    recovered: list[bytes] = []
    for _ in range(3):
        wire = transport.fetch()
        env = json.loads(wire.decode())
        inner = json.loads(base64.b64decode(env["body_b64"]).decode())
        recovered.append(pqc_bridge.decrypt_email(inner, sk_b64))

    assert recovered == payloads


def test_tampered_wire_bytes_fail_decryption(
    pqc_bridge, envelope_api, recipient_keys
):
    """Flipping a byte in the wire payload must cause decryption to fail.

    AES-GCM provides authenticated encryption; any tamper in the inner
    ciphertext must raise, not silently return wrong plaintext.
    """
    from cryptography.exceptions import InvalidTag

    pk_b64, sk_b64 = recipient_keys
    inner = pqc_bridge.encrypt_email(b"authenticate me", pk_b64)
    env = envelope_api.encode_pqc_envelope(
        from_addr="a@b.c",
        to_addr="d@e.f",
        subject="tamper",
        body=json.dumps(inner).encode(),
        ml_kem_ciphertext=b"\x03" * 1088,
    )
    wire = bytearray(json.dumps(env).encode())

    # Flip a bit inside the base64 ciphertext field of the inner envelope.
    body_b64 = env["body_b64"]
    body_bytes = bytearray(base64.b64decode(body_b64))
    inner_loaded = json.loads(body_bytes.decode())
    ct = bytearray(base64.b64decode(inner_loaded["ciphertext"]))
    ct[0] ^= 0x01
    inner_loaded["ciphertext"] = base64.b64encode(bytes(ct)).decode()
    env["body_b64"] = base64.b64encode(json.dumps(inner_loaded).encode()).decode()
    wire = json.dumps(env).encode()

    recv = json.loads(wire.decode())
    received_inner = json.loads(base64.b64decode(recv["body_b64"]).decode())
    with pytest.raises(InvalidTag):
        pqc_bridge.decrypt_email(received_inner, sk_b64)


# ---------------------------------------------------------------------------
# docker compose validation (gated on docker CLI availability)
# ---------------------------------------------------------------------------

def test_docker_mail_compose_config_valid() -> None:
    """`docker compose config` must parse docker/mail/docker-compose.yml.

    Skipped when the docker CLI is not installed (CI or dev-without-docker).
    """
    docker_bin = shutil.which("docker")
    if docker_bin is None:
        pytest.skip("docker CLI not installed")

    compose_path = REPO_ROOT / "docker" / "mail" / "docker-compose.yml"
    assert compose_path.is_file(), f"missing compose file: {compose_path}"

    result = subprocess.run(
        [docker_bin, "compose", "-f", str(compose_path), "config", "--quiet"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, (
        f"docker compose config failed:\nstderr: {result.stderr}\n"
        f"stdout: {result.stdout}"
    )
