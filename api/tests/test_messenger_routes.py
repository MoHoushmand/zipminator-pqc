"""Coverage skeleton for src/routes/messenger.py (Pillar 7 lightweight messenger).

Place: core/api/tests/test_messenger_routes.py (already in pytest testpaths).
Run:
    micromamba activate zip-pqc
    cd core
    pytest api/tests/test_messenger_routes.py -xvs

Why this exists (gap analysis, v27 G1-G4):
  G1 (HIGH security, memory: "messenger.py routes unauthed"):
     ALL six endpoints lack `Depends(get_current_user)`. Anyone with the
     conversation_id can read/write/cleanup/group-fanout. Compare with
     voip.py which guards every endpoint with get_current_user.
  G2 (DoS): GET /messages/{cid}?limit=999999 is unbounded.
  G3 (logic bug): ttl_seconds has no min/max. ttl=0 may purge instantly,
     ttl=-1 is undefined, ttl=2**31-1 is ~68 years.
  G4 (DoS): POST /group-send with recipients=[<100K user IDs>] fans out
     unbounded inserts inside a single transaction.

What this skeleton pins:
  * The CURRENT (insecure) behavior, so a regression is detectable today.
  * xfail-strict tests for the SECURE behavior, which flip green the day
     auth/limits are wired in. xfail-strict means "if this passes
     unexpectedly, fail the suite" — protects against silent fix.

Decisions you (the user) need to make where marked TODO_USER:
  Pick A (auth strategy on messenger):
     A1. Add Depends(get_current_user) to every route, reject anonymous (401).
     A2. API key only via verify_api_key (matches /v1/keys + /v1/messages).
     A3. JWT + conversation membership: read-only requires you-are-in-the-conv,
         write requires you-are-the-sender. Fine-grained, more code.
     Pick shapes the fixture: A1 needs a logged-in user, A2 needs an API key
     header, A3 needs a conversation_membership table.

  Pick B (limit policy):
     B1. Hard cap MAX_LIMIT=200, return 422 above.
     B2. Silent clamp to 200 (lenient).
     B3. Configurable via env, default 200.
     Default in code today: limit=50, no cap.

  Pick C (ttl bounds):
     C1. Allowed range [60, 30*86400] (1 min to 30 days). 422 outside.
     C2. Allowed range [0, 365*86400], 0 means "purge on first cleanup".
     C3. Server overrides: clamp into [60, 30*86400] silently.

  Pick D (group-send recipient cap):
     D1. MAX_RECIPIENTS=100, 422 above (typical group chat).
     D2. MAX_RECIPIENTS=1000 (broadcast list).
     D3. Configurable per-conversation via DB row.
"""

from __future__ import annotations

import base64
import os

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.routes import messenger as messenger_module


# ── Local fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_messenger_singleton():
    """Reset the module-level _default_store before each test.

    The route module caches a MessageStore as _default_store on first call.
    Tests must not share state.
    """
    messenger_module._default_store = None
    # Force a fresh in-memory SQLite store
    os.environ["MESSENGER_DB_PATH"] = ":memory:"
    yield
    messenger_module._default_store = None


@pytest.fixture
def messenger_client():
    """Plain TestClient — no auth headers attached.

    This fixture is intentionally unauthenticated: it lets us prove that the
    routes accept anonymous calls today (G1), then later flip to xfail-strict
    once auth is wired in.
    """
    with TestClient(app) as c:
        yield c


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


# ── G1: Auth boundary (HIGH SECURITY) ───────────────────────────────────────

