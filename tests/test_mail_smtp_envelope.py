"""Tests for PQC email envelope encoder (Pillar 7).

Covers zipminator.mail.smtp.encode_pqc_envelope: header serialization,
base64 body encoding, and ML-KEM-768 ciphertext handling. Implements
NIST FIPS 203 (ML-KEM-768) envelope wiring; no real SMTP transport here.
"""

from __future__ import annotations

import base64

import pytest

from zipminator.mail.smtp import encode_pqc_envelope


FROM_ADDR = "alice@zipminator.zip"
TO_ADDR = "bob@zipminator.zip"
SUBJECT = "PQC handshake"
BODY = b"top-secret payload"
CIPHERTEXT = b"\x01\x02\x03\x04ml-kem-ct"


def test_returns_dict_with_expected_top_level_keys():
    envelope = encode_pqc_envelope(
        from_addr=FROM_ADDR,
        to_addr=TO_ADDR,
        subject=SUBJECT,
        body=BODY,
        ml_kem_ciphertext=CIPHERTEXT,
    )
    assert isinstance(envelope, dict)
    assert set(envelope.keys()) == {"headers", "body_b64"}


def test_headers_contain_required_fields():
    envelope = encode_pqc_envelope(
        from_addr=FROM_ADDR,
        to_addr=TO_ADDR,
        subject=SUBJECT,
        body=BODY,
        ml_kem_ciphertext=CIPHERTEXT,
    )
    headers = envelope["headers"]
    assert headers["From"] == FROM_ADDR
    assert headers["To"] == TO_ADDR
    assert headers["Subject"] == SUBJECT
    assert headers["X-PQC-Algorithm"] == "ML-KEM-768"
    assert headers["X-PQC-Ciphertext-B64"] == base64.b64encode(CIPHERTEXT).decode("ascii")


def test_body_b64_is_base64_of_input():
    envelope = encode_pqc_envelope(
        from_addr=FROM_ADDR,
        to_addr=TO_ADDR,
        subject=SUBJECT,
        body=BODY,
        ml_kem_ciphertext=CIPHERTEXT,
    )
    body_b64 = envelope["body_b64"]
    assert isinstance(body_b64, str)
    assert base64.b64decode(body_b64) == BODY


def test_raises_value_error_on_empty_ciphertext():
    with pytest.raises(ValueError):
        encode_pqc_envelope(
            from_addr=FROM_ADDR,
            to_addr=TO_ADDR,
            subject=SUBJECT,
            body=BODY,
            ml_kem_ciphertext=b"",
        )
