"""v26 G1: bind UniqueConstraint('conversation_id','sequence') to alembic head.

Sister test to test_alembic_versions_present.py. That one catches "no versions/
dir at all"; this one catches the next failure mode after a baseline migration
is generated:

    Production has alembic configured AND a versions/ dir AND `alembic upgrade
    head` runs cleanly, but the active head does NOT create uq_msg_conv_seq.
    Result: messages.py:79-100 retry loop never raises IntegrityError, the
    sequence-allocation race silently returns to the v22 G1 / v18 / v22 / v27
    behavior, and 8 concurrent senders again get duplicate sequence numbers.

The danger here is asymmetric: tests pass because conftest uses
Base.metadata.create_all() which reads message_models.py and creates the table
WITH the constraint. Production uses alembic.upgrade() which only creates what
the migration file SAYS. If a developer adds a model-level UniqueConstraint
without re-running `alembic revision --autogenerate`, prod silently drifts.

Contract:
- If versions/ has migration files, AT LEAST ONE must mention 'uq_msg_conv_seq'
  by name (the constraint name in message_models.py:38).
- Failure mode: someone added the constraint to ORM but didn't generate the
  alembic delta. Run `alembic revision --autogenerate -m add_uq_msg_conv_seq`.

YOU PICK ONE BEFORE COMMITTING — these are the three deployment shapes that
get production back in sync:

(A) BASELINE-THEN-STAMP: alembic revision --autogenerate -m baseline,
    then in prod `alembic stamp head` once before the next upgrade. Cheapest;
    safe IFF every prod schema currently matches the ORM (it doesn't — that's
    the bug). Adds risk of "table already exists" on fresh deploys after this.

(B) IDEMPOTENT-IF-NOT-EXISTS: hand-write a migration with a raw SQL
    `ALTER TABLE messages ADD CONSTRAINT uq_msg_conv_seq UNIQUE
    (conversation_id, sequence) IF NOT EXISTS;` (Postgres 15+). Survives
    re-runs and applies cleanly to drifted schemas. Requires PG 15+ on prod.

(C) HAND-WRITTEN SINGLE-PURPOSE: alembic revision -m add_uq_msg_conv_seq
    (no --autogenerate), body = op.create_unique_constraint(
        'uq_msg_conv_seq', 'messages', ['conversation_id', 'sequence']
    ). Works on any Postgres. Fails loudly on already-applied prod (caller
    must catch DuplicateObject and treat as no-op, or pre-check pg_constraint).

Default recommendation: (C) — explicit, version-controlled, no magic. The
op.create_unique_constraint reverse() body lets `alembic downgrade` clean it.
"""
from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
VERSIONS_DIR = REPO_ROOT / "api" / "src" / "db" / "migrations" / "versions"
CONSTRAINT_NAME = "uq_msg_conv_seq"


def _migration_files() -> list[Path]:
    if not VERSIONS_DIR.is_dir():
        return []
    return [p for p in VERSIONS_DIR.glob("*.py") if not p.name.startswith("__")]


def test_uq_msg_conv_seq_appears_in_some_migration() -> None:
    """The ORM declares the constraint; alembic must create it in production.

    Without this binding, conftest-only Base.metadata.create_all() makes tests
    pass while prod silently regresses to the v22 race.
    """
    files = _migration_files()
    if not files:
        pytest.skip(
            "versions/ empty; covered by test_alembic_versions_present.py. "
            "Run `alembic revision --autogenerate -m baseline` first, then this "
            "test will activate."
        )

    found = any(CONSTRAINT_NAME in p.read_text(encoding="utf-8") for p in files)
    assert found, (
        f"No migration in {VERSIONS_DIR.relative_to(REPO_ROOT)} mentions "
        f"'{CONSTRAINT_NAME}'. message_models.py declares it on the Message "
        "table; if it's not in alembic, production will silently lack the "
        "constraint and the messages.py retry loop never triggers. "
        "Run from api/: `alembic revision --autogenerate -m add_uq_msg_conv_seq`."
    )


def test_constraint_is_unique_not_index() -> None:
    """Belt-and-suspenders: ensure whatever migration adds it uses
    create_unique_constraint, not create_index. An index would let duplicates
    in (it would just speed up SELECTs)."""
    files = _migration_files()
    if not files:
        pytest.skip("covered by sibling test")

    relevant = [
        p for p in files
        if CONSTRAINT_NAME in p.read_text(encoding="utf-8")
    ]
    if not relevant:
        pytest.skip("covered by test_uq_msg_conv_seq_appears_in_some_migration")

    for p in relevant:
        text = p.read_text(encoding="utf-8")
        # Either alembic op or raw SQL form is acceptable.
        ok = (
            "create_unique_constraint" in text
            or "ADD CONSTRAINT" in text.upper()
            or "UNIQUE" in text.upper()
        )
        assert ok, (
            f"{p.name} mentions {CONSTRAINT_NAME} but does not use "
            "create_unique_constraint or raw UNIQUE DDL. An index alone won't "
            "block duplicate (conversation_id, sequence) inserts."
        )
