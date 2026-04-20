"""Iter 2: Owned api.src.mail.envelope wrapper contract.

The owned wrapper re-exports the canonical SMTP envelope encoder from
``zipminator.mail.smtp`` (inside ``src/`` layout) and attaches FIPS 203 /
ML-KEM-768 metadata so callers depend on one stable import path
(``api.src.mail.envelope``).
"""
from __future__ import annotations

import base64
import importlib
import importlib.util
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]


def _load():
    try:
        return importlib.import_module("api.src.mail.envelope")
    except ModuleNotFoundError as exc:
        pytest.fail(f"api.src.mail.envelope not importable: {exc}")


def _load_canonical_from_source():
    smtp_path = REPO_ROOT / "src" / "zipminator" / "mail" / "smtp.py"
    assert smtp_path.is_file(), f"canonical encoder missing: {smtp_path}"
    spec = importlib.util.spec_from_file_location(
        "zipminator_mail_smtp_test", smtp_path
    )
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_envelope_module_imports() -> None:
    mod = _load()
    assert hasattr(mod, "encode_pqc_envelope"), "encode_pqc_envelope missing"
    assert hasattr(mod, "PQC_ALGORITHM"), "PQC_ALGORITHM missing"
    assert hasattr(mod, "FIPS_STANDARD"), "FIPS_STANDARD missing"


def test_envelope_pqc_metadata() -> None:
    mod = _load()
    assert mod.PQC_ALGORITHM == "ML-KEM-768"
    assert mod.FIPS_STANDARD == "NIST FIPS 203"


def test_envelope_signature_matches_canonical() -> None:
    """The wrapper's encoder must share the canonical encoder's signature."""
    import inspect

    wrapper = _load()
    canonical = _load_canonical_from_source()
    sig_wrapper = inspect.signature(wrapper.encode_pqc_envelope)
    sig_canonical = inspect.signature(canonical.encode_pqc_envelope)
    assert sig_wrapper == sig_canonical, (
        f"wrapper signature {sig_wrapper} differs from canonical {sig_canonical}"
    )
    assert wrapper.PQC_ALGORITHM == canonical.PQC_ALGORITHM


def test_envelope_roundtrip_shape() -> None:
    mod = _load()
    envelope = mod.encode_pqc_envelope(
        from_addr="alice@zipminator.local",
        to_addr="bob@zipminator.local",
        subject="PQC test",
        body=b"hello, quantum world",
        ml_kem_ciphertext=b"\x01" * 1088,  # ML-KEM-768 ciphertext size
    )
    assert envelope["headers"]["X-PQC-Algorithm"] == "ML-KEM-768"
    assert envelope["headers"]["From"] == "alice@zipminator.local"
    assert envelope["headers"]["To"] == "bob@zipminator.local"
    assert envelope["headers"]["Subject"] == "PQC test"
    decoded = base64.b64decode(envelope["body_b64"])
    assert decoded == b"hello, quantum world"
    ct = base64.b64decode(envelope["headers"]["X-PQC-Ciphertext-B64"])
    assert len(ct) == 1088, "ML-KEM-768 ciphertext must be 1088 bytes"


def test_envelope_rejects_empty_ciphertext() -> None:
    mod = _load()
    with pytest.raises(ValueError):
        mod.encode_pqc_envelope(
            from_addr="a@b.c",
            to_addr="d@e.f",
            subject="x",
            body=b"",
            ml_kem_ciphertext=b"",
        )
