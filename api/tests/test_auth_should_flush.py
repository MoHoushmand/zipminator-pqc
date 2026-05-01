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


# ──────────────────────────────────────────────────────────────────────
# v21 G4: memory-bound regression tests for the (A) Debounce strategy.
#
# `_last_flushed: dict[int, datetime]` grows unbounded under churn:
# 1M unique api_key_ids/day = ~50MB/day RSS leak across the uvicorn worker.
# These tests pin EITHER:
#   - LRU(N) eviction (default suggestion: N = 4096), OR
#   - TTL+sweep (cull entries older than 10*FLUSH_INTERVAL_SECONDS), OR
#   - move state to Redis (option E from auth.py:35-61 docstring)
#
# YOU PICK ONE before implementing. The user-contribution is at the end:
# fill in `MAX_TRACKED_KEYS = ?` and uncomment the assertion that matches
# your choice. ──────────────────────────────────────────────────────────


def test_last_flushed_is_bounded_by_lru_cap():
    """Strategy (A1) LRU: _last_flushed never exceeds _FLUSH_CACHE_MAX entries.

    Pin: pushing 1.5x the cap of unique keys leaves exactly _FLUSH_CACHE_MAX
    entries. This is the v21 G4 / v12 G4 leak fix decided 2026-05-01.
    """
    from src.middleware import auth as auth_mod

    auth_mod._last_flushed.clear()
    for key_id in range(int(auth_mod._FLUSH_CACHE_MAX * 1.5)):
        auth_mod._should_flush(api_key_id=key_id)

    assert len(auth_mod._last_flushed) == auth_mod._FLUSH_CACHE_MAX


def test_lru_evicts_oldest_touched_key_first():
    """Strategy (A1) LRU semantics: under churn that exceeds the cap, the
    least-recently-touched key is the one evicted, not the most recent.
    """
    from src.middleware import auth as auth_mod

    auth_mod._last_flushed.clear()
    auth_mod._should_flush(api_key_id=1)  # oldest insertion
    for key_id in range(2, auth_mod._FLUSH_CACHE_MAX + 1):
        auth_mod._should_flush(api_key_id=key_id)

    assert 1 in auth_mod._last_flushed
    auth_mod._should_flush(api_key_id=auth_mod._FLUSH_CACHE_MAX + 1)
    assert 1 not in auth_mod._last_flushed
    assert auth_mod._FLUSH_CACHE_MAX + 1 in auth_mod._last_flushed


def test_clock_step_backward_does_not_break_invariant():
    """If the system clock steps backward (NTP sync), `_last_flushed[key]` may
    contain a future timestamp. The invariant 'first call returns True' must
    not turn into 'next 60 minutes return False because of bad cache'.

    This test pins the recovery semantic: a future-dated entry is treated as
    if it were absent.
    """
    from src.middleware import auth as auth_mod

    auth_mod._last_flushed.clear()
    auth_mod._last_flushed[7] = datetime.utcnow() + timedelta(hours=1)

    result = auth_mod._should_flush(api_key_id=7)
    # Choose ONE:
    # assert result is True, "future-dated cache must not block flush"
    # OR (current behavior, less safe):
    # assert result is False, "future-dated cache blocks until clock catches up"

    pytest.xfail(
        "v21 G4: clock-step semantic not pinned. Pick reset-on-future "
        "or wait-for-clock and uncomment the matching assertion."
    )
