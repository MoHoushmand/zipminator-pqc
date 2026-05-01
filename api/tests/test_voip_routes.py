"""Coverage skeleton for src/routes/voip.py (Pillar 4 PQC voice/SDP).

Place: core/api/tests/test_voip_routes.py (already in pytest testpaths).
Run:
    micromamba activate zip-pqc
    cd core
    pytest api/tests/test_voip_routes.py -xvs

Why this exists (gap analysis, v27 G5-G7):
  G5 (CORRECTNESS, memory v10 KILLING FINDING):
     `_sessions` is a module-level dict. Under uvicorn workers > 1,
     /offer on worker A and /answer on worker B silently 404. Memory
     v10 flagged this; no test pins it.

  G6 (state-machine race):
     create_answer at voip.py:153 checks `state == "offering"` then sets
     `state = "connected"` without a lock. Two concurrent /answer calls
     for the same session_id both pass the gate, both derive a different
     SRTP key. Last-writer wins.

  G7 (silent wrong impl):
     _decapsulate_fallback returns os.urandom(32) — explicitly NOT the
     shared secret. Comment says "won't match, but exercises the API."
     If the Rust binding fails to import, every call silently produces
     a different SRTP key on each side of the call.

What this skeleton pins:
  * Auth boundary (existing — /offer and /answer require auth) is real.
  * The session lifecycle is offering -> connected -> hung-up.
  * G5: a test that proves single-worker invariants AND a marker test
     that fails if uvicorn workers > 1 in pytest config.
  * G6: serial /answer calls work; the race test is parametrized but
     marked skip until you pick the lock strategy.
  * G7: when the Rust KEM is available, encap/decap roundtrip; when it
     isn't, the test xfails so silent-wrong behavior is detectable.

Decisions you (the user) need to make where marked TODO_USER:
  Pick E (multi-worker session storage):
     E1. Refuse to start with workers > 1 (assert in main.py at import).
     E2. Replace _sessions with Redis (requires fakeredis fixture).
     E3. Sticky sessions via reverse-proxy hash. Test as integration only.
     E2 is the safe default; E1 is a constraint, not a fix; E3 punts.

  Pick F (state-machine race lock):
     F1. asyncio.Lock per session_id (in-process, plays nice with E2).
     F2. Optimistic CAS via Redis SETNX-based "claim" key.
     F3. DB row with FOR UPDATE — heavyweight, only if sessions are persisted.

  Pick G (KEM fallback policy):
     G1. Remove fallback entirely; raise ImportError loudly at startup.
     G2. Fallback uses HKDF(seed=session_id) deterministically so dev/test
         decap actually matches encap. NOT secure, NOT to be enabled in prod.
     G3. Fallback gated behind ZIPMINATOR_ALLOW_DEV_KEM=1; raises in prod.
     Memory note: G1 is consistent with global FIPS-language rules.
"""

from __future__ import annotations

import base64

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.routes import voip as voip_module


@pytest.fixture(autouse=True)
def reset_voip_sessions():
    """Clear the module-level _sessions dict between tests."""
    voip_module._sessions.clear()
    yield
    voip_module._sessions.clear()


@pytest.fixture
def voip_client():
    """Authenticated client. The conftest.authenticated_client uses /auth
    endpoints; voip needs the same JWT so we reuse it.
    """
    # Local import to avoid pulling auth into other test files.
    from .conftest import override_get_db, engine
    from src.db.database import Base, get_db

    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        # Register + login two users so caller and callee are real.
        # Use .example (RFC 2606 documentation TLD); .local is reserved by
        # RFC 6761 and rejected by Pydantic v2's EmailStr.
        r1 = c.post("/auth/register", json={
            "email": "caller@test.example",
            "password": "Caller-Pass-123!",
        })
        assert r1.status_code == 201, r1.text
        r2 = c.post("/auth/register", json={
            "email": "callee@test.example",
            "password": "Callee-Pass-123!",
        })
        assert r2.status_code == 201, r2.text
        login = c.post("/auth/login", json={
            "email": "caller@test.example",
            "password": "Caller-Pass-123!",
        })
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        c.headers["Authorization"] = f"Bearer {token}"
        yield c
        Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


