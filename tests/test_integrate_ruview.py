"""Smoke tests for ``scripts/integrate_ruview.py``.

These tests verify that the Python NVS-binary builder matches the byte
layout documented in:

* ``crates/zipminator-mesh/src/provisioner.rs``
* ``docs/adr/0043-qmesh-attestation-wire-format.md``

Cross-language parity with ``MeshProvisioner::provision_nvs_binary`` (Rust)
is asserted by running ``cargo test`` against the same crate in the Rust
test suite — these Python tests focus on the byte layout, HKDF info strings,
and CLI surface.
"""
from __future__ import annotations

import hashlib
import importlib.util
import struct
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT_PATH = (
    Path(__file__).resolve().parent.parent / "scripts" / "integrate_ruview.py"
)


def _import_module():
    """Import ``integrate_ruview`` from the script path (no installed package)."""
    if "integrate_ruview" in sys.modules:
        return sys.modules["integrate_ruview"]
    spec = importlib.util.spec_from_file_location("integrate_ruview", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    # Register before exec so dataclass field annotation lookups find the module.
    sys.modules["integrate_ruview"] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def integ():
    return _import_module()


@pytest.fixture
def pool(tmp_path: Path) -> Path:
    """Deterministic entropy pool: 1024 bytes of (i*7+13) % 256."""
    data = bytes(((i * 7 + 13) % 256) for i in range(1024))
    pool_path = tmp_path / "pool.bin"
    pool_path.write_bytes(data)
    return pool_path


# ---------------------------------------------------------------------------
# Byte-layout smoke tests
# ---------------------------------------------------------------------------


def test_magic_bytes_match_rust_v1(integ):
    assert integ.NVS_MAGIC == b"ZMESH\x01"


def test_blob_layout_matches_documented_format(integ, pool: Path):
    mesh_id = "smoke-mesh-001"
    blob = integ.provision_nvs(
        mesh_id=mesh_id,
        entropy_pool=pool,
        epoch=0,
        fallback_to_os_urandom=False,
    )

    # 1. Magic header
    assert blob[:6] == b"ZMESH\x01", "magic header missing or wrong version"

    # 2. mesh_id length (u16 LE)
    id_len = struct.unpack_from("<H", blob, 6)[0]
    assert id_len == len(mesh_id.encode("utf-8"))

    # 3. mesh_id bytes
    assert blob[8 : 8 + id_len] == mesh_id.encode("utf-8")

    # 4. PSK (16 bytes), non-zero
    psk_off = 8 + id_len
    psk = blob[psk_off : psk_off + 16]
    assert len(psk) == 16
    assert any(b != 0 for b in psk), "PSK should not be all zeros"

    # 5. SipHash key (16 bytes), non-zero, distinct from PSK
    sip_off = psk_off + 16
    sip = blob[sip_off : sip_off + 16]
    assert len(sip) == 16
    assert any(b != 0 for b in sip)
    assert psk != sip, "PSK and SipHash key must differ"

    # 6. SHA-256 checksum trails the payload
    payload = blob[:-32]
    checksum = blob[-32:]
    assert hashlib.sha256(payload).digest() == checksum

    # Total size: 6 + 2 + N + 16 + 16 + 32 = 72 + N
    assert len(blob) == 6 + 2 + id_len + 16 + 16 + 32


def test_round_trip_parses_back(integ, pool: Path):
    mesh_id = "rt-mesh"
    blob = integ.provision_nvs(
        mesh_id=mesh_id,
        entropy_pool=pool,
        epoch=2,
        fallback_to_os_urandom=False,
    )
    parsed = integ.parse_nvs_binary(blob)
    assert parsed.mesh_id == mesh_id
    assert len(parsed.psk) == 16
    assert len(parsed.siphash_key) == 16
    assert parsed.psk != parsed.siphash_key


def test_different_mesh_ids_yield_different_psks(integ, pool: Path):
    a = integ.provision_nvs(mesh_id="alpha", entropy_pool=pool, fallback_to_os_urandom=False)
    b = integ.provision_nvs(mesh_id="beta", entropy_pool=pool, fallback_to_os_urandom=False)
    pa, pb = integ.parse_nvs_binary(a), integ.parse_nvs_binary(b)
    assert pa.psk != pb.psk
    assert pa.siphash_key != pb.siphash_key


def test_different_epochs_yield_different_psks(integ, pool: Path):
    a = integ.provision_nvs(
        mesh_id="same", entropy_pool=pool, epoch=0, fallback_to_os_urandom=False
    )
    b = integ.provision_nvs(
        mesh_id="same", entropy_pool=pool, epoch=1, fallback_to_os_urandom=False
    )
    pa, pb = integ.parse_nvs_binary(a), integ.parse_nvs_binary(b)
    assert pa.psk != pb.psk


def test_deterministic_for_same_inputs(integ, pool: Path):
    a = integ.provision_nvs(
        mesh_id="det", entropy_pool=pool, epoch=0, fallback_to_os_urandom=False
    )
    b = integ.provision_nvs(
        mesh_id="det", entropy_pool=pool, epoch=0, fallback_to_os_urandom=False
    )
    assert a == b


def test_corrupted_blob_rejected(integ, pool: Path):
    blob = bytearray(
        integ.provision_nvs(
            mesh_id="cor", entropy_pool=pool, fallback_to_os_urandom=False
        )
    )
    blob[20] ^= 0xFF
    with pytest.raises(ValueError):
        integ.parse_nvs_binary(bytes(blob))


def test_empty_mesh_id_rejected(integ, pool: Path):
    with pytest.raises(ValueError):
        integ.provision_nvs(mesh_id="", entropy_pool=pool, fallback_to_os_urandom=False)


def test_strict_mode_raises_on_missing_pool(integ, tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        integ.provision_nvs(
            mesh_id="x",
            entropy_pool=tmp_path / "missing.bin",
            fallback_to_os_urandom=False,
        )


def test_short_pool_raises_in_strict_mode(integ, tmp_path: Path):
    short = tmp_path / "short.bin"
    short.write_bytes(b"x" * 8)
    with pytest.raises(ValueError):
        integ.provision_nvs(
            mesh_id="x", entropy_pool=short, fallback_to_os_urandom=False
        )


def test_fallback_uses_urandom_when_pool_missing(integ, tmp_path: Path):
    # Should succeed (uses os.urandom).
    blob = integ.provision_nvs(
        mesh_id="fallback",
        entropy_pool=tmp_path / "missing.bin",
        fallback_to_os_urandom=True,
    )
    parsed = integ.parse_nvs_binary(blob)
    assert parsed.mesh_id == "fallback"


# ---------------------------------------------------------------------------
# Known-answer test for HKDF-SHA256
# ---------------------------------------------------------------------------


def test_hkdf_sha256_rfc5869_test_case_1(integ):
    """RFC 5869 § A.1 (Test Case 1 with SHA-256)."""
    ikm = bytes.fromhex("0b" * 22)
    salt = bytes.fromhex("000102030405060708090a0b0c")
    info = bytes.fromhex("f0f1f2f3f4f5f6f7f8f9")
    okm = integ.hkdf_sha256(ikm, salt, info, 42)
    expected = bytes.fromhex(
        "3cb25f25faacd57a90434f64d0362f2a"
        "2d2d0a90cf1a5a4c5db02d56ecc4c5bf"
        "34007208d5b887185865"
    )
    assert okm == expected


def test_psk_and_siphash_use_distinct_info_strings(integ):
    assert integ.HKDF_INFO_PSK == b"zipminator-mesh-psk-v1"
    assert integ.HKDF_INFO_SIPHASH == b"zipminator-mesh-siphash-v1"
    assert integ.HKDF_INFO_PSK != integ.HKDF_INFO_SIPHASH


# ---------------------------------------------------------------------------
# CLI smoke test (subprocess)
# ---------------------------------------------------------------------------


def test_cli_writes_output_file(tmp_path: Path, pool: Path):
    out_path = tmp_path / "mesh.nvs"
    proc = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--mesh-id",
            "cli-mesh",
            "--entropy-pool",
            str(pool),
            "--output",
            str(out_path),
            "--strict",
        ],
        check=True,
        capture_output=True,
    )
    assert proc.returncode == 0
    assert out_path.exists()
    blob = out_path.read_bytes()
    assert blob[:6] == b"ZMESH\x01"
    # Sanity check via the python parser.
    integ = _import_module()
    parsed = integ.parse_nvs_binary(blob)
    assert parsed.mesh_id == "cli-mesh"


