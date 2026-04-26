#!/usr/bin/env python3
"""Cross-repo integration: Zipminator QRNG → RuView NVS provisioning binary.

Produces an NVS binary identical to ``MeshProvisioner::provision_nvs_binary``
in ``crates/zipminator-mesh/src/provisioner.rs``. The binary is suitable for
flashing onto ESP32-S3 mesh nodes via RuView's ``scripts/provision.py`` (or
its descendants) without round-tripping through the Rust toolchain.

This is the canonical Python implementation of the V1 Zipminator NVS layout:

::

    [0..6]            "ZMESH\\x01"                magic header
    [6..8]            mesh_id_len (u16 LE)         length of mesh_id
    [8..8+N]          mesh_id (UTF-8 bytes)        network identifier
    [8+N..8+N+16]     PSK (16 bytes)               HMAC-SHA256 beacon PSK
    [8+N+16..8+N+32]  SipHash key (16 bytes)       SipHash-2-4 frame integrity
    [8+N+32..8+N+64]  SHA-256 checksum (32 bytes)  over all preceding bytes

Both keys are derived via HKDF-SHA256 from the QRNG entropy pool with
distinct ``info`` strings:

* PSK info:     ``b"zipminator-mesh-psk-v1"``
* SipHash info: ``b"zipminator-mesh-siphash-v1"``

The HKDF salt is the bytes of ``f"{mesh_id}:epoch:{epoch}"``, matching
``MeshProvisioner::epoch_salt``.

Usage::

    python scripts/integrate_ruview.py \\
        --mesh-id mesh-prod-001 \\
        --output /tmp/mesh.nvs

    python scripts/integrate_ruview.py \\
        --entropy-pool quantum_entropy/quantum_entropy_pool.bin \\
        --mesh-id mesh-test --epoch 3 --hex
"""
from __future__ import annotations

import argparse
import dataclasses
import hashlib
import hmac
import os
import struct
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants — keep in sync with crates/zipminator-mesh/src/provisioner.rs
# and crates/zipminator-mesh/src/entropy_bridge.rs.
# ---------------------------------------------------------------------------

NVS_MAGIC: bytes = b"ZMESH\x01"
"""V1 magic header. Six bytes: ``ZMESH`` + version byte ``0x01``."""

NVS_CHECKSUM_SIZE: int = 32
"""SHA-256 checksum size."""

MESH_PSK_SIZE: int = 16
SIPHASH_KEY_SIZE: int = 16
HKDF_IKM_BYTES: int = 32
"""Bytes of input keying material drawn from the entropy pool."""

HKDF_INFO_PSK: bytes = b"zipminator-mesh-psk-v1"
HKDF_INFO_SIPHASH: bytes = b"zipminator-mesh-siphash-v1"

DEFAULT_POOL_PATH: Path = Path("quantum_entropy/quantum_entropy_pool.bin")


# ---------------------------------------------------------------------------
# HKDF-SHA256 (RFC 5869)
# ---------------------------------------------------------------------------


def hkdf_extract(salt: bytes, ikm: bytes) -> bytes:
    """Return PRK = HMAC-SHA256(salt, ikm)."""
    return hmac.new(salt, ikm, hashlib.sha256).digest()


def hkdf_expand(prk: bytes, info: bytes, length: int) -> bytes:
    """Return OKM of ``length`` bytes."""
    if length > 255 * hashlib.sha256().digest_size:
        raise ValueError("HKDF expand output too long")
    t = b""
    okm = b""
    counter = 1
    while len(okm) < length:
        t = hmac.new(prk, t + info + bytes([counter]), hashlib.sha256).digest()
        okm += t
        counter += 1
    return okm[:length]


def hkdf_sha256(ikm: bytes, salt: bytes, info: bytes, length: int) -> bytes:
    """RFC 5869 HKDF-Extract+Expand under SHA-256."""
    return hkdf_expand(hkdf_extract(salt, ikm), info, length)


# ---------------------------------------------------------------------------
# Entropy reading
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class EntropySource:
    """Wraps a pool file and a fallback OS entropy source."""

    path: Path
    fallback_to_os_urandom: bool = True

    def read_ikm(self, length: int = HKDF_IKM_BYTES) -> bytes:
        if not self.path.exists():
            if not self.fallback_to_os_urandom:
                raise FileNotFoundError(f"entropy pool missing: {self.path}")
            return os.urandom(length)
        data = self.path.read_bytes()
        if len(data) < length:
            if not self.fallback_to_os_urandom:
                raise ValueError(
                    f"entropy pool {self.path} has {len(data)} bytes, need {length}"
                )
            # pad with /dev/urandom rather than reuse pool bytes
            return data + os.urandom(length - len(data))
        return data[:length]


# ---------------------------------------------------------------------------
# NVS binary builder
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class NvsBinary:
    """Parsed/synthesised NVS binary."""

    mesh_id: str
    psk: bytes
    siphash_key: bytes

    def to_bytes(self) -> bytes:
        return build_nvs_binary(self.mesh_id, self.psk, self.siphash_key)


def derive_keys(ikm: bytes, mesh_id: str, epoch: int) -> tuple[bytes, bytes]:
    """Derive PSK and SipHash key.

    Matches ``MeshProvisioner::derive_pair`` in
    ``crates/zipminator-mesh/src/provisioner.rs``.
    """
    salt = f"{mesh_id}:epoch:{epoch}".encode("utf-8")
    psk = hkdf_sha256(ikm, salt, HKDF_INFO_PSK, MESH_PSK_SIZE)
    siphash_key = hkdf_sha256(ikm, salt, HKDF_INFO_SIPHASH, SIPHASH_KEY_SIZE)
    return psk, siphash_key