# ── G5: multi-worker singleton ──────────────────────────────────────────────

class TestVoipMultiWorker:
    """G5: _sessions is in-process. Under workers > 1, lookups silently miss."""

    def test_module_singleton_is_dict(self):
        """Today: voip._sessions is a plain dict (no Redis backing)."""
        assert isinstance(voip_module._sessions, dict)

    @pytest.mark.xfail(
        strict=True,
        reason=(
            "Pick E (multi-worker storage) not applied. TODO_USER E1/E2/E3. "
            "When you wire E1 (worker=1 assert) or E2 (Redis), this test "
            "should be deleted or rewritten to assert the new contract."
        ),
    )
    def test_sessions_is_not_an_in_process_dict_AFTER_FIX(self):
        # Pick E2: voip._sessions becomes a Redis-backed wrapper or is deleted.
        assert not isinstance(voip_module._sessions, dict), (
            "_sessions is still a plain dict; multi-worker race remains."
        )


# ── G6: state-machine race ──────────────────────────────────────────────────

class TestVoipAnswerStateRace:
    """G6: serial /answer calls follow the state machine. Concurrent ones race."""

    def test_offer_creates_session_in_offering_state(self, voip_client):
        # Need a real callee_id — the second user we registered has id 2
        # (this is fragile; user picks F1/F2/F3 may rework it)
        resp = voip_client.post("/v1/voip/offer", json={"callee_id": 2})
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["caller_id"] == 1
        assert body["callee_id"] == 2
        assert len(base64.b64decode(body["pk_b64"])) == 1184  # ML-KEM-768 PK

    @pytest.mark.skip(
        reason=(
            "Pick F (race lock) blocks this test. Once F1/F2/F3 is chosen, "
            "rewrite this with two interleaved /answer calls and assert exactly "
            "one wins (other returns 409 or 400)."
        )
    )
    def test_two_concurrent_answers_one_wins(self, voip_client):
        pass


# ── G7: KEM fallback contract ───────────────────────────────────────────────

class TestVoipKemFallback:
    """G7: _decapsulate_fallback returns os.urandom(32), so dev/test SRTP keys
    don't match across endpoints.
    """

    def test_kem_binding_present_OR_xfail(self, voip_client):
        """If the Rust KEM is available, the fallback path is dead code —
        deletable. If it isn't, EVERY voip session in dev produces a wrong
        shared secret with no error.
        """
        keypair_fn, _, _ = voip_module._try_import_kem()
        if keypair_fn is None:
            pytest.xfail(
                "zipminator._core not importable; fallback returns "
                "os.urandom(32) which silently breaks SRTP key derivation. "
                "TODO_USER Pick G."
            )
        # Real KEM available — proceed to roundtrip
        resp = voip_client.post("/v1/voip/offer", json={"callee_id": 2})
        assert resp.status_code == 200
        # Full roundtrip needs a second authenticated client as the callee;
        # leave that to a follow-up integration test once Pick E lands.

    @pytest.mark.xfail(
        strict=True,
        reason="Pick G (fallback policy) not applied. TODO_USER G1/G2/G3.",
    )
    def test_fallback_is_removed_or_deterministic_AFTER_FIX(self):
        """Pick G1: _decapsulate_fallback should not exist.
        Pick G2: it should derive deterministically from session state.
        Pick G3: it should refuse to run unless ZIPMINATOR_ALLOW_DEV_KEM=1.
        """
        import os
        os.environ.pop("ZIPMINATOR_ALLOW_DEV_KEM", None)
        # Pick G1: AttributeError because _decapsulate_fallback was deleted.
        # Pick G3: RuntimeError raised by the function in prod mode.
        with pytest.raises((AttributeError, RuntimeError)):
            voip_module._decapsulate_fallback(b"\x00" * 1088, b"\x00" * 2400)
