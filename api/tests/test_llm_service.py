"""Coverage skeleton, v27 G1: src/services/llm_service.py is 107 LOC with 0 tests.

Place at api/tests/test_llm_service.py (collected via pyproject testpaths=["tests"]).
Run: cd core/api && pytest -xvs tests/test_llm_service.py

The author marked `_get` and `_post` as "patched in tests" but no test ever
materialized. This file pins:
  1. graceful-degrade contract on httpx.ConnectError / TimeoutException
  2. base_url trailing-slash trim invariant
  3. chat/list_models payload shape on success
  4. error envelope shape on failure
  5. OllamaClient is constructible with the documented default base_url

Why this matters: llm_service is the only Pillar-6 LLM client. A regression that
turns ConnectError into a 500 (instead of {"error": ...}) would crash every
/ai/* route the moment Ollama is offline (which is the default state on CI).

Notes:
- pytest-asyncio is already a dev dep (used by other route tests via TestClient
  but with TestClient.lifespan we never actually awaited an async fn outside
  fastapi). Adding it explicitly per-test via `@pytest.mark.asyncio` keeps this
  module independent of conftest changes.
- We do NOT hit the network. Every call patches `_get`/`_post` to return a
  fake `httpx.Response`. The single fixture `fake_response` constructs a
  minimal response without a real Request object.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.services.llm_service import OllamaClient, _TIMEOUT


# ── helpers ────────────────────────────────────────────────────────────────

def _fake_response(status: int, body: Any) -> httpx.Response:
    """Build an httpx.Response without a transport for unit-test patching."""
    payload = json.dumps(body).encode("utf-8") if not isinstance(body, bytes) else body
    return httpx.Response(
        status_code=status,
        content=payload,
        headers={"content-type": "application/json"},
    )


# ── construction & invariants ───────────────────────────────────────────────

class TestOllamaClientConstruction:
    def test_default_base_url(self):
        c = OllamaClient()
        assert c.base_url == "http://localhost:11434"

    def test_custom_base_url(self):
        c = OllamaClient(base_url="http://exo:52415")
        assert c.base_url == "http://exo:52415"

    def test_trailing_slash_stripped(self):
        # Documented invariant: base_url is rstrip("/")'d so f"{base_url}{path}"
        # never produces "//api/chat".
        c = OllamaClient(base_url="http://localhost:11434/")
        assert c.base_url == "http://localhost:11434"

    def test_multiple_trailing_slashes_stripped(self):
        c = OllamaClient(base_url="http://localhost:11434///")
        assert c.base_url == "http://localhost:11434"


class TestModuleInvariants:
    def test_timeout_constants_within_sane_range(self):
        # Pin against accidental "0.1s" or "3600s" tweaks. read=120s is the
        # documented LLM-generation budget; connect=5s; pool=5s.
        assert _TIMEOUT.connect == 5.0
        assert _TIMEOUT.read == 120.0
        assert _TIMEOUT.write == 10.0
        assert _TIMEOUT.pool == 5.0


# ── health_check ────────────────────────────────────────────────────────────

class TestHealthCheck:
    @pytest.mark.asyncio
    async def test_returns_true_on_200(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(return_value=_fake_response(200, {"ok": 1}))):
            assert await c.health_check() is True

    @pytest.mark.asyncio
    async def test_returns_false_on_non_200(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(return_value=_fake_response(503, "down"))):
            assert await c.health_check() is False

    @pytest.mark.asyncio
    async def test_returns_false_on_connect_error(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=httpx.ConnectError("nope"))):
            assert await c.health_check() is False

    @pytest.mark.asyncio
    async def test_returns_false_on_timeout(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=httpx.TimeoutException("slow"))):
            assert await c.health_check() is False

    @pytest.mark.asyncio
    async def test_returns_false_on_oserror(self):
        # Documented exception in graceful-degrade tuple.
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=OSError("dns"))):
            assert await c.health_check() is False

    @pytest.mark.asyncio
    async def test_does_not_swallow_unrelated_exceptions(self):
        # Regression guard: contract is "swallow connectivity errors", NOT
        # "swallow ValueError from a programmer mistake".
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=ValueError("bad code"))):
            with pytest.raises(ValueError):
                await c.health_check()


# ── chat (non-streaming) ────────────────────────────────────────────────────

class TestChat:
    @pytest.mark.asyncio
    async def test_returns_full_response_dict_on_success(self):
        c = OllamaClient()
        body = {"model": "llama3.2", "message": {"role": "assistant", "content": "hi"}}
        with patch.object(c, "_post", AsyncMock(return_value=_fake_response(200, body))):
            out = await c.chat([{"role": "user", "content": "hi"}])
        assert out == body

    @pytest.mark.asyncio
    async def test_returns_error_envelope_on_connect_error(self):
        c = OllamaClient()
        with patch.object(c, "_post", AsyncMock(side_effect=httpx.ConnectError("nope"))):
            out = await c.chat([{"role": "user", "content": "hi"}])
        assert "error" in out
        assert "Ollama" in out["error"]

    @pytest.mark.asyncio
    async def test_default_model_is_llama32(self):
        c = OllamaClient()
        captured: dict[str, Any] = {}

        async def fake_post(path: str, json: dict) -> httpx.Response:
            captured["path"] = path
            captured["json"] = json
            return _fake_response(200, {"ok": 1})

        with patch.object(c, "_post", AsyncMock(side_effect=fake_post)):
            await c.chat([{"role": "user", "content": "hi"}])
        assert captured["path"] == "/api/chat"
        assert captured["json"]["model"] == "llama3.2"
        assert captured["json"]["stream"] is False

    @pytest.mark.asyncio
    async def test_custom_model_is_passed_through(self):
        c = OllamaClient()
        captured: dict[str, Any] = {}

        async def fake_post(path: str, json: dict) -> httpx.Response:
            captured["json"] = json
            return _fake_response(200, {"ok": 1})

        with patch.object(c, "_post", AsyncMock(side_effect=fake_post)):
            await c.chat([{"role": "user", "content": "hi"}], model="qwen3:8b")
        assert captured["json"]["model"] == "qwen3:8b"


# ── list_models ─────────────────────────────────────────────────────────────

class TestListModels:
    @pytest.mark.asyncio
    async def test_returns_models_array_on_success(self):
        c = OllamaClient()
        body = {"models": [{"name": "llama3.2:latest"}, {"name": "qwen3:8b"}]}
        with patch.object(c, "_get", AsyncMock(return_value=_fake_response(200, body))):
            out = await c.list_models()
        assert isinstance(out, list)
        assert len(out) == 2
        assert out[0]["name"] == "llama3.2:latest"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_models_key(self):
        # Defensive: Ollama may return {} if no models pulled.
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(return_value=_fake_response(200, {}))):
            out = await c.list_models()
        assert out == []

    @pytest.mark.asyncio
    async def test_returns_empty_list_on_connect_error(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=httpx.ConnectError("nope"))):
            out = await c.list_models()
        assert out == []

    @pytest.mark.asyncio
    async def test_returns_empty_list_on_timeout(self):
        c = OllamaClient()
        with patch.object(c, "_get", AsyncMock(side_effect=httpx.TimeoutException("slow"))):
            out = await c.list_models()
        assert out == []
