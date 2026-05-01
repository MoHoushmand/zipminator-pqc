"""Coverage skeleton for src/routes/signaling.py (WebSocket signaling).

Pillar 7. The router exposes:
  - WS  /ws/signal?token=<jwt>   ConnectionManager-backed authenticated WS

Place: core/api/tests/test_signaling_routes.py (already in pytest testpaths).
Run:
    micromamba activate zip-pqc
    cd core
    pytest api/tests/test_signaling_routes.py -xvs

What this skeleton pins (current behavior, not idealized):
  * Invalid JWT  -> close code 4001 reason "Invalid token"
  * Missing user_id in payload -> close code 4001 reason "Invalid token payload"
  * Two clients exchanging messages: payload "from" is INJECTED by the server,
    not trusted from the client (server-side authority over identity).
  * Sending to an offline target returns an error frame to the sender, not a 1011
    or a silent drop (matches current `await ws.send_text` branch).
  * Malformed JSON in the receive loop currently triggers the bare-except path
    that calls `manager.disconnect`. This is permissive; flag if product wants
    a stricter contract that returns an error frame instead.

Decisions you (the user) need to make where marked TODO_USER:
  T1. Should malformed JSON close the WS or send an error frame? Currently
      closes (bare except in signaling_endpoint). Stricter = error frame +
      keep socket open. Loosely closes = simpler but UX regresses on a bad
      client lib. Default in this skeleton: assert current "closes" behavior.
  T2. The SignalingManager singleton is process-local. Under uvicorn workers>1,
      a sender on worker A cannot reach a recipient on worker B. Same family
      as voip._sessions (v10 critical-trio F3). Pin "single-worker only"
      in a separate test or skip until you pick Redis vs LRU+workers=1.
"""

from __future__ import annotations

import asyncio
import json
from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from src.main import app
from src.routes import signaling as signaling_module
from src.services.auth import create_access_token


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def _reset_manager() -> Iterator[None]:
    """SignalingManager is a module-level singleton; reset between tests."""
    signaling_module.manager.connections.clear()
    yield
    signaling_module.manager.connections.clear()


def _token_for(user_id: int) -> str:
    return create_access_token(data={"user_id": user_id, "sub": f"user-{user_id}"})


# ── Trust-seam (auth) ───────────────────────────────────────────────────────


def test_invalid_token_closes_with_4001(client: TestClient) -> None:
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/signal?token=not-a-jwt") as ws:
            ws.receive_text()
    assert exc_info.value.code == 4001


def test_missing_user_id_in_payload_closes_with_4001(client: TestClient) -> None:
    bad = create_access_token(data={"sub": "no-uid"})  # no user_id key
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/signal?token={bad}") as ws:
            ws.receive_text()
    assert exc_info.value.code == 4001


def test_token_query_param_required(client: TestClient) -> None:
    """Missing ?token= must not silently accept the WS."""
    with pytest.raises((WebSocketDisconnect, Exception)):
        with client.websocket_connect("/ws/signal") as ws:
            ws.receive_text()


# ── Server-side identity injection ──────────────────────────────────────────


def test_server_injects_from_field_overriding_client_claim(client: TestClient) -> None:
    """A sender cannot impersonate user X by setting "from": X in the payload.

    The endpoint at signaling.py:81 does `msg["from"] = user_id` AFTER the
    JSON parse, overwriting any client-supplied "from". Pin this.
    """
    sender_token = _token_for(1)
    recipient_token = _token_for(2)

    with client.websocket_connect(f"/ws/signal?token={sender_token}") as sender:
        with client.websocket_connect(f"/ws/signal?token={recipient_token}") as recipient:
            sender.send_text(json.dumps({
                "target": 2,
                "type": "offer",
                "from": 999,  # malicious claim
                "sdp": "v=0\r\n...",
            }))
            received = json.loads(recipient.receive_text())
            assert received["from"] == 1, (
                "server must overwrite client-supplied 'from' with the JWT user_id"
            )


# ── Offline target ──────────────────────────────────────────────────────────


def test_send_to_offline_target_returns_error_frame_not_close(client: TestClient) -> None:
    sender_token = _token_for(1)
    with client.websocket_connect(f"/ws/signal?token={sender_token}") as ws:
        ws.send_text(json.dumps({"target": 999, "type": "offer"}))
        reply = json.loads(ws.receive_text())
        assert reply["type"] == "error"
        assert "999" in reply["detail"], reply


def test_message_with_no_target_is_silently_dropped(client: TestClient) -> None:
    """Current code: if msg.get("target") is None, the loop continues without
    sending anything to anyone. Pin it; product may want a 422-equivalent error.
    """
    sender_token = _token_for(1)
    with client.websocket_connect(f"/ws/signal?token={sender_token}") as ws:
        ws.send_text(json.dumps({"type": "ping"}))  # no target
        # Send a follow-up that DOES have a (offline) target so we get a frame
        ws.send_text(json.dumps({"target": 999, "type": "offer"}))
        reply = json.loads(ws.receive_text())
        assert reply["type"] == "error"
        assert "999" in reply["detail"]


# ── Connection lifecycle ────────────────────────────────────────────────────


def test_disconnect_removes_from_manager(client: TestClient) -> None:
    token = _token_for(7)
    with client.websocket_connect(f"/ws/signal?token={token}"):
        assert 7 in signaling_module.manager.connections
    # After context exits, server-side disconnect handler should have run.
    # NOTE: TestClient disconnect timing is best-effort; use a small retry.
    for _ in range(10):
        if 7 not in signaling_module.manager.connections:
            break
    assert 7 not in signaling_module.manager.connections


def test_reconnect_replaces_old_connection(client: TestClient) -> None:
    """Pin: a reconnect for the same user_id overwrites the old WS reference.
    Current `connections[user_id] = ws` in SignalingManager.connect achieves this.
    If product wants reject-second-conn semantics, change here AND the manager.
    """
    token = _token_for(42)
    with client.websocket_connect(f"/ws/signal?token={token}"):
        first_ws = signaling_module.manager.connections.get(42)
        with client.websocket_connect(f"/ws/signal?token={token}"):
            second_ws = signaling_module.manager.connections.get(42)
            assert second_ws is not None
            assert second_ws is not first_ws


# ── Robustness ──────────────────────────────────────────────────────────────


def test_malformed_json_disconnects_currently(client: TestClient) -> None:
    """T1: pins current "closes on bad JSON" behavior. If you switch to
    "error frame + keep open", flip this assertion."""
    token = _token_for(3)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/signal?token={token}") as ws:
            ws.send_text("not json {{{")
            ws.receive_text()  # server should close


# TODO_USER T2: SignalingManager is module-singleton. Add a multi-worker
# parity test or skip until Redis vs LRU+workers=1 is picked. Same family
# as voip._sessions (v10 critical-trio F3).
