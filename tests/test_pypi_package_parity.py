"""
Coverage gap G3: PyPI distribution package (`src/zipminator/`) smoke + parity.

The wheel that ships to PyPI is built from `src/zipminator/`, separate from
the FastAPI server in `api/`. End-users `pip install zipminator` and import
from this tree, not from `api/`. The two trees can drift, and 21 prior
audits never tested the distribution path.

Three failure modes this suite catches:

  1. RUST_AVAILABLE=False fallback — when the platform wheel is sdist or
     missing `_core.abi3.so`, the Python fallback runs. It is unwitnessed.
  2. Lazy `__getattr__` imports break — a missing optional dep makes
     `from zipminator import Zipndel` raise AttributeError instead of the
     real underlying ImportError, so users see a confusing trace.
  3. Cold-import time blows up — adding a top-level pandas/numpy import
     turns `import zipminator` from ~50ms into ~800ms. Catches before users
     report the regression.

Discovered: 2026-05-01 v22 audit, never tested in 21 prior passes.
"""

from __future__ import annotations

import importlib
import sys
import time

import pytest


# ─── Smoke: top-level package imports cleanly ────────────────────────────

def test_zipminator_top_level_imports() -> None:
    """`import zipminator` must succeed without raising."""
    # Force a fresh import so cold-path failures are visible.
    sys.modules.pop("zipminator", None)
    mod = importlib.import_module("zipminator")
    assert hasattr(mod, "__version__")
    assert mod.__version__  # non-empty


# ─── Public surface: every name in __all__ is reachable ──────────────────

EXPECTED_EXPORTS: tuple[str, ...] = (
    "Zipndel",
    "PQC",
    "QuantumRandom",
    "AdvancedAnonymizer",
    "SubscriptionManager",
    "PIIScanner",
    "keypair",
    "encapsulate",
    "decapsulate",
    "RUST_AVAILABLE",
    "__version__",
)


@pytest.mark.parametrize("name", EXPECTED_EXPORTS)
def test_public_export_resolves(name: str) -> None:
    """Every name in __all__ must resolve to an attribute (no AttributeError).

    Catches drift in the lazy `__getattr__` (e.g., a typo'd module name).
    """
    import zipminator
    assert getattr(zipminator, name) is not None, f"{name} resolved to None"


# ─── KEM roundtrip: works in BOTH RUST_AVAILABLE branches ────────────────

def test_kem_roundtrip_native_path() -> None:
    """Encapsulate then decapsulate yields the same shared secret (native)."""
    import zipminator

    if not zipminator.RUST_AVAILABLE:
        pytest.skip("Rust _core not available on this platform")

    pk, sk = zipminator.keypair()
    ct, ss_a = zipminator.encapsulate(pk)
    ss_b = zipminator.decapsulate(ct, sk)
    assert ss_a == ss_b, "KEM roundtrip failed: shared secrets differ"


def test_kem_roundtrip_python_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force the Python fallback path and assert it still produces a valid KEM."""
    # Hide the Rust binding even if it is built, then re-import the package
    # so the `try/except ImportError` block executes the fallback branch.
    sys.modules.pop("zipminator._core", None)
    sys.modules.pop("zipminator", None)

    monkeypatch.setitem(
        sys.modules,
        "zipminator._core",
        None,  # makes `from zipminator._core import ...` raise ImportError
    )

    mod = importlib.import_module("zipminator")
    assert mod.RUST_AVAILABLE is False, "fallback branch did not run"

    pk, sk = mod.keypair()
    ct, ss_a = mod.encapsulate(pk)
    ss_b = mod.decapsulate(ct, sk)
    assert ss_a == ss_b, "Python fallback KEM roundtrip failed"


# ─── Cold-import time budget (regression guard) ──────────────────────────

# Budget rationale: top-level imports a `QuantumRandom` and `PQC` only;
# pandas / numpy / cryptography are pulled in lazily via `__getattr__`. A
# top-level pandas import alone adds ~600ms on M-series macOS. 350ms is a
# generous floor that still catches the obvious regression.

COLD_IMPORT_BUDGET_MS = 350.0


def test_cold_import_within_budget() -> None:
    """Top-level `import zipminator` must complete within budget."""
    # Strip every zipminator-* module to force a real cold import.
    for key in list(sys.modules):
        if key == "zipminator" or key.startswith("zipminator."):
            del sys.modules[key]

    start = time.perf_counter()
    importlib.import_module("zipminator")
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert elapsed_ms < COLD_IMPORT_BUDGET_MS, (
        f"cold import took {elapsed_ms:.1f}ms, budget {COLD_IMPORT_BUDGET_MS:.0f}ms — "
        f"a heavy top-level import (pandas? numpy?) likely slipped in"
    )


# ─── __getattr__ raises AttributeError, not ImportError, for unknowns ────

def test_unknown_attribute_raises_attribute_error() -> None:
    """`zipminator.UnknownThing` must raise AttributeError, not ImportError.

    This is the contract Python's import machinery expects. If the lazy
    `__getattr__` raised ImportError, hasattr() would behave incorrectly.
    """
    import zipminator

    with pytest.raises(AttributeError, match=r"has no attribute"):
        _ = zipminator.UnknownThing  # noqa: B018  (intentional access)


# ─── Version is semver-shaped ────────────────────────────────────────────

def test_version_is_semver_like() -> None:
    import re
    import zipminator
    assert re.match(r"^\d+\.\d+\.\d+(\D.*)?$", zipminator.__version__), (
        f"__version__ {zipminator.__version__!r} is not semver-shaped"
    )


# ─── TODO (user A/B): COLD_IMPORT_BUDGET_MS strictness ───────────────────
#
# The 350ms budget above is a guess. The real measurement on a clean M5 Max
# venv is what should set the floor. Two options before this skeleton ships:
#
#   Shape A — MEASURED-FLOOR: run `python -c 'import time, importlib;
#             t=time.perf_counter(); importlib.import_module("zipminator");
#             print((time.perf_counter()-t)*1000)'` three times in a fresh
#             venv, take the median, set budget to median * 1.5. Tightest
#             regression detection.
#   Shape B — HEADROOM: keep 350ms (or raise to 500ms) to absorb CI variance.
#             Looser, may miss small drifts but rarely flakes.
#
# Mo: pick A or B. A is more rigorous; B is more CI-friendly.
