"""End-to-end test: X-Zipminator-TTL header drives self-destruct purge.

This test verifies the full TTL pipeline without Docker, without a real SMTP
server, and without a real PostgreSQL backend:

1. Build an email message with `X-Zipminator-TTL: 60`.
2. Push it through `PQCSmtpHandler.handle_message` against an in-memory
   stand-in for `EmailStorage`.
3. Assert that the row was stored with a `self_destruct_at` 60 s in the
   future.
4. Advance virtual time past TTL and assert that `delete_expired()` would
   now reap the row (we simulate the SQL filter in pure Python).

The test is skipped automatically when `aiosmtpd` is not present, since
`smtp_server.py` imports it at module load.
"""

from __future__ import annotations

import base64
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest


EMAIL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "email")
)
if EMAIL_DIR not in sys.path:
    sys.path.insert(0, EMAIL_DIR)


# Skip cleanly if aiosmtpd is unavailable in this env (no Docker-deployed
# transport image). The behaviour we test still belongs to PQCSmtpHandler,
# but smtp_server.py won't import without aiosmtpd at module level.
pytest.importorskip("aiosmtpd", reason="aiosmtpd not installed in current env")


from transport.smtp_server import PQCSmtpHandler  # noqa: E402


# ---------------------------------------------------------------------------
# In-memory stand-in for EmailStorage
# ---------------------------------------------------------------------------


class _InMemoryStore:
    """Captures store_email calls and exposes a pure-Python `purge()`.

    Mirrors the SQL semantics of `storage.delete_expired()`:
    ``DELETE FROM emails WHERE self_destruct_at IS NOT NULL
                          AND self_destruct_at < NOW()
                          AND NOT deleted``
    """

    def __init__(self) -> None:
        self.rows: list[dict] = []

    async def store_email(
        self,
        sender: str,
        recipient: str,
        subject: str,
        encrypted_body: bytes,
        envelope_data: dict,
        self_destruct_at: datetime | None = None,
    ) -> str:
        row = {
            "id": f"row-{len(self.rows) + 1}",
            "sender": sender,
            "recipient": recipient,
            "subject": subject,
            "encrypted_body": encrypted_body,
            "envelope_data": envelope_data,
            "self_destruct_at": self_destruct_at,
            "deleted": False,
        }
        self.rows.append(row)
        return row["id"]

    def purge(self, now: datetime) -> int:
        """Mirror `storage.delete_expired()` against in-memory rows."""
        purged = 0
        for r in self.rows:
            if (
                r["self_destruct_at"] is not None
                and r["self_destruct_at"] < now
                and not r["deleted"]
            ):
                r["deleted"] = True
                purged += 1
        return purged

    def live_count(self) -> int:
        return sum(1 for r in self.rows if not r["deleted"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _b64_pk() -> str:
    return base64.b64encode(os.urandom(1184)).decode()


def _email_with_ttl(ttl: str) -> "object":
    import email as email_lib

    raw = (
        "From: alice@example.com\r\n"
        "To: bob@zipminator.zip\r\n"
        "Subject: ttl test\r\n"
        f"X-Zipminator-TTL: {ttl}\r\n"
        "\r\nbody payload"
    )
    msg = email_lib.message_from_string(raw)
    # PQCSmtpHandler reads `envelope_recipients` if present
    msg.envelope_recipients = ["bob@zipminator.zip"]  # type: ignore[attr-defined]
    return msg


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestXZipminatorTtlHeader:
    """End-to-end: header parsed -> self_destruct_at set -> purge respects it."""

    @pytest.mark.asyncio
    async def test_ttl_60_sets_self_destruct_at_one_minute_out(self):
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        msg = _email_with_ttl("60")
        before = datetime.now(timezone.utc)
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)
        after = datetime.now(timezone.utc)

        assert len(store.rows) == 1
        row = store.rows[0]
        assert row["self_destruct_at"] is not None, (
            "X-Zipminator-TTL: 60 must set self_destruct_at on the row"
        )
        delta = (row["self_destruct_at"] - before).total_seconds()
        # Allow ~1 s window for the wall-clock between `before` and the
        # handler's own `datetime.now(...)` call.
        assert 59.0 <= delta <= 61.0 + (after - before).total_seconds(), (
            f"self_destruct_at should be ~60 s out, got delta={delta}"
        )

    @pytest.mark.asyncio
    async def test_purge_loop_deletes_after_ttl_plus_one_minute(self):
        """Mock-time test: advance virtual clock past TTL+60 s and verify purge.

        We don't sleep; we directly drive `_InMemoryStore.purge(now=...)` with
        a `datetime` that is past the row's `self_destruct_at`. This mirrors
        `storage.delete_expired()` which compares against `NOW()` at the
        database, not against `time.time()` at the application.
        """
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        msg = _email_with_ttl("60")
        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)

        assert store.live_count() == 1

        sd_at = store.rows[0]["self_destruct_at"]
        assert sd_at is not None

        # Virtual clock just before TTL expiry: row must still be live.
        purged_before = store.purge(now=sd_at - timedelta(seconds=1))
        assert purged_before == 0
        assert store.live_count() == 1

        # Virtual clock at TTL+60 s: row must be reaped.
        future = sd_at + timedelta(seconds=60)
        purged_after = store.purge(now=future)
        assert purged_after == 1, (
            "purge_loop should delete the row once self_destruct_at is past"
        )
        assert store.live_count() == 0

    @pytest.mark.asyncio
    async def test_no_ttl_header_means_no_self_destruct(self):
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        import email as email_lib

        msg = email_lib.message_from_string(
            "From: alice@example.com\r\n"
            "To: bob@zipminator.zip\r\n"
            "Subject: no ttl\r\n"
            "\r\nplain body"
        )
        msg.envelope_recipients = ["bob@zipminator.zip"]  # type: ignore[attr-defined]

        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)

        assert len(store.rows) == 1
        assert store.rows[0]["self_destruct_at"] is None, (
            "Without X-Zipminator-TTL the row must have no self-destruct timer"
        )

    @pytest.mark.asyncio
    async def test_invalid_ttl_header_logs_and_skips(self):
        """Non-numeric TTL header is logged and ignored (no crash)."""
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        msg = _email_with_ttl("not-a-number")

        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)

        # The mail is still stored (transport must be lossless), but with no
        # self-destruct timer.
        assert len(store.rows) == 1
        assert store.rows[0]["self_destruct_at"] is None

    @pytest.mark.asyncio
    async def test_zero_ttl_does_not_set_self_destruct(self):
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        msg = _email_with_ttl("0")

        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)

        assert store.rows[0]["self_destruct_at"] is None, (
            "TTL=0 means 'no self-destruct'; must not set the field"
        )

    @pytest.mark.asyncio
    async def test_large_ttl_is_accepted(self):
        store = _InMemoryStore()
        handler = PQCSmtpHandler(store)  # type: ignore[arg-type]

        # 7 days = 604800 s (matches the 7-day option in compose UI)
        msg = _email_with_ttl("604800")

        with patch(
            "transport.smtp_server._lookup_recipient_pk",
            new=AsyncMock(return_value=_b64_pk()),
        ):
            await handler.handle_message(msg)

        sd = store.rows[0]["self_destruct_at"]
        assert sd is not None
        delta_seconds = (sd - datetime.now(timezone.utc)).total_seconds()
        assert 604700 < delta_seconds < 604900
