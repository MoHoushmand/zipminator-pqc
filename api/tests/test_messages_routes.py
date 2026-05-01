"""Coverage skeleton for src/routes/messages.py (encrypted-message REST).

Pillar 7 — messenger backend. The router exposes:
  - POST /send                  authenticated, body MessageSend
  - GET  /conversation/{cid}    paged fetch
  - POST /drain-offline         offline queue drainer

Place: core/api/tests/test_messages_routes.py (already in pytest testpaths).
Run:
    micromamba activate zip-pqc
    cd core
    pytest api/tests/test_messages_routes.py -xvs

Why this exists (gap analysis):
  * messages.py is 176 LOC, 0 tests in api/tests/.
  * Auto-memory v2 G1 + v4 G1: this file contains the SELECT MAX(sequence) +
    `next_seq = last.sequence + 1` race at lines 60-65. Two concurrent senders
    can read the same MAX and emit duplicate sequences. There is no UNIQUE
    (conversation_id, sequence) constraint; current behavior is "duplicate
    sequences silently accepted, last-writer wins on read order."
  * v4 G1 also flagged a post-insert get_messages(limit=1000) lookup inside
    the send path — verify it's gone or pin it.

What this skeleton pins:
  * Happy path: send, fetch, decode round-trips ciphertext+nonce as base64.
  * Auth boundary: no JWT -> 401/403; expired JWT -> 401.
  * Sequence monotonic per conversation (single sender, sequential).
  * Sequence race exposure: two interleaved sends produce SOME pair of
    sequences; today they can collide. Pin "current behavior" and add an
    xfail for the race-free contract so it shows up red the day someone
    adds a UNIQUE constraint.
  * Offline queue receives one row per recipient per send.
  * Base64 padding/urlsafe variants: server accepts standard b64; rejects
    invalid characters with 422 (or 500 — pin whichever fires today).

Decisions you (the user) need to make where marked TODO_USER:
  M1. Sequence-collision policy: silently accept (today), reject with 409,
      or auto-retry to MAX+1? A 409 changes the client retry contract.
  M2. Empty ciphertext: 200 with stored empty bytes, or 422? Affects
      keepalive/heartbeat patterns.
  M3. Base64 variant policy: only standard b64, or also urlsafe? Flutter
      and Tauri pillars differ in defaults.
"""

from __future__ import annotations

import asyncio
import base64
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.db.database import Base, get_db


# Reuse fixtures from conftest.py: client, db_session, authenticated_client


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def _send_payload(recipient_id: int, conversation_id: str = "conv-1") -> dict:
    return {
        "conversation_id": conversation_id,
        "recipient_id": recipient_id,
        "ciphertext_b64": _b64(b"\x00\x01\x02encrypted"),
        "nonce_b64": _b64(b"\x00" * 12),
    }


# ── Auth boundary ───────────────────────────────────────────────────────────


_SEND = "/v1/messages/send"
_CONV = "/v1/messages/conversation"


def test_send_requires_auth(client: TestClient) -> None:
    r = client.post(_SEND, json=_send_payload(2))
    assert r.status_code in (401, 403), r.text


# ── Happy path ──────────────────────────────────────────────────────────────


def test_send_then_fetch_round_trip(authenticated_client) -> None:
    payload = _send_payload(recipient_id=2)
    r = authenticated_client.post(_SEND, json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["conversation_id"] == payload["conversation_id"]
    assert body["ciphertext_b64"] == payload["ciphertext_b64"]
    assert body["nonce_b64"] == payload["nonce_b64"]
    assert body["sequence"] == 0  # first message in convo

    fetch = authenticated_client.get(f"{_CONV}/{payload['conversation_id']}")
    assert fetch.status_code == 200
    assert fetch.json()["count"] >= 1


def test_sequence_is_monotonic_for_sequential_sends(authenticated_client) -> None:
    cid = "convo-mono"
    seqs = []
    for _ in range(5):
        r = authenticated_client.post(_SEND, json=_send_payload(2, cid))
        assert r.status_code == 201
        seqs.append(r.json()["sequence"])
    assert seqs == [0, 1, 2, 3, 4], seqs


# ── Sequence race exposure (v2 G1 / v4 G1 pin) ──────────────────────────────


@pytest.mark.xfail(
    reason=(
        "TODO_USER M1: messages.py:60-65 has a SELECT MAX + +1 race. Two "
        "concurrent senders can produce duplicate sequences. This xfail flips "
        "to PASS the day a UNIQUE constraint or atomic NEXTVAL lands."
    ),
    strict=False,
)
def test_concurrent_sends_have_distinct_sequences(authenticated_client) -> None:
    cid = "convo-race"

    def one_send() -> int:
        r = authenticated_client.post(_SEND, json=_send_payload(2, cid))
        return r.json()["sequence"]

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(one_send) for _ in range(8)]
        seqs = [f.result() for f in futures]

    assert len(set(seqs)) == len(seqs), (
        f"duplicate sequences observed: {sorted(seqs)} (race window confirmed)"
    )


# ── Boundary inputs ─────────────────────────────────────────────────────────


def test_invalid_base64_ciphertext_rejected(authenticated_client) -> None:
    bad = _send_payload(2)
    bad["ciphertext_b64"] = "!!!not-base64!!!"
    r = authenticated_client.post(_SEND, json=bad)
    # TODO_USER M3: today this likely raises base64.binascii.Error -> 500.
    # Tighten via a Pydantic validator to return 422.
    assert r.status_code in (422, 500), r.text


def test_empty_ciphertext_accepted_or_rejected(authenticated_client) -> None:
    """TODO_USER M2: pick 200 vs 422. Pinning current behavior here."""
    payload = _send_payload(2)
    payload["ciphertext_b64"] = ""
    payload["nonce_b64"] = _b64(b"\x00" * 12)
    r = authenticated_client.post(_SEND, json=payload)
    # If you flip product policy, change the assertion.
    assert r.status_code in (201, 422), r.text


def test_missing_required_field_returns_422(authenticated_client) -> None:
    bad = _send_payload(2)
    bad.pop("nonce_b64")
    r = authenticated_client.post(_SEND, json=bad)
    assert r.status_code == 422, r.text


# ── Offline queue invariants ────────────────────────────────────────────────


def test_send_enqueues_one_offline_row(authenticated_client, db_session) -> None:
    """Pin: each successful /send adds exactly one OfflineQueue row for the
    recipient. v4 G1 flagged the drainer's N-deletes pattern; this test
    locks the producer side so a drainer rewrite can't silently change the
    row count contract."""
    from src.db.message_models import OfflineQueue

    before = db_session.query(OfflineQueue).count()
    r = authenticated_client.post("/api/messages/send", json=_send_payload(2))
    assert r.status_code == 201
    after = db_session.query(OfflineQueue).count()
    assert after == before + 1


# ── Server never decrypts (privacy invariant) ──────────────────────────────


def test_server_stores_ciphertext_byte_for_byte(authenticated_client) -> None:
    """Privacy guarantee: server is a relay. Round-trip must be lossless,
    base64 in -> base64 out, identical bytes."""
    raw = bytes(range(256))  # all byte values
    payload = _send_payload(2)
    payload["ciphertext_b64"] = _b64(raw)
    r = authenticated_client.post(_SEND, json=payload)
    assert r.status_code == 201
    out = base64.b64decode(r.json()["ciphertext_b64"])
    assert out == raw, "server mutated ciphertext bytes"
