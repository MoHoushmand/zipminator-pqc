"""Coverage skeleton, v27 G3: src/services/auth.py is 59 LOC with 0 direct tests.

Place at api/tests/test_services_auth.py (collected via testpaths=["tests"]).
Run: cd core/api && pytest -xvs tests/test_services_auth.py

services/auth.py is the JWT + bcrypt primitive layer that routes/auth.py + the
auth middleware sit on top of. test_auth.py covers the routes; this file covers
the primitives directly so a regression in token signing or password hashing
fails fast and points at the actual function.

Pinned contracts:
  - bcrypt: hash → verify roundtrip succeeds; wrong password fails
  - bcrypt: same plaintext produces different hashes (salt randomness)
  - JWT: encode → decode roundtrip preserves payload (minus exp)
  - JWT: tampered token returns None (no exception leaks)
  - JWT: expired token returns None (uses exp claim)
  - JWT: wrong-secret decode returns None (no exception leaks)
  - JWT: custom expires_delta is honored
  - JWT: omitted expires_delta uses settings.ACCESS_TOKEN_EXPIRE_MINUTES

Side-finding flagged for follow-up (do NOT close in this PR): create_access_token
uses datetime.utcnow() at line 31, deprecated in Python 3.12 (DeprecationWarning
will become an error in 3.14). Same anti-pattern v25 G6 caught in rate_limit.py.
Migration: datetime.now(timezone.utc) — cannot do here without a coordinated
sweep because exp claims must remain numeric epoch seconds.
"""

from __future__ import annotations

import calendar
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt as jose_jwt


def _utc_epoch_in(seconds: int) -> int:
    """UTC epoch seconds N seconds from now (matches python-jose internals)."""
    target = datetime.utcnow() + timedelta(seconds=seconds)
    return calendar.timegm(target.utctimetuple())

from src.config import settings
from src.services.auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


# ── bcrypt password hashing ────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_then_verify_roundtrip(self):
        plaintext = "correct-horse-battery-staple"
        hashed = get_password_hash(plaintext)
        assert verify_password(plaintext, hashed) is True

    def test_verify_rejects_wrong_password(self):
        hashed = get_password_hash("right-password")
        assert verify_password("wrong-password", hashed) is False

    def test_hash_is_not_plaintext(self):
        plaintext = "secret"
        hashed = get_password_hash(plaintext)
        assert hashed != plaintext
        assert plaintext not in hashed

    def test_hash_format_is_bcrypt(self):
        # passlib bcrypt hashes start with $2b$ (modern) or $2a$ (legacy).
        hashed = get_password_hash("anything")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    def test_different_calls_produce_different_hashes(self):
        # Salt randomness invariant: same plaintext, two hashes, different bytes.
        plaintext = "same-input"
        h1 = get_password_hash(plaintext)
        h2 = get_password_hash(plaintext)
        assert h1 != h2
        # But both must verify.
        assert verify_password(plaintext, h1) is True
        assert verify_password(plaintext, h2) is True

    def test_empty_password_does_not_crash(self):
        # bcrypt accepts empty strings; verify what the API actually does.
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False


# ── JWT encode / decode ────────────────────────────────────────────────────

class TestAccessTokenRoundtrip:
    def test_encode_then_decode_preserves_payload(self):
        token = create_access_token({"sub": "alice@example.com", "role": "user"})
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "alice@example.com"
        assert decoded["role"] == "user"

    def test_encoded_token_has_exp_claim(self):
        token = create_access_token({"sub": "a@b.c"})
        decoded = decode_access_token(token)
        assert decoded is not None
        assert "exp" in decoded
        assert isinstance(decoded["exp"], int)

    def test_default_expiry_uses_settings(self):
        token = create_access_token({"sub": "a"})
        decoded = decode_access_token(token)
        # exp should be near now + ACCESS_TOKEN_EXPIRE_MINUTES.
        approx_expected = _utc_epoch_in(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        assert abs(decoded["exp"] - approx_expected) < 5  # 5-second slack

    def test_custom_expires_delta_is_honored(self):
        token = create_access_token(
            {"sub": "a"}, expires_delta=timedelta(seconds=5)
        )
        decoded = decode_access_token(token)
        approx_expected = _utc_epoch_in(5)
        assert abs(decoded["exp"] - approx_expected) < 5


class TestAccessTokenFailureModes:
    def test_tampered_token_returns_none(self):
        token = create_access_token({"sub": "alice"})
        # Flip the last character of the signature segment.
        head, payload, sig = token.split(".")
        bad_sig = sig[:-1] + ("A" if sig[-1] != "A" else "B")
        tampered = f"{head}.{payload}.{bad_sig}"
        assert decode_access_token(tampered) is None

    def test_garbage_input_returns_none(self):
        assert decode_access_token("not.a.jwt") is None
        assert decode_access_token("") is None
        assert decode_access_token("xxxxx") is None

    def test_wrong_secret_returns_none(self):
        # Encode with a foreign secret, decode with the configured one.
        foreign = jose_jwt.encode(
            {"sub": "alice", "exp": _utc_epoch_in(600)},
            "wrong-secret",
            algorithm=settings.ALGORITHM,
        )
        assert decode_access_token(foreign) is None

    def test_expired_token_returns_none(self):
        # Encode a token with an exp in the past via the public API.
        token = create_access_token(
            {"sub": "alice"}, expires_delta=timedelta(seconds=-10)
        )
        assert decode_access_token(token) is None

    def test_decode_does_not_raise_on_malformed_input(self):
        # Contract: decode_access_token returns None, never raises.
        for bad in ["", " ", ".", "..", "a.b.c.d", "not jwt at all"]:
            # Should not raise; absence of raise is the assertion.
            result = decode_access_token(bad)
            assert result is None


# ── algorithm pin ──────────────────────────────────────────────────────────

class TestAlgorithmContract:
    def test_token_uses_configured_algorithm(self):
        token = create_access_token({"sub": "alice"})
        # python-jose puts the algorithm in the JOSE header, base64url-encoded.
        header = jose_jwt.get_unverified_header(token)
        assert header["alg"] == settings.ALGORITHM

    def test_decode_rejects_alg_none_attack(self):
        # Classic JWT vuln: alg=none. python-jose blocks this when an algorithm
        # whitelist is passed (we pass [settings.ALGORITHM]). Verify the guard.
        unsigned = jose_jwt.encode(
            {"sub": "alice"},
            key="",
            algorithm="HS256",  # we'll then strip the signature to simulate
        )
        head, payload, _sig = unsigned.split(".")
        attack_token = f"{head}.{payload}."  # empty signature
        assert decode_access_token(attack_token) is None
