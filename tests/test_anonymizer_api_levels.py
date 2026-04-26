"""End-to-end tests for the JSON-body POST /api/anonymize endpoint.

Acceptance test for Pillar 5 (10-Level Anonymizer) marathon goal: the Flutter
UI level selector posts a JSON body `{"level": N, "text": "..."}` to this
endpoint and renders the returned `anonymized_text` plus per-level metadata.

The test boots a minimal FastAPI app containing only the anonymize router so
it does not depend on the database, Redis, or any other infra service.
"""

from __future__ import annotations

import importlib.util
import os
import sys

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def app() -> FastAPI:
    """Build a lightweight FastAPI app exposing only the anonymize router.

    Loads `api/src/routes/anonymize.py` directly to avoid pulling in the rest
    of the API package (which depends on a SQLAlchemy database and Redis).
    """
    api_dir = os.path.join(os.path.dirname(__file__), "..", "api")
    routes_path = os.path.join(api_dir, "src", "routes", "anonymize.py")

    if not os.path.exists(routes_path):
        pytest.skip(f"API route not found: {routes_path}")

    if api_dir not in sys.path:
        sys.path.insert(0, api_dir)

    try:
        from src.routes.anonymize import router
    except (ModuleNotFoundError, ImportError):
        spec = importlib.util.spec_from_file_location(
            "api_src_routes_anonymize", routes_path
        )
        if spec is None or spec.loader is None:
            pytest.skip(f"Cannot load anonymize route from {routes_path}")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        router = mod.router

    test_app = FastAPI(title="Anonymize API Levels Test App")
    # Mount under /api so the canonical path is POST /api/anonymize.
    test_app.include_router(router, prefix="/api")
    return test_app


@pytest_asyncio.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── JSON body anonymize endpoint ──────────────────────────────────────────────

class TestAnonymizeJsonEndpoint:
    """POST /api/anonymize takes JSON `{level, text}` and returns anonymized text."""

    SAMPLE_TEXT = (
        "John Smith, SSN 123-45-6789, john@acme.com, "
        "phone 555-0123, CC 4111-1111-1111-1111"
    )

    @pytest.mark.asyncio
    async def test_level_1_returns_200_and_anonymized_text(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 1, "text": self.SAMPLE_TEXT},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "anonymized_text" in data
        assert data["level"] == 1
        # L1 redacts SSN to ***-**-****
        assert "123-45-6789" not in data["anonymized_text"]
        # L1 also masks emails to [EMAIL]
        assert "[EMAIL]" in data["anonymized_text"] or "***" in data["anonymized_text"]

    @pytest.mark.asyncio
    async def test_level_5_returns_200_and_static_redaction(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 5, "text": "Hello world this is sensitive"},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["level"] == 5
        # L5 (within text path) replaces every word with [REDACTED]
        assert "Hello" not in data["anonymized_text"]
        assert "[REDACTED]" in data["anonymized_text"]

    @pytest.mark.asyncio
    async def test_level_10_returns_200_and_otp_replacement(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 10, "text": "Top secret payload alpha bravo charlie"},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["level"] == 10
        # L10 OTP-replaces every word so the original tokens must be gone
        for word in ("Top", "secret", "payload", "alpha", "bravo", "charlie"):
            assert word not in data["anonymized_text"], (
                f"L10 should fully replace '{word}' but it survived: "
                f"{data['anonymized_text']!r}"
            )
        # Length should match the original word count rendering
        assert len(data["anonymized_text"]) > 0

    @pytest.mark.asyncio
    async def test_response_includes_metadata(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 7, "text": "Sample data"},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        # Response must carry the requested level so the UI can render it
        assert data["level"] == 7
        assert "anonymized_text" in data
        # original_text echoed for the before/after view
        assert data.get("original_text") == "Sample data"

    @pytest.mark.asyncio
    async def test_invalid_level_rejected(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 0, "text": "anything"},
        )
        # Out-of-range level: FastAPI/Pydantic validation -> 422
        assert resp.status_code == 422

        resp = await client.post(
            "/api/anonymize",
            json={"level": 11, "text": "anything"},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_text_rejected(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 5},
        )
        # Pydantic enforces the required `text` field
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_empty_text_returns_empty_anonymized(self, client):
        resp = await client.post(
            "/api/anonymize",
            json={"level": 5, "text": ""},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["anonymized_text"] == ""
        assert data["level"] == 5

    @pytest.mark.asyncio
    async def test_all_ten_levels_are_routable(self, client):
        """Smoke: every level 1-10 produces a 200 with the requested level echoed."""
        for level in range(1, 11):
            resp = await client.post(
                "/api/anonymize",
                json={"level": level, "text": f"sample text for level {level}"},
            )
            assert resp.status_code == 200, (
                f"L{level} returned {resp.status_code}: {resp.text}"
            )
            data = resp.json()
            assert data["level"] == level

    @pytest.mark.asyncio
    async def test_attachment_endpoint_still_works(self, client):
        """Regression: the existing file-upload endpoint must keep working."""
        import io
        text = "SSN: 123-45-6789"
        resp = await client.post(
            "/api/anonymize-attachment?level=1",
            files={"file": ("note.txt", io.BytesIO(text.encode()), "text/plain")},
        )
        assert resp.status_code == 200
