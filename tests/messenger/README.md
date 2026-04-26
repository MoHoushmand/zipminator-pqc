# PQC Messenger — Test Harness & Boot Paths

Closes the FEATURES.md Pillar 2 gap (E2E + WebSocket integration). All commands assume `micromamba activate zip-pqc` has been run.

## Boot the in-memory PQC signaling server

The Messenger pillar uses the standalone in-memory signaling server (`src/zipminator/messenger/signaling_server.py`). It does **not** require PostgreSQL or Redis, so it boots cleanly without Docker.

```bash
# Default port 8765
PYTHONPATH="$(pwd)/src" python -m uvicorn \
    zipminator.messenger.signaling_server:app \
    --host 0.0.0.0 --port 8765

# Or use the bundled CLI runner (alternative entrypoint):
python -m zipminator.messenger.signaling_server --port 8765
```

`PYTHONPATH=$(pwd)/src` is required when an older `zipminator` wheel is installed in the active environment; it forces uvicorn to load the in-tree source instead of the stale site-packages copy.

### Health-check

```bash
curl -s http://127.0.0.1:8765/health
# {"status":"ok","peers":0,"rooms":0}
```

### WebSocket endpoints

| Path | Description |
|---|---|
| `ws://localhost:8765/ws/{client_id}` | Legacy path used by browser/mobile clients |
| `ws://localhost:8765/ws/signal/{user_id}` | Marathon-spec path (Pillar 2 acceptance #2) |

Both paths share the same protocol; see the docstring on `ws_endpoint` for the JSON message schema (`create_room`, `join`, `leave`, `signal`, `message`, `broadcast`, `list_rooms`, `room_peers`, `ping`).

### Offline queue (MessageStore-backed)

When `app.state.message_store` is wired to a `MessageStore` instance (the e2e fixture does this; production stacks should do it during app startup), the server:

1. Drains undelivered messages on every WebSocket connect.
2. Persists `action=message` envelopes whose target peer is offline. The sender receives `{"type": "queued", "message_id": ...}` instead of an offline error.
3. Marks messages as delivered after they are pushed to the reconnecting recipient.

## Boot the full FastAPI API (legacy / production)

The legacy multi-router app at `api/src/main.py` requires PostgreSQL + Redis for the auth/messages/voip pillars. Skip this for Pillar 2 work — use the standalone signaling server above.

If you need the full app for cross-pillar work:

```bash
export DATABASE_URL='postgresql+psycopg2://zipminator:zipminator@localhost:5432/zipminator'
export SECRET_KEY='change-me-for-production'
PYTHONPATH=api python -m uvicorn api.src.main:app --port 8000
```

## Run the messenger test suite

```bash
# Pillar-specific tests (72 currently)
pytest tests/messenger/

# E2E roundtrip + offline queue scenario (the new acceptance gates)
pytest tests/messenger/test_e2e_roundtrip.py -v
```

Test layout:

| File | Purpose |
|---|---|
| `test_message_store.py` | SQLite-backed encrypted persistence (21 tests) |
| `test_messenger_routes.py` | REST API for messenger persistence (8 tests) |
| `test_offline_queue.py` | Offline queue drain semantics (6 tests) |
| `test_signaling.py` | Legacy `signaling.py` smoke (2 tests) |
| `test_signaling_server.py` | Full standalone signaling server (29 tests) |
| `test_e2e_roundtrip.py` | **NEW**: end-to-end PQ Messenger roundtrip + offline queue via WebSocket (6 tests) |

## Universal gates

```bash
cargo test --workspace --exclude zipbrowser
cargo clippy --workspace -- -D warnings
micromamba activate zip-pqc && pytest tests/messenger/
```
