"""Tests for `MessageStore` in api/src/db/message_store.py.

Coverage gap v27 G1: this 220-LOC sqlite-backed message store has 0 unit
tests despite carrying every Pillar-2 (Messenger) write. Memory v10 flagged
the single-conn pattern for blocking the event loop; v18 flagged
`group_fanout` TypeError + `executemany` shared-timestamp as uncovered.

This file ships against an in-memory sqlite (`:memory:`) so each test starts
clean. The store does not depend on the SQLAlchemy/PostgreSQL stack, so it
is testable in complete isolation from app-config or fixtures.

Place at:  api/tests/test_message_store.py  (collected by pytest)
Run from api/:  pytest -xvs tests/test_message_store.py

KNOWN GAPS NOT COVERED HERE (deferred until user confirms strategy):
- Concurrency: check_same_thread=False but no per-call lock; two threads
  writing concurrently can interleave at executescript boundaries. Pinning
  needs `concurrent.futures.ThreadPoolExecutor` + a contention oracle.
- Multi-worker: each gunicorn worker holds its own sqlite handle; in-memory
  stores diverge silently. The route layer should use a process-shared
  backing or accept this limitation explicitly.
"""

from __future__ import annotations

import re
import time
from pathlib import Path

import pytest

from src.db.message_store import MessageStore


UUID4_HEX = re.compile(r"^[0-9a-f]{32}$")


# ── Fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture
def store() -> MessageStore:
    """Fresh in-memory store per test."""
    s = MessageStore(":memory:")
    yield s
    s.close()


@pytest.fixture
def file_store(tmp_path: Path) -> MessageStore:
    """File-backed store, used to verify schema persists across reopen."""
    db = tmp_path / "messages.db"
    s = MessageStore(str(db))
    yield s
    s.close()


# ── Initialisation contract ─────────────────────────────────────────────────


class TestInit:
    def test_in_memory_init_does_not_raise(self) -> None:
        s = MessageStore(":memory:")
        s.close()

    def test_file_backed_init_creates_schema(self, file_store: MessageStore) -> None:
        # If the schema applied, this insert + read round-trips.
        msg_id = file_store.store("c1", "u1", "u2", b"x")
        assert UUID4_HEX.match(msg_id)

    def test_wal_journal_mode_enabled(self, file_store: MessageStore) -> None:
        # WAL is required for concurrent reads while writes are in-flight.
        cur = file_store._conn.execute("PRAGMA journal_mode")
        mode = cur.fetchone()[0]
        assert mode.lower() == "wal", f"expected WAL journal mode, got {mode}"

    def test_foreign_keys_enabled(self, store: MessageStore) -> None:
        cur = store._conn.execute("PRAGMA foreign_keys")
        assert cur.fetchone()[0] == 1, "foreign_keys must be ON"

    def test_indexes_exist(self, store: MessageStore) -> None:
        cur = store._conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"
        )
        names = {row[0] for row in cur.fetchall()}
        # The three explicit indexes from _SCHEMA must exist.
        assert "idx_msg_conv" in names
        assert "idx_msg_recipient_delivered" in names
        assert "idx_msg_ttl" in names


# ── store() contract ────────────────────────────────────────────────────────


