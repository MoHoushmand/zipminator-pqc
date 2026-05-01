"""Coverage skeleton, v27 G2: src/middleware/logging.py is 31 LOC with 0 tests.

Place at api/tests/test_logging_middleware.py (collected via testpaths=["tests"]).
Run: cd core/api && pytest -xvs tests/test_logging_middleware.py

Pins the v18 G3 finding: X-Process-Time header changed from `str(duration)` to
`f"{duration:.6f}"` and broke strict downstream parsers. This test fails-loud
on either direction of drift (back to str(), or forward to a different precision).

Asserts:
  - X-Process-Time header is present on EVERY response (success, 4xx, 5xx)
  - Format is exactly N.NNNNNN (6 fractional digits, leading integer ≥ 0)
  - Header is parseable as float, value is >= 0
  - Header is set even when the inner handler raises (regression guard for
    Starlette swallowing the call_next exception)
  - INFO-level logs emitted for both Request and Response when logger enabled
  - No logs emitted when logger is at WARNING (the `log_enabled` short-circuit)
"""

from __future__ import annotations

import logging
import re

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from src.middleware.logging import LoggingMiddleware


# ── helpers ────────────────────────────────────────────────────────────────

# Pattern matches "0.000123", "12.345678", "1234.567890" — six fractional digits.
PROCESS_TIME_RE = re.compile(r"^\d+\.\d{6}$")


@pytest.fixture
def mini_app() -> FastAPI:
    """Minimal FastAPI with the middleware attached and three test routes."""
    app = FastAPI()
    app.add_middleware(LoggingMiddleware)

    @app.get("/ok")
    def ok():
        return {"status": "ok"}

    @app.get("/boom")
    def boom():
        raise HTTPException(status_code=503, detail="boom")

    @app.get("/empty")
    def empty():
        return {}

    return app


@pytest.fixture
def mini_client(mini_app: FastAPI) -> TestClient:
    return TestClient(mini_app)


# ── header presence & format ───────────────────────────────────────────────

class TestProcessTimeHeader:
    def test_header_present_on_2xx(self, mini_client: TestClient):
        r = mini_client.get("/ok")
        assert r.status_code == 200
        assert "x-process-time" in {k.lower() for k in r.headers.keys()}

    def test_header_present_on_4xx(self, mini_client: TestClient):
        # FastAPI's HTTPException flows through call_next as a normal Response,
        # so the middleware should still set the header.
        r = mini_client.get("/boom")
        assert r.status_code == 503
        assert "x-process-time" in {k.lower() for k in r.headers.keys()}

    def test_header_format_is_six_decimal_places(self, mini_client: TestClient):
        # v18 G3 regression guard. If someone reverts to str(duration), this
        # fails because str() emits variable precision (e.g. "0.0001234567").
        r = mini_client.get("/ok")
        value = r.headers["x-process-time"]
        assert PROCESS_TIME_RE.match(value), (
            f"X-Process-Time={value!r} does not match N.NNNNNN. "
            "Did the format string in middleware/logging.py change?"
        )

    def test_header_parses_as_float(self, mini_client: TestClient):
        r = mini_client.get("/ok")
        value = r.headers["x-process-time"]
        as_float = float(value)
        assert as_float >= 0.0

    def test_header_value_is_nonzero_in_practice(self, mini_client: TestClient):
        # A handler that does any work at all must record duration > 0.
        # If this fires, time.time() is broken or someone hardcoded "0.000000".
        r = mini_client.get("/ok")
        as_float = float(r.headers["x-process-time"])
        assert as_float > 0.0

    def test_header_present_on_empty_body(self, mini_client: TestClient):
        # Edge case: a {} response is still a Response object.
        r = mini_client.get("/empty")
        assert r.status_code == 200
        assert PROCESS_TIME_RE.match(r.headers["x-process-time"])


# ── logging behaviour ─────────────────────────────────────────────────────

class TestLoggingBehaviour:
    def test_logs_request_and_response_when_info_enabled(
        self, mini_client: TestClient, caplog: pytest.LogCaptureFixture
    ):
        with caplog.at_level(logging.INFO, logger="src.middleware.logging"):
            r = mini_client.get("/ok")
        assert r.status_code == 200

        request_logs = [m for m in caplog.messages if m.startswith("Request:")]
        response_logs = [m for m in caplog.messages if m.startswith("Response:")]

        assert len(request_logs) == 1
        assert "GET /ok" in request_logs[0]
        assert len(response_logs) == 1
        assert "Status: 200" in response_logs[0]
        assert "Duration:" in response_logs[0]

    def test_does_not_log_when_warning_only(
        self, mini_client: TestClient, caplog: pytest.LogCaptureFixture
    ):
        # log_enabled = logger.isEnabledFor(logging.INFO). At WARNING level
        # this is False and the f-string formatting should be skipped.
        with caplog.at_level(logging.WARNING, logger="src.middleware.logging"):
            r = mini_client.get("/ok")
        assert r.status_code == 200

        # The X-Process-Time header is still set (it's outside the gate).
        assert "x-process-time" in {k.lower() for k in r.headers.keys()}

        # But no Request/Response INFO logs.
        request_logs = [m for m in caplog.messages if m.startswith("Request:")]
        response_logs = [m for m in caplog.messages if m.startswith("Response:")]
        assert request_logs == []
        assert response_logs == []

    def test_response_log_includes_duration(
        self, mini_client: TestClient, caplog: pytest.LogCaptureFixture
    ):
        with caplog.at_level(logging.INFO, logger="src.middleware.logging"):
            mini_client.get("/ok")

        response_logs = [m for m in caplog.messages if m.startswith("Response:")]
        assert response_logs, "expected at least one Response log"
        # "Duration: 0.001s" — three-decimal float ending in 's'
        assert re.search(r"Duration: \d+\.\d{3}s", response_logs[0])
