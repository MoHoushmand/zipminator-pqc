"""Regression test for v23 G5: entropy-harvest provenance must not leak into git.

Background:
    `quantum_entropy/harvest_log.jsonl` was tracked in git for ~152 harvest
    cycles before being untracked in audit v23 (2026-05-01). The .gitignore
    rule `quantum_entropy/*.jsonl` was added afterwards, but git only honors
    .gitignore for untracked files. The fix was `git rm --cached`.

    Each harvest entry exposed: timestamp, backend, bytes_harvested, sha256,
    pool_before, pool_after. The SHA256 of harvested bytes is one-way, but
    the cadence + source identity is metadata an adversary could correlate.

This test asserts the artifacts never re-enter the index.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
ENTROPY_DIR = REPO_ROOT / "quantum_entropy"

# Patterns that must NEVER be tracked. .gitignore already lists these,
# but .gitignore does not retroactively untrack.
FORBIDDEN_PATTERNS = (
    "*.bin",
    "*.pos",
    "*.qep",
    "*.log",
    "*.jsonl",
)


def _git_ls_files(path: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "--", str(path.relative_to(REPO_ROOT))],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def test_entropy_dir_has_no_tracked_runtime_artifacts() -> None:
    """No file matching the forbidden patterns may be tracked."""
    if not ENTROPY_DIR.exists():
        pytest.skip("quantum_entropy/ not present in this checkout")

    tracked = _git_ls_files(ENTROPY_DIR)
    leaks = [
        f
        for f in tracked
        if any(Path(f).match(f"quantum_entropy/{pat}") for pat in FORBIDDEN_PATTERNS)
    ]
    assert leaks == [], (
        "Runtime entropy artifacts are tracked in git. "
        "Run `git rm --cached <file>` for each, then commit. "
        f"Leaks: {leaks}"
    )


def test_gitignore_covers_entropy_artifacts() -> None:
    """Each forbidden pattern must be present in .gitignore."""
    gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")
    missing = [
        pat for pat in FORBIDDEN_PATTERNS
        if f"quantum_entropy/{pat}" not in gitignore
    ]
    assert missing == [], (
        f".gitignore is missing patterns for entropy artifacts: {missing}"
    )
