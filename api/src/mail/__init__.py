"""Zipminator Pillar 7: Quantum-Secure Email.

Public surface for API consumers. The canonical PQC envelope encoder lives
in ``src.zipminator.mail.smtp`` and is re-exported here so downstream code
pins against one stable import path.

Implements NIST FIPS 203 (ML-KEM-768) via X25519MLKEM768 hybrid TLS.
"""
from __future__ import annotations

from .envelope import (
    FIPS_STANDARD,
    PQC_ALGORITHM,
    encode_pqc_envelope,
)

__all__ = ["FIPS_STANDARD", "PQC_ALGORITHM", "encode_pqc_envelope"]