class TestMessengerAuthBoundary:
    """G1: messenger routes are unauthed today.

    These tests pin the CURRENT (insecure) behavior. When you (user) pick A1/A2/A3,
    flip the @pytest.mark.xfail(strict=True) decorators, and the green-on-fix
    assertions kick in.
    """

    def test_send_works_without_any_auth_header_TODAY(self, messenger_client):
        """Today: POST /api/messenger/send accepts anonymous senders."""
        resp = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-1",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"\x01\x02\x03"),
                "ttl_seconds": 3600,
            },
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["sender_id"] == "alice"
        assert body["delivered"] is False

    def test_get_conversation_works_without_auth_TODAY(self, messenger_client):
        """Today: GET /api/messenger/messages/{cid} returns to anyone."""
        # Seed a message
        messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-secret",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"top-secret-ct"),
                "ttl_seconds": 3600,
            },
        )
        # Anyone can read it
        resp = messenger_client.get("/api/messenger/messages/conv-secret")
        assert resp.status_code == 200, resp.text
        assert resp.json()["count"] == 1

    def test_cleanup_works_without_auth_TODAY(self, messenger_client):
        """Today: anyone can purge expired messages globally."""
        resp = messenger_client.post("/api/messenger/cleanup")
        assert resp.status_code == 200

    @pytest.mark.xfail(
        strict=True,
        reason=(
            "Pick A (auth strategy) not yet applied. When you wire "
            "Depends(get_current_user) into messenger.py, this assertion "
            "should flip to passing AND the three tests above should be "
            "rewritten or deleted."
        ),
    )
    def test_send_rejects_anonymous_AFTER_FIX(self, messenger_client):
        resp = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-1",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"\x01"),
            },
        )
        assert resp.status_code in (401, 403), (
            f"Expected auth rejection, got {resp.status_code}: {resp.text}"
        )

    @pytest.mark.xfail(
        strict=True,
        reason="Pick A: GET /messages/{cid} should require auth after fix.",
    )
    def test_get_conversation_rejects_anonymous_AFTER_FIX(self, messenger_client):
        resp = messenger_client.get("/api/messenger/messages/any-conv-id")
        assert resp.status_code in (401, 403)


# ── G2: Limit cap (DoS) ─────────────────────────────────────────────────────

class TestMessengerLimitCap:
    """G2: GET /messages/{cid}?limit=N has no upper bound today."""

    def test_huge_limit_accepted_TODAY(self, messenger_client):
        """Today: limit=999999 is accepted, server may scan large tables."""
        resp = messenger_client.get(
            "/api/messenger/messages/conv-x?limit=999999"
        )
        # Today returns 200 with empty list because conv-x has no messages.
        # The point is: the server didn't reject the absurd limit.
        assert resp.status_code == 200, resp.text

    @pytest.mark.xfail(
        strict=True,
        reason="Pick B (limit policy) not yet applied; TODO_USER B1/B2/B3.",
    )
    def test_limit_above_max_rejected_AFTER_FIX(self, messenger_client):
        resp = messenger_client.get(
            "/api/messenger/messages/conv-x?limit=999999"
        )
        # Pick B1: 422 with detail about MAX_LIMIT.
        # Pick B2: 200 but len(messages) <= 200 (silent clamp).
        # Pick B3: 422 unless env override is set.
        # Until you pick, we assert "something other than 200 with no cap":
        assert resp.status_code != 200 or len(resp.json()["messages"]) <= 200

    @pytest.mark.xfail(
        strict=True,
        reason="Pick B: negative limit should be 422 after validation hardening.",
    )
    def test_negative_limit_rejected_AFTER_FIX(self, messenger_client):
        resp = messenger_client.get("/api/messenger/messages/conv-x?limit=-1")
        assert resp.status_code == 422


# ── G3: TTL bounds (logic bug) ──────────────────────────────────────────────

class TestMessengerTtlBounds:
    """G3: ttl_seconds has no enforced min/max today."""

    def test_ttl_zero_currently_accepted(self, messenger_client):
        """Today: ttl=0 is accepted. May purge on first cleanup tick."""
        resp = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-ttl0",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"x"),
                "ttl_seconds": 0,
            },
        )
        assert resp.status_code == 201, resp.text

    def test_ttl_huge_currently_accepted(self, messenger_client):
        """Today: ttl=2**31-1 (~68 years) is accepted."""
        resp = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-ttl-max",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"x"),
                "ttl_seconds": 2**31 - 1,
            },
        )
        assert resp.status_code == 201

    @pytest.mark.xfail(
        strict=True,
        reason="Pick C (ttl bounds) not applied. TODO_USER C1/C2/C3.",
    )
    def test_ttl_negative_rejected_AFTER_FIX(self, messenger_client):
        resp = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-ttl-neg",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"x"),
                "ttl_seconds": -1,
            },
        )
        assert resp.status_code == 422


