"""Owned wrapper around the canonical PQC SMTP envelope encoder.

This module is the stable public import path for API routes that need to
serialize a PQC-wrapped email envelope. The actual encoder lives in
``zipminator.mail.smtp`` (inside the ``src/`` layout, non-owned); the
wrapper re-exports it so callers do not need to know the internal path.

When the ``zipminator`` package is not installed into site-packages (e.g.
running pytest directly from a checkout without ``maturin develop``), we
fall back to loading the module from the filesystem at
``<repo>/src/zipminator/mail/smtp.py``.

Implements NIST FIPS 203 (ML-KEM-768).
"""
from __future__ import annotations

import importlib.util
from pathlib import Path


def _load_canonical():
    try:
        import zipminator.mail.smtp as mod  # type: ignore[import-not-found]

        return mod
    except ModuleNotFoundError:
        pass

    # Fallback: load by path. api/src/mail/envelope.py -> repo root is 3 up.
    repo_root = Path(__file__).resolve().parents[3]
    smtp_path = repo_root / "src" / "zipminator" / "mail" / "smtp.py"
    if not smtp_path.is_file():
        raise ModuleNotFoundError(
            f"canonical PQC envelope encoder missing at {smtp_path}"
        )
    spec = importlib.util.spec_from_file_location(
        "zipminator_mail_smtp_canonical", smtp_path
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"could not build spec for {smtp_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_canonical = _load_canonical()

PQC_ALGORITHM: str = _canonical.PQC_ALGORITHM
encode_pqc_envelope = _canonical.encode_pqc_envelope

FIPS_STANDARD = "NIST FIPS 203"

__all__ = ["FIPS_STANDARD", "PQC_ALGORITHM", "encode_pqc_envelope"]