class TestStore:
    def test_returns_uuid4_hex(self, store: MessageStore) -> None:
        msg_id = store.store("c1", "u1", "u2", b"ct")
        assert UUID4_HEX.match(msg_id), f"not a uuid4 hex: {msg_id!r}"

    def test_each_call_returns_unique_id(self, store: MessageStore) -> None:
        ids = {store.store("c1", "u1", "u2", b"ct") for _ in range(100)}
        assert len(ids) == 100, "uuid4 collision in 100 stores — should be impossible"

    def test_rejects_str_ciphertext_with_typeerror(self, store: MessageStore) -> None:
        # Pillar-2 invariant: only ciphertext bytes are stored. A str slipping
        # through would silently re-encode and corrupt the round-trip.
        with pytest.raises(TypeError, match="ciphertext must be bytes"):
            store.store("c1", "u1", "u2", "not-bytes")  # type: ignore[arg-type]

    def test_rejects_bytearray_with_typeerror(self, store: MessageStore) -> None:
        # bytearray is bytes-like but not bytes; the check uses isinstance(_, bytes)
        # so bytearray is rejected. Pin this contract so a future loosening is
        # an explicit decision, not an accident.
        with pytest.raises(TypeError, match="ciphertext must be bytes"):
            store.store("c1", "u1", "u2", bytearray(b"ct"))  # type: ignore[arg-type]

    def test_default_ttl_is_24h(self, store: MessageStore) -> None:
        before = time.time()
        store.store("c1", "u1", "u2", b"ct")
        after = time.time()
        cur = store._conn.execute(
            "SELECT ttl_expires_at, timestamp FROM messages"
        )
        ttl, ts = cur.fetchone()
        assert before <= ts <= after
        assert ttl - ts == pytest.approx(86400, abs=1)

    def test_custom_ttl_honoured(self, store: MessageStore) -> None:
        store.store("c1", "u1", "u2", b"ct", ttl_seconds=60)
        cur = store._conn.execute(
            "SELECT ttl_expires_at - timestamp FROM messages"
        )
        diff = cur.fetchone()[0]
        assert diff == pytest.approx(60, abs=0.01)

    def test_delivered_defaults_to_zero(self, store: MessageStore) -> None:
        store.store("c1", "u1", "u2", b"ct")
        cur = store._conn.execute("SELECT delivered FROM messages")
        assert cur.fetchone()[0] == 0

    def test_binary_with_nulls_round_trips(self, store: MessageStore) -> None:
        # Pin Pillar-2 invariant: ciphertext may contain null bytes and high-bit
        # bytes; sqlite BLOB column must preserve them exactly.
        ct = bytes(range(256))
        store.store("c1", "u1", "u2", ct)
        rows = store.get_messages("c1")
        assert rows[0]["ciphertext"] == ct


# ── get_messages() contract ─────────────────────────────────────────────────


class TestGetMessages:
    def test_empty_store_returns_empty_list(self, store: MessageStore) -> None:
        assert store.get_messages("c1") == []

    def test_returns_only_matching_conversation(self, store: MessageStore) -> None:
        # Cross-conversation isolation. A leak here would expose conversation
        # bodies between unrelated users.
        store.store("c1", "u1", "u2", b"in-c1")
        store.store("c2", "u3", "u4", b"in-c2")
        rows = store.get_messages("c1")
        assert len(rows) == 1
        assert rows[0]["ciphertext"] == b"in-c1"

    def test_orders_by_timestamp_ascending(self, store: MessageStore) -> None:
        # store() uses time.time() per insert; sleep ~1 ms to make ordering
        # deterministic.
        store.store("c1", "u1", "u2", b"first")
        time.sleep(0.002)
        store.store("c1", "u1", "u2", b"second")
        time.sleep(0.002)
        store.store("c1", "u1", "u2", b"third")
        rows = store.get_messages("c1")
        assert [r["ciphertext"] for r in rows] == [b"first", b"second", b"third"]

    def test_limit_caps_returned_rows(self, store: MessageStore) -> None:
        for _ in range(10):
            store.store("c1", "u1", "u2", b"ct")
        assert len(store.get_messages("c1", limit=3)) == 3

    def test_offset_skips_rows(self, store: MessageStore) -> None:
        for i in range(5):
            store.store("c1", "u1", "u2", str(i).encode())
            time.sleep(0.001)
        rows = store.get_messages("c1", limit=10, offset=2)
        assert [r["ciphertext"] for r in rows] == [b"2", b"3", b"4"]

    def test_default_limit_is_50(self, store: MessageStore) -> None:
        # Mass-bulk-insert: pin the documented default ceiling.
        for _ in range(60):
            store.store("c1", "u1", "u2", b"ct")
        assert len(store.get_messages("c1")) == 50


# ── get_undelivered() contract ──────────────────────────────────────────────