def build_nvs_binary(mesh_id: str, psk: bytes, siphash_key: bytes) -> bytes:
    """Assemble the V1 NVS binary blob.

    Returns the concatenation of magic, mesh_id, both keys, and a SHA-256
    checksum over all preceding bytes.
    """
    if not mesh_id:
        raise ValueError("mesh_id must not be empty")
    if len(psk) != MESH_PSK_SIZE:
        raise ValueError(f"PSK must be {MESH_PSK_SIZE} bytes, got {len(psk)}")
    if len(siphash_key) != SIPHASH_KEY_SIZE:
        raise ValueError(
            f"SipHash key must be {SIPHASH_KEY_SIZE} bytes, got {len(siphash_key)}"
        )
    id_bytes = mesh_id.encode("utf-8")
    if len(id_bytes) > 0xFFFF:
        raise ValueError("mesh_id too long (max 65535 bytes)")

    header = NVS_MAGIC + struct.pack("<H", len(id_bytes)) + id_bytes
    payload = header + psk + siphash_key
    checksum = hashlib.sha256(payload).digest()
    return payload + checksum


def parse_nvs_binary(blob: bytes) -> NvsBinary:
    """Inverse of :func:`build_nvs_binary`. Raises on layout mismatch."""
    if len(blob) < len(NVS_MAGIC) + 2 + MESH_PSK_SIZE + SIPHASH_KEY_SIZE + NVS_CHECKSUM_SIZE:
        raise ValueError("blob too short to be a valid NVS binary")
    if blob[:6] != NVS_MAGIC:
        raise ValueError(f"invalid magic: expected {NVS_MAGIC!r}, got {blob[:6]!r}")
    payload, checksum = blob[:-NVS_CHECKSUM_SIZE], blob[-NVS_CHECKSUM_SIZE:]
    if hashlib.sha256(payload).digest() != checksum:
        raise ValueError("SHA-256 checksum mismatch")
    id_len = struct.unpack_from("<H", payload, 6)[0]
    mesh_id = payload[8 : 8 + id_len].decode("utf-8")
    psk_start = 8 + id_len
    sip_start = psk_start + MESH_PSK_SIZE
    psk = payload[psk_start:sip_start]
    siphash = payload[sip_start : sip_start + SIPHASH_KEY_SIZE]
    return NvsBinary(mesh_id=mesh_id, psk=psk, siphash_key=siphash)


# ---------------------------------------------------------------------------
# Public top-level API used by the script and the pytest
# ---------------------------------------------------------------------------


def provision_nvs(
    mesh_id: str,
    entropy_pool: Path = DEFAULT_POOL_PATH,
    epoch: int = 0,
    fallback_to_os_urandom: bool = True,
) -> bytes:
    """Read entropy from the pool and produce an NVS binary.

    Args:
        mesh_id: Network identifier; used as HKDF salt and embedded in the
            blob.
        entropy_pool: Path to the QRNG pool file.
        epoch: Rotation epoch (matches ``MeshProvisioner::epoch``).
        fallback_to_os_urandom: If ``True`` and the pool is missing or short,
            fall back to ``os.urandom`` rather than raising. Defaults to
            ``True`` because this script runs in CI environments where the
            pool may not yet be harvested.

    Returns:
        The full NVS binary as ``bytes``.
    """
    source = EntropySource(path=entropy_pool, fallback_to_os_urandom=fallback_to_os_urandom)
    ikm = source.read_ikm()
    psk, siphash_key = derive_keys(ikm, mesh_id, epoch)
    return build_nvs_binary(mesh_id, psk, siphash_key)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Cross-repo Zipminator → RuView NVS provisioner.",
    )
    parser.add_argument(
        "--mesh-id",
        required=True,
        help="Mesh network identifier (UTF-8, ≤65535 bytes).",
    )
    parser.add_argument(
        "--entropy-pool",
        type=Path,
        default=DEFAULT_POOL_PATH,
        help="Path to the QRNG entropy pool file (default: %(default)s).",
    )
    parser.add_argument(
        "--epoch",
        type=int,
        default=0,
        help="Rotation epoch counter (default: 0).",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Write the NVS binary to this path (default: stdout).",
    )
    parser.add_argument(
        "--hex",
        action="store_true",
        help="Print derived keys as hex to stderr (debug aid).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail if entropy pool is missing or short (no os.urandom fallback).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    blob = provision_nvs(
        mesh_id=args.mesh_id,
        entropy_pool=args.entropy_pool,
        epoch=args.epoch,
        fallback_to_os_urandom=not args.strict,
    )

    if args.hex:
        parsed = parse_nvs_binary(blob)
        print(f"mesh_id      = {parsed.mesh_id}", file=sys.stderr)
        print(f"epoch        = {args.epoch}", file=sys.stderr)
        print(f"PSK (hex)    = {parsed.psk.hex()}", file=sys.stderr)
        print(f"SipHash (hex)= {parsed.siphash_key.hex()}", file=sys.stderr)
        print(f"blob size    = {len(blob)} bytes", file=sys.stderr)

    if args.output is None:
        sys.stdout.buffer.write(blob)
    else:
        args.output.write_bytes(blob)
        print(f"wrote {len(blob)} bytes to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
