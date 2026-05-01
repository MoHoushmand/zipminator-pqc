"""v23 G2: alembic env.py + script.py.mako exist but versions/ does not.

5th flagging across this repo's audit history (v3, v4, v7 G6, v9 G1, v23):
    api/alembic.ini                              EXISTS (script_location=src/db/migrations)
    api/src/db/migrations/env.py                 EXISTS
    api/src/db/migrations/script.py.mako         EXISTS
    api/src/db/migrations/versions/              MISSING <- bug

Effect: `alembic upgrade head` is a no-op against a fresh database, the
ORM models are never reflected as DDL, and any deployment that relies on
alembic for schema sync will silently start with an empty schema.

Two-part fix:
    1. Generate a baseline revision once: `alembic revision --autogenerate -m "baseline"`
    2. Add this regression test so the directory cannot disappear silently.
"""
from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
ALEMBIC_INI = REPO_ROOT / "api" / "alembic.ini"
MIGRATIONS_DIR = REPO_ROOT / "api" / "src" / "db" / "migrations"
VERSIONS_DIR = MIGRATIONS_DIR / "versions"


def test_alembic_config_present() -> None:
    if not ALEMBIC_INI.exists():
        pytest.skip("api/alembic.ini missing; alembic not configured here")
    text = ALEMBIC_INI.read_text(encoding="utf-8")
    assert "script_location = src/db/migrations" in text, (
        "alembic.ini script_location drifted from src/db/migrations"
    )


def test_versions_dir_exists_when_alembic_configured() -> None:
    """env.py without versions/ is a misconfiguration."""
    if not (MIGRATIONS_DIR / "env.py").exists():
        pytest.skip("alembic env.py missing; nothing to validate")
    assert VERSIONS_DIR.is_dir(), (
        f"alembic env.py is configured but {VERSIONS_DIR.relative_to(REPO_ROOT)} "
        "does not exist. Run from api/: `alembic revision --autogenerate -m baseline`"
    )


def test_at_least_one_migration_revision() -> None:
    """A configured alembic with zero revisions is a deployment hazard."""
    if not VERSIONS_DIR.is_dir():
        pytest.skip("versions/ absent; covered by previous test")
    revisions = [
        p
        for p in VERSIONS_DIR.glob("*.py")
        if not p.name.startswith("__")
    ]
    assert revisions, (
        f"{VERSIONS_DIR.relative_to(REPO_ROOT)} contains no migration files. "
        "Run from api/: `alembic revision --autogenerate -m baseline` and commit "
        "the resulting versions/<timestamp>_<rev>_baseline.py."
    )
