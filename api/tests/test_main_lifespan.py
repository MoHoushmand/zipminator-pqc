"""v26 G1: api/src/main.py:55-67 still uses deprecated FastAPI @app.on_event.

Both startup_event and shutdown_event registered via @app.on_event() instead
of the modern lifespan(app) async-context-manager. FastAPI emits a
DeprecationWarning on every test run and `on_event` is scheduled for removal
in a future minor release.

This skeleton pins three behaviors:

1. The deprecated path still works today (regression guard).
2. The deprecated path is the ONLY way the app currently boots — flagged
   so the migration is forced.
3. The root "/" endpoint returns the version metadata startup logs claim.

USER DECISION (TODO before un-skipping the lifespan-shape test):
    A. lifespan(app) async-context-manager + remove both @app.on_event(). The
       FastAPI-recommended path. One context, deterministic ordering, can
       hold resources (db pool, redis pool) inside the function.
    B. Keep @app.on_event() and add `# noqa: DEP-FastAPI-on-event` plus a
       version pin in api/pyproject.toml so the next FastAPI bump can't
       silently drop the handlers. Only buys us until the deprecation lands.
    C. Defer until FastAPI 0.115 (the version that removes on_event). Wire
       a CI lint that fails build on `@app.on_event(` so deprecation can't
       slip past.

Recommended: A. The shutdown handler currently does nothing meaningful
(just logs); the startup handler logs settings. Both move cleanly into a
`@asynccontextmanager async def lifespan(app)`.
"""
from __future__ import annotations

import warnings

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Boot the FastAPI app and return a sync TestClient.

    TestClient runs lifespan/on_event hooks on __enter__ / __exit__ so this
    fixture's enter/exit pair is what exercises startup + shutdown.
    """
    from src.main import app
    with TestClient(app) as c:
        yield c


class TestRootEndpoint:
    """Pin the "/" response shape that startup_event logs reference."""

    def test_root_returns_service_metadata(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["service"] == "Zipminator API"
        assert "version" in body
        assert body["docs"] == "/docs"
        assert body["health"] == "/health"

    def test_root_does_not_leak_database_url(self, client):
        """startup_event splits DATABASE_URL on '@' to log only the host.

        The "/" endpoint must not echo the full URL (would leak credentials).
        """
        resp = client.get("/")
        body_str = resp.text.lower()
        for credential_marker in ("password=", "://postgres:", "://user:"):
            assert credential_marker not in body_str, (
                f"Root endpoint leaked credential marker {credential_marker!r}"
            )


class TestStartupShutdownLifecycle:
    """Force the app through startup + shutdown via TestClient context.

    Today the only assertion is "no exception during boot/teardown". After
    the lifespan migration, this test becomes the place to assert that
    resources opened in lifespan are also closed (db pool, redis pool, etc).
    """

    def test_startup_does_not_raise(self, client):
        # Reaching this line means TestClient.__enter__ ran startup_event.
        assert client is not None

    def test_shutdown_does_not_raise(self):
        from src.main import app
        # Open and immediately close to force shutdown_event.
        with TestClient(app) as c:
            c.get("/")
        # Reaching this line means shutdown_event ran cleanly.

    @pytest.mark.xfail(
        strict=True,
        reason=(
            "v26 G1: app/src/main.py:55-67 uses deprecated @app.on_event. "
            "This test asserts the modern lifespan() pattern; will pass "
            "once Option A migration lands."
        ),
    )
    def test_app_uses_lifespan_not_on_event(self):
        """Pin the migration target: app must use lifespan(app), not on_event.

        Removing the @app.on_event decorators is the fix; this test then
        passes and stops xfailing.
        """
        import inspect
        from src import main as main_mod

        source = inspect.getsource(main_mod)
        assert "@app.on_event" not in source, (
            "Found @app.on_event in src/main.py — migrate to lifespan(app)."
        )
        assert "lifespan" in source, (
            "lifespan() context manager not yet wired into FastAPI(app, ...)."
        )


class TestDeprecationWarning:
    """Pin that the deprecation warning is currently emitted.

    This is a "flag the debt" test, not a behavior test. When G1 lifespan
    migration lands, this test EXPECTS no warning (assertion flips).
    """

    def test_on_event_emits_deprecation_warning(self):
        with warnings.catch_warnings(record=True) as captured:
            warnings.simplefilter("always")
            from importlib import reload
            from src import main
            reload(main)

        deprecations = [
            w for w in captured
            if issubclass(w.category, DeprecationWarning)
            and "on_event" in str(w.message)
        ]
        assert deprecations, (
            "Expected DeprecationWarning about on_event during main module "
            "import. If this test starts failing, the FastAPI migration "
            "may have already happened — flip this assertion."
        )
