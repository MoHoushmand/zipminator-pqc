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


def test_last_flushed_does_not_grow_unboundedly():
    """After tracking 100 unique keys, _last_flushed should be bounded.

    Currently FAILS because the dict grows without limit. The fix is one of:
      (A1) LRU: bound size with collections.OrderedDict and pop oldest.
      (A2) TTL: in _should_flush, also delete entries older than 10*interval.
      (A3) Redis: replace the dict with redis SETEX.

    Pick the strategy and uncomment the matching assertion.
    """
    from src.middleware import auth as auth_mod

    auth_mod._last_flushed.clear()
    for key_id in range(10_000):
        auth_mod._should_flush(api_key_id=key_id)

    # User contribution required: pick MAX_TRACKED_KEYS for your strategy.
    # MAX_TRACKED_KEYS = 4096   # If (A1) LRU(4096) is implemented
    # MAX_TRACKED_KEYS = 0      # If (A3) Redis-backed (dict stays empty)
    # assert len(auth_mod._last_flushed) <= MAX_TRACKED_KEYS

    # Until a strategy is picked, this test is xfail to flag the gap clearly:
    pytest.xfail(
        "v21 G4: _last_flushed is unbounded. Pick LRU/TTL/Redis "
        "and replace this xfail with the matching size assertion."
    )


def test_stale_entries_eventually_evicted_under_churn():
    """Under sustained churn, entries older than 10*FLUSH_INTERVAL_SECONDS
    should be evicted, not retained forever.

    This test simulates 5 'days' of churn with the clock advanced past the
    eviction window each iteration, and asserts that aged-out keys are
    actually gone. Currently FAILS for the same reason as the test above.
    """
    from src.middleware import auth as auth_mod

    auth_mod._last_flushed.clear()
    eviction_window = timedelta(seconds=_FLUSH_INTERVAL_SECONDS * 10)

    auth_mod._should_flush(api_key_id=42)
    aged = datetime.utcnow() - eviction_window - timedelta(seconds=1)
    auth_mod._last_flushed[42] = aged

    # Force many other keys to enter (simulating churn that should age 42 out).
    for new_key in range(100, 200):
        auth_mod._should_flush(api_key_id=new_key)

    # If TTL eviction is implemented, key 42 should be gone:
    # assert 42 not in auth_mod._last_flushed

    # If LRU eviction is implemented, key 42 should be gone after >MAX hits:
    # assert 42 not in auth_mod._last_flushed

    pytest.xfail(
        "v21 G4: stale-entry eviction not implemented. Pick LRU or TTL."
    )


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
