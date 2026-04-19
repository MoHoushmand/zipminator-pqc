"""PQC SMTP envelope encoder. Implements NIST FIPS 203 (ML-KEM-768) wiring."""

from __future__ import annotations

import base64
from typing import Dict

PQC_ALGORITHM = "ML-KEM-768"


def encode_pqc_envelope(
    from_addr: str,
    to_addr: str,
    subject: str,
    body: bytes,
    ml_kem_ciphertext: bytes,
) -> Dict[str, object]:
    """Serialize a PQC-wrapped email envelope; raises ValueError on empty ciphertext."""
    if not ml_kem_ciphertext:
        raise ValueError("ml_kem_ciphertext must not be empty")
    ciphertext_b64 = base64.b64encode(ml_kem_ciphertext).decode("ascii")
    body_b64 = base64.b64encode(body).decode("ascii")
    headers = {
        "From": from_addr,
        "To": to_addr,
        "Subject": subject,
        "X-PQC-Algorithm": PQC_ALGORITHM,
        "X-PQC-Ciphertext-B64": ciphertext_b64,
    }
    return {"headers": headers, "body_b64": body_b64}