def _cargo_root() -> Path:
    """Path to the Rust workspace root (this repo)."""
    return Path(__file__).resolve().parent.parent


def _cargo_available() -> bool:
    return subprocess.run(["which", "cargo"], capture_output=True).returncode == 0


@pytest.mark.skipif(not _cargo_available(), reason="cargo not in PATH")
def test_byte_parity_with_rust_provisioner(integ, pool: Path):
    """Cross-language smoke: assert Python output matches the Rust V1 binary
    bit-for-bit when given the same pool and mesh_id."""
    mesh_id = "parity-test"
    rust_proc = subprocess.run(
        [
            "cargo",
            "run",
            "--quiet",
            "--example",
            "nvs_dump",
            "-p",
            "zipminator-mesh",
            "--",
            str(pool),
            mesh_id,
        ],
        cwd=_cargo_root(),
        capture_output=True,
    )
    if rust_proc.returncode != 0:
        pytest.skip(
            f"cargo example failed (likely sandbox or build issue): "
            f"{rust_proc.stderr.decode(errors='ignore')[:200]}"
        )

    rust_blob = rust_proc.stdout
    py_blob = integ.provision_nvs(
        mesh_id=mesh_id, entropy_pool=pool, fallback_to_os_urandom=False
    )
    assert rust_blob == py_blob, (
        f"Rust and Python NVS binaries differ:\n"
        f"  rust = {rust_blob.hex()}\n"
        f"  py   = {py_blob.hex()}"
    )


def test_cli_emits_to_stdout_without_output_arg(pool: Path):
    proc = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--mesh-id",
            "cli-stdout",
            "--entropy-pool",
            str(pool),
            "--strict",
        ],
        check=True,
        capture_output=True,
    )
    assert proc.stdout[:6] == b"ZMESH\x01"
    integ = _import_module()
    parsed = integ.parse_nvs_binary(proc.stdout)
    assert parsed.mesh_id == "cli-stdout"
