"""v26 G4: nbconvert smoke for examples/notebooks/01_getting_started.ipynb.

The "Getting Started" notebook is the primary developer-facing artifact
for the `zipminator[jupyter]` PyPI extra. Investors and dev evaluators
open it FIRST. It uses `%load_ext zipminator.jupyter` and walks through
key generation, encryption, and the entropy monitor widget.

Today: zero coverage. If a magic name changes, a widget import breaks,
or the notebook references a removed API, the failure is discovered by
the next person who clicks "Run All" — usually an evaluator we're trying
to convert.

This test executes the notebook end-to-end via nbconvert's
ExecutePreprocessor. Any cell that raises fails the test with the cell
index and exception, which is the same UX as Jupyter's red banner.

Sister test test_jupyter_integration.py covers magics/widgets at the
unit level; THIS test covers them at the integration level (the actual
notebook the user runs).

Soft-skip pattern: nbconvert + ipykernel are heavy; if they're not
installed in the test env, skip rather than fail. CI installs them in
the docs-build job.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
NOTEBOOK = REPO_ROOT / "examples" / "notebooks" / "01_getting_started.ipynb"


def _have_nbconvert() -> bool:
    try:
        import nbconvert  # noqa: F401
        import nbformat  # noqa: F401
        return True
    except ImportError:
        return False


@pytest.fixture(scope="module")
def loaded_notebook():
    if not NOTEBOOK.exists():
        pytest.skip(f"{NOTEBOOK.relative_to(REPO_ROOT)} missing")
    if not _have_nbconvert():
        pytest.skip("nbconvert/nbformat not installed in this env")

    import nbformat

    return nbformat.read(NOTEBOOK, as_version=4)


def test_notebook_is_valid_v4_format(loaded_notebook):
    """Catch JSON corruption / wrong nbformat version before we even try
    to execute. nbformat.read raises ValidationError on bad files."""
    assert loaded_notebook.nbformat == 4
    assert isinstance(loaded_notebook.cells, list)
    assert len(loaded_notebook.cells) > 0, "notebook has zero cells"


def test_notebook_advertises_kyber768_constants(loaded_notebook):
    """The notebook's intro markdown promises ML-KEM-768 sizes:
        Public key 1184, Secret key 2400, Ciphertext 1088, Shared 32.

    If any of these drift in the docs, federal procurement reviewers
    will flag it as inconsistent with FIPS 203 — and they will, because
    that's what they're paid to do.
    """
    text = "\n".join(
        cell.source
        for cell in loaded_notebook.cells
        if cell.cell_type == "markdown"
    )
    for size in ("1184", "2400", "1088", "32"):
        assert size in text, (
            f"intro markdown lost the ML-KEM-768 constant '{size}'. "
            "FIPS 203 sizes are not negotiable; fix the notebook."
        )


def test_notebook_executes_end_to_end(loaded_notebook):
    """The actual smoke: execute every code cell.

    Skipped if ipykernel isn't available. The first failing cell becomes
    the assert message so a CI failure points at the broken step.
    """
    try:
        from nbconvert.preprocessors import ExecutePreprocessor
    except ImportError:
        pytest.skip("nbconvert.preprocessors unavailable")
    try:
        import ipykernel  # noqa: F401
    except ImportError:
        pytest.skip("ipykernel not installed; cannot execute notebook")

    ep = ExecutePreprocessor(timeout=60, kernel_name="python3")
    try:
        ep.preprocess(
            loaded_notebook,
            {"metadata": {"path": str(NOTEBOOK.parent)}},
        )
    except Exception as exc:
        pytest.fail(
            f"notebook execution failed: {type(exc).__name__}: {exc}\n"
            f"Re-run locally: jupyter nbconvert --to notebook --execute "
            f"{NOTEBOOK.relative_to(REPO_ROOT)}"
        )


def test_notebook_uses_load_ext_not_deprecated_import(loaded_notebook):
    """Pin the documented entrypoint: `%load_ext zipminator.jupyter`.
    A regression where someone replaces it with `import zipminator.jupyter`
    silently disables the magic registration — magic calls then fail at
    the NEXT cell with 'unknown magic'. Catch the regression here."""
    code = "\n".join(
        cell.source
        for cell in loaded_notebook.cells
        if cell.cell_type == "code"
    )
    assert "%load_ext zipminator.jupyter" in code, (
        "intro cell must register the magic via %load_ext zipminator.jupyter; "
        "a plain import does NOT register IPython magics."
    )