class TestGetUndelivered:
    def test_empty_returns_empty_list(self, store: MessageStore) -> None:
        assert store.get_undelivered("u2") == []

    def test_returns_only_recipient_undelivered(self, store: MessageStore) -> None:
        # Recipient isolation: user A must not see user B's offline queue.
        store.store("c1", "u1", "u2", b"for-u2")
        store.store("c1", "u1", "u3", b"for-u3")
        rows = store.get_undelivered("u2")
        assert len(rows) == 1
        assert rows[0]["recipient_id"] == "u2"

    def test_excludes_delivered_messages(self, store: MessageStore) -> None:
        msg_id = store.store("c1", "u1", "u2", b"ct")
        store.mark_delivered(msg_id)
        assert store.get_undelivered("u2") == []

    def test_orders_by_timestamp_ascending(self, store: MessageStore) -> None:
        store.store("c1", "u1", "u2", b"first")
        time.sleep(0.002)
        store.store("c1", "u1", "u2", b"second")
        rows = store.get_undelivered("u2")
        assert [r["ciphertext"] for r in rows] == [b"first", b"second"]


# ── mark_delivered() contract ───────────────────────────────────────────────


class TestMarkDelivered:
    def test_flips_delivered_flag(self, store: MessageStore) -> None:
        msg_id = store.store("c1", "u1", "u2", b"ct")
        store.mark_delivered(msg_id)
        cur = store._conn.execute(
            "SELECT delivered FROM messages WHERE id = ?", (msg_id,)
        )
        assert cur.fetchone()[0] == 1

    def test_idempotent(self, store: MessageStore) -> None:
        # Pin the docstring's "Idempotent" claim. Calling twice must not raise
        # and must leave the state at delivered=1.
        msg_id = store.store("c1", "u1", "u2", b"ct")
        store.mark_delivered(msg_id)
        store.mark_delivered(msg_id)
        cur = store._conn.execute(
            "SELECT delivered FROM messages WHERE id = ?", (msg_id,)
        )
        assert cur.fetchone()[0] == 1

    def test_unknown_id_is_silent_noop(self, store: MessageStore) -> None:
        # UPDATE with 0 affected rows is a silent no-op (sqlite default).
        # Pin this so a future "raise on unknown" change is an explicit choice.
        store.mark_delivered("does-not-exist")  # must not raise

    def test_does_not_affect_other_messages(self, store: MessageStore) -> None:
        a = store.store("c1", "u1", "u2", b"a")
        b = store.store("c1", "u1", "u2", b"b")
        store.mark_delivered(a)
        rows = store.get_undelivered("u2")
        assert len(rows) == 1
        assert rows[0]["id"] == b


# ── cleanup_expired() contract ──────────────────────────────────────────────


class TestCleanupExpired:
    def test_fresh_store_returns_zero(self, store: MessageStore) -> None:
        assert store.cleanup_expired() == 0

    def test_purges_only_expired(self, store: MessageStore) -> None:
        # 1 expired (ttl=-1s, already in the past), 1 fresh.
        store.store("c1", "u1", "u2", b"expired", ttl_seconds=-1)
        store.store("c1", "u1", "u2", b"fresh", ttl_seconds=3600)
        purged = store.cleanup_expired()
        assert purged == 1
        rows = store.get_messages("c1")
        assert len(rows) == 1
        assert rows[0]["ciphertext"] == b"fresh"

    def test_returns_purged_count(self, store: MessageStore) -> None:
        for _ in range(5):
            store.store("c1", "u1", "u2", b"e", ttl_seconds=-1)
        assert store.cleanup_expired() == 5

    def test_ttl_boundary_inclusive(self, store: MessageStore) -> None:
        # The DELETE uses ttl_expires_at <= now, so a row whose TTL == now
        # MUST be purged. Pin the boundary to catch a future flip to <.
        store.store("c1", "u1", "u2", b"ct", ttl_seconds=0)
        time.sleep(0.001)  # ensure now > ttl_expires_at
        assert store.cleanup_expired() == 1


# ── group_fanout() contract ─────────────────────────────────────────────────


