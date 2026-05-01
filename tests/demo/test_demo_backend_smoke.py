"""v26 G3: smoke coverage for demo/backend/server.py (Flask QRNG demo).

The demo backend is ~613 LOC of Flask serving 11 routes used in
investor demos and government-facing tutorials (demo/gov-demo/). It has
ZERO test coverage — a single import error or a renamed route silently
kills a live demo.

Routes the user demos against (from `grep '@app.route' server.py`):
    /api/health
    /api/quantum/status
    /api/quantum/generate
    /api/quantum/refill
    /api/zipminator/encrypt
    /api/zipminator/download/<file_id>
    /api/kyber/generate
    /api/kyber/encrypt
    /api/kyber/decrypt
    /api/kyber/benchmark
    /api/jupyter/launch

Below: Shape A is wired and runnable. Shapes B and C are the user pick.

────────────────────────────────────────────────────────────────────────
USER CONTRIBUTION (5-10 lines): pick a test shape and uncomment the
matching block. The trade-off shapes the maintenance cost vs the bug-
catch surface.

(A) IMPORT + URL_MAP CONTRACT — wired below, runnable as-is.
    + ~5ms total, zero deps beyond Flask
    + Catches: import errors, route renames, decorator typos
    - Misses: handler logic, payload schemas, response shapes

(B) WERKZEUG TEST CLIENT — uncomment _test_health_responds_200().
    + ~50ms total, no real server / port binding
    + Catches everything in (A) PLUS handler runtime errors,
      missing-fixture crashes, JSON shape drift
    - Misses: production-only failures (gunicorn worker config, CORS
      preflight, real port collisions)

(C) SUBPROCESS + REAL SERVER — uncomment _test_health_via_real_server().
    + Catches everything in (A)+(B) PLUS port binding, env-var loading,
      gunicorn/werkzeug discrepancies
    - 2-5s per test (boot + tear down), needs a free port, flaky on CI
      with parallel test workers

Default recommendation: (B). It catches the demo-killing bugs (import
errors, response shape drift) at 10x the cost of (A) but 100x cheaper
than (C), and the demo backend isn't run under gunicorn in dev anyway.
────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
DEMO_BACKEND = REPO_ROOT / "demo" / "backend"


@pytest.fixture(scope="module")
def demo_app():
    """Import demo/backend/server.py as a module and return the Flask app.

    The server adds parent dirs to sys.path, so we replicate that in test
    so `from zipminator...` works even when the package isn't installed.
    Soft-skip when Flask isn't in the test env (it's a demo dep, not core).
    """
    pytest.importorskip("flask", reason="demo/backend uses Flask; not a core dep")
    pytest.importorskip("flask_cors", reason="demo/backend uses flask_cors")

    import importlib.util

    sys.path.insert(0, str(DEMO_BACKEND.parent))
    sys.path.insert(0, str(REPO_ROOT / "src"))
    sys.modules.pop("server", None)
    spec = importlib.util.spec_from_file_location(
        "demo_backend_server", DEMO_BACKEND / "server.py"
    )
    if spec is None or spec.loader is None:
        pytest.skip("could not load demo/backend/server.py spec")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app


# ────────────────────────────────────────────────────────────────────────
# Shape (A) — IMPORT + URL_MAP CONTRACT (wired, runs by default)
# ────────────────────────────────────────────────────────────────────────


EXPECTED_ROUTES = {
    "/api/health",
    "/api/quantum/status",
    "/api/quantum/generate",
    "/api/quantum/refill",
    "/api/zipminator/encrypt",
    "/api/zipminator/download/<file_id>",
    "/api/kyber/generate",
    "/api/kyber/encrypt",
    "/api/kyber/decrypt",
    "/api/kyber/benchmark",
    "/api/jupyter/launch",
}


def test_demo_backend_module_imports_cleanly(demo_app):
    """Catch the most-common demo killer: an import error in server.py.
    If this passes, the live demo will at least start."""
    assert demo_app is not None
    assert hasattr(demo_app, "url_map")


def test_all_documented_routes_are_registered(demo_app):
    """Lock the route surface so a rename can't silently break the
    investor demo's hard-coded curl examples in DEMO_GUIDE.md."""
    registered = {rule.rule for rule in demo_app.url_map.iter_rules()}
    missing = EXPECTED_ROUTES - registered
    assert not missing, (
        f"demo backend lost routes: {sorted(missing)}. Update either "
        "server.py or DEMO_GUIDE.md so they agree."
    )


# ────────────────────────────────────────────────────────────────────────
# Shape (B) — WERKZEUG TEST CLIENT (commented; uncomment to activate)
# ────────────────────────────────────────────────────────────────────────


# def test_health_responds_200(demo_app):
#     client = demo_app.test_client()
#     resp = client.get("/api/health")
#     assert resp.status_code == 200
#     body = resp.get_json()
#     assert body is not None
#     assert "status" in body  # tighten once you've picked the schema


# def test_quantum_status_returns_pool_size(demo_app):
#     client = demo_app.test_client()
#     resp = client.get("/api/quantum/status")
#     assert resp.status_code == 200
#     body = resp.get_json()
#     # Adjust key if you renamed pool_size in server.py
#     assert "pool_size" in body or "pool_bytes" in body


# ────────────────────────────────────────────────────────────────────────
# Shape (C) — SUBPROCESS + REAL SERVER (commented; uncomment to activate)
# ────────────────────────────────────────────────────────────────────────


# import socket
# import subprocess
# import time
# import urllib.request


# def _free_port() -> int:
#     with socket.socket() as s:
#         s.bind(("127.0.0.1", 0))
#         return s.getsockname()[1]


# def test_health_via_real_server():
#     port = _free_port()
#     env = {**os.environ, "DEMO_PORT": str(port)}
#     proc = subprocess.Popen(
#         [sys.executable, str(DEMO_BACKEND / "server.py")],
#         env=env,
#         stdout=subprocess.PIPE,
#         stderr=subprocess.PIPE,
#     )
#     try:
#         for _ in range(30):
#             try:
#                 r = urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=0.5)
#                 assert r.status == 200
#                 break
#             except Exception:
#                 time.sleep(0.2)
#         else:
#             pytest.fail("demo backend did not bind within 6s")
#     finally:
#         proc.terminate()
#         proc.wait(timeout=5)
