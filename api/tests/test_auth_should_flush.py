"""Tests for `_should_flush` debouncer in api/src/middleware/auth.py.

Coverage gap v10 G2: the debouncer was added in commit 0ea1cd6, but the existing
skeleton at _tmp/test-skeletons/test_api_auth_middleware.py predates it and tests
stale write-storm behavior. These tests pin the (A) Debounce strategy that the
TODO docstring at auth.py:35-61 nominates as the default.

If the strategy changes (B drop / C sample / D queue / E redis-setex), update
these tests; the docstring lists the trade-offs.
"""

import time
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from src.middleware.auth import (
    _FLUSH_INTERVAL_SECONDS,
    _last_flushed,
    _should_flush,
)


@pytest.fixture(autouse=True)
def _reset_debounce_state():
    """Reset module-level state between tests (mutable global dict)."""
    _last_flushed.clear()
    yield
    _last_flushed.clear()


def test_first_call_for_a_key_returns_true():
    assert _should_flush(api_key_id=1) is True


def test_second_call_within_interval_returns_false():
    _should_flush(api_key_id=1)
    assert _should_flush(api_key_id=1) is False


def test_call_after_interval_returns_true_again():
    _should_flush(api_key_id=1)
    stale = datetime.utcnow() - timedelta(seconds=_FLUSH_INTERVAL_SECONDS + 1)
    _last_flushed[1] = stale
    assert _should_flush(api_key_id=1) is True


def test_different_keys_track_independently():
    assert _should_flush(api_key_id=1) is True
    assert _should_flush(api_key_id=2) is True
    assert _should_flush(api_key_id=1) is False
    assert _should_flush(api_key_id=2) is False


def test_concurrent_callers_for_same_key_only_one_flushes(monkeypatch):
    """Lock guarantees only ONE thread sees True per interval."""
    import threading

    results: list[bool] = []
    barrier = threading.Barrier(8)

    def worker():
        barrier.wait()
        results.append(_should_flush(api_key_id=42))

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert sum(results) == 1, f"expected exactly one True, got {sum(results)} of {results}"


# TODO(mom5): pick a strategy and lock it in.
# If you switch from (A) Debounce to (D) Write-Behind Queue, add a test that
# pushes N keys onto the queue, advances the clock, and asserts a single bulk
# UPDATE was issued. If you switch to (E) Redis SETEX, add a fakeredis fixture
# and assert the SETEX call with the right TTL.