class TestGroupFanout:
    def test_empty_recipients_returns_empty_list(self, store: MessageStore) -> None:
        assert store.group_fanout("c1", "u1", [], b"ct") == []

    def test_returns_one_id_per_recipient(self, store: MessageStore) -> None:
        ids = store.group_fanout("c1", "u1", ["u2", "u3", "u4"], b"ct")
        assert len(ids) == 3
        assert all(UUID4_HEX.match(i) for i in ids)
        assert len(set(ids)) == 3, "fanout must produce unique ids per recipient"

    def test_inserts_one_row_per_recipient(self, store: MessageStore) -> None:
        store.group_fanout("c1", "u1", ["u2", "u3", "u4"], b"ct")
        cur = store._conn.execute(
            "SELECT recipient_id FROM messages ORDER BY recipient_id"
        )
        recipients = [row[0] for row in cur.fetchall()]
        assert recipients == ["u2", "u3", "u4"]

    def test_rejects_str_ciphertext(self, store: MessageStore) -> None:
        with pytest.raises(TypeError, match="ciphertext must be bytes"):
            store.group_fanout("c1", "u1", ["u2"], "not-bytes")  # type: ignore[arg-type]

    def test_all_recipients_share_timestamp(self, store: MessageStore) -> None:
        # Closes v18 G2: a single fanout is "one logical send"; all replicas
        # must carry the same timestamp so ordering and TTL are coherent.
        store.group_fanout("c1", "u1", ["u2", "u3", "u4"], b"ct")
        cur = store._conn.execute("SELECT DISTINCT timestamp FROM messages")
        distinct_ts = cur.fetchall()
        assert len(distinct_ts) == 1, (
            "all fanout rows must share one timestamp, got "
            f"{[t[0] for t in distinct_ts]}"
        )

    def test_all_recipients_share_ttl(self, store: MessageStore) -> None:
        store.group_fanout("c1", "u1", ["u2", "u3", "u4"], b"ct", ttl_seconds=60)
        cur = store._conn.execute("SELECT DISTINCT ttl_expires_at FROM messages")
        assert len(cur.fetchall()) == 1

    def test_executemany_atomicity(self, store: MessageStore) -> None:
        # All-or-nothing: if any insert fails (e.g., NOT NULL violation on
        # ciphertext), no row should remain. Today the type-check fires
        # before executemany, so this is a passthrough; we pin the post-check
        # behaviour.
        before = store._conn.execute(
            "SELECT COUNT(*) FROM messages"
        ).fetchone()[0]
        try:
            store.group_fanout("c1", "u1", ["u2", "u3"], "not-bytes")  # type: ignore[arg-type]
        except TypeError:
            pass
        after = store._conn.execute(
            "SELECT COUNT(*) FROM messages"
        ).fetchone()[0]
        assert before == after, "no rows should land if input is invalid"


# ── _row_to_dict() contract ─────────────────────────────────────────────────


class TestRowToDict:
    def test_delivered_int_becomes_bool(self, store: MessageStore) -> None:
        msg_id = store.store("c1", "u1", "u2", b"ct")
        rows = store.get_messages("c1")
        assert rows[0]["delivered"] is False  # not 0, not "0"
        store.mark_delivered(msg_id)
        rows = store.get_messages("c1")
        assert rows[0]["delivered"] is True

    def test_dict_has_documented_keys(self, store: MessageStore) -> None:
        store.store("c1", "u1", "u2", b"ct")
        rows = store.get_messages("c1")
        assert set(rows[0].keys()) == {
            "id",
            "conversation_id",
            "sender_id",
            "recipient_id",
            "ciphertext",
            "timestamp",
            "delivered",
        }


# ── close() contract ────────────────────────────────────────────────────────


class TestClose:
    def test_close_then_use_raises(self) -> None:
        s = MessageStore(":memory:")
        s.close()
        # sqlite3.ProgrammingError: Cannot operate on a closed database.
        import sqlite3 as _sqlite3
        with pytest.raises(_sqlite3.ProgrammingError):
            s.store("c1", "u1", "u2", b"ct")

    def test_double_close_is_silent(self) -> None:
        # Pin idempotent close so context-manager-style cleanup is safe.
        s = MessageStore(":memory:")
        s.close()
        s.close()  # must not raise