# ── G4: group-send recipient cap (DoS) ──────────────────────────────────────

class TestMessengerGroupRecipients:
    """G4: POST /group-send has no max recipients."""

    def test_huge_recipient_list_accepted_TODAY(self, messenger_client):
        """Today: 5K recipient IDs fan out 5K inserts in a single request."""
        recipients = [f"user-{i}" for i in range(5000)]
        resp = messenger_client.post(
            "/api/messenger/group-send",
            json={
                "conversation_id": "conv-bcast",
                "sender_id": "alice",
                "recipients": recipients,
                "ciphertext_b64": _b64(b"announcement"),
                "ttl_seconds": 3600,
            },
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["count"] == 5000

    def test_empty_recipient_list_silently_accepted_TODAY(self, messenger_client):
        """Today: recipients=[] returns count=0; no error.

        This is an interesting edge: a client bug that produces an empty list
        silently no-ops the send with no signal to the user.
        """
        resp = messenger_client.post(
            "/api/messenger/group-send",
            json={
                "conversation_id": "conv-empty",
                "sender_id": "alice",
                "recipients": [],
                "ciphertext_b64": _b64(b"x"),
                "ttl_seconds": 3600,
            },
        )
        assert resp.status_code == 201
        assert resp.json()["count"] == 0

    @pytest.mark.xfail(
        strict=True,
        reason="Pick D (recipient cap) not applied. TODO_USER D1/D2/D3.",
    )
    def test_recipients_above_cap_rejected_AFTER_FIX(self, messenger_client):
        resp = messenger_client.post(
            "/api/messenger/group-send",
            json={
                "conversation_id": "conv-bcast",
                "sender_id": "alice",
                "recipients": [f"user-{i}" for i in range(5000)],
                "ciphertext_b64": _b64(b"x"),
                "ttl_seconds": 3600,
            },
        )
        assert resp.status_code == 422


# ── Side-finding: post-insert lookup at messenger.py:108-109 ─────────────────

class TestPostInsertLookup:
    """v27 side-finding aligned with v3 F2 (messages.py).

    messenger.py line 101-112: store(...) returns msg_id, then code does
    `messages = store.get_messages(conversation_id, limit=1000)` and scans
    by id. O(n) per send and races: in a busy conversation, the message
    could fall outside the 1000-message window.
    """

    def test_send_in_busy_conversation_can_miss_own_message_TODAY(
        self, messenger_client
    ):
        """Today: if get_messages returns by descending timestamp and the
        conversation has 1000+ messages, the freshly-stored one might be
        outside the window for fast inserts. We exercise the contract here
        without exhausting 1000 — the point is to leave a regression hook
        in place for when someone replaces the lookup with `store.get(id)`.
        """
        # Seed 50 messages
        for i in range(50):
            r = messenger_client.post(
                "/api/messenger/send",
                json={
                    "conversation_id": "conv-busy",
                    "sender_id": "alice",
                    "recipient_id": "bob",
                    "ciphertext_b64": _b64(f"m{i}".encode()),
                    "ttl_seconds": 3600,
                },
            )
            assert r.status_code == 201, r.text
        # 51st send should still find its message (1000-window is large enough)
        r = messenger_client.post(
            "/api/messenger/send",
            json={
                "conversation_id": "conv-busy",
                "sender_id": "alice",
                "recipient_id": "bob",
                "ciphertext_b64": _b64(b"final"),
                "ttl_seconds": 3600,
            },
        )
        assert r.status_code == 201
        # When you replace the post-insert lookup with `store.get(msg_id)`,
        # the same test will still pass — but it will be O(1) instead of O(50).
        # Add a perf-budget assertion here once you measure baseline.
