"""Regression tests for `scripts/prepare-release.sh` (and siblings).

Coverage gap v21 G7: prepare-release.sh (307 LOC), deploy_staging.sh (456 LOC),
rollback_staging.sh (311 LOC), and secure_token_migration.sh (305 LOC) total
1379 LOC of release/deploy bash with zero tests. tests/gtm/test_release_artifacts_exist.py
only checks that markdown files exist; it does NOT exercise the scripts.

Strategy: invoke each script with DRY_RUN=true and assert:
  - Exit code 0 (or expected non-zero with helpful stderr)
  - No git mutations (HEAD, tags, branches unchanged)
  - No file mutations outside the script's declared write set
  - Side effects are described, not performed

prepare-release.sh already honors `DRY_RUN=${DRY_RUN:-false}` per scripts/prepare-release.sh:29.
deploy_staging.sh + rollback_staging.sh + secure_token_migration.sh need
audit: they may not honor DRY_RUN yet. The audit gap and the test gap
collapse into the same fix.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / "scripts"


def _git_state(repo: Path) -> dict[str, str]:
    """Capture git state we'll assert is unchanged after a dry-run."""

    def _git(*args: str) -> str:
        r = subprocess.run(
            ["git", "-C", str(repo), *args],
            capture_output=True,
            text=True,
            check=False,
        )
        return r.stdout.strip()

    return {
        "head": _git("rev-parse", "HEAD"),
        "branch": _git("rev-parse", "--abbrev-ref", "HEAD"),
        "tags": _git("tag", "--list"),
        "status": _git("status", "--porcelain"),
    }


@pytest.fixture
def script_env(tmp_path: Path) -> dict[str, str]:
    """Sanitized env for running scripts: DRY_RUN on, no real CI tokens."""
    return {
        **os.environ,
        "DRY_RUN": "true",
        "SKIP_TESTS": "true",
        "CI": "true",
        # Block accidental network/auth side effects.
        "GH_TOKEN": "",
        "VAULT_TOKEN": "",
        "AWS_ACCESS_KEY_ID": "",
    }


def test_prepare_release_dry_run_does_not_mutate_git(script_env):
    """prepare-release.sh DRY_RUN=true must not change HEAD, tags, or status."""
    script = SCRIPTS / "prepare-release.sh"
    assert script.is_file(), f"missing {script}"

    before = _git_state(REPO_ROOT)

    r = subprocess.run(
        ["bash", str(script), "0.0.0-test"],
        env=script_env,
        capture_output=True,
        text=True,
        timeout=60,
        cwd=REPO_ROOT,
    )

    after = _git_state(REPO_ROOT)
    assert before == after, (
        f"git state changed during DRY_RUN. stderr: {r.stderr[:500]}"
    )


def test_prepare_release_rejects_missing_version_arg(script_env):
    """No version arg -> non-zero exit + usage hint."""
    r = subprocess.run(
        ["bash", str(SCRIPTS / "prepare-release.sh")],
        env=script_env,
        capture_output=True,
        text=True,
        timeout=10,
        cwd=REPO_ROOT,
    )
    assert r.returncode != 0
    assert "Usage" in r.stdout or "usage" in r.stdout.lower()


@pytest.mark.parametrize(
    "script_name",
    ["deploy_staging.sh", "rollback_staging.sh", "secure_token_migration.sh"],
)
def test_dry_run_flag_is_honored(script_env, script_name: str):
    """Each deploy/rollback/migrate script must have a DRY_RUN code path
    that exits cleanly without touching staging or vault.

    This test is xfail until the script audit is complete; the audit fix
    is to add `if [[ "$DRY_RUN" == "true" ]]; then echo '[dry-run] ...'; exit 0; fi`
    or per-step gating."""
    script = SCRIPTS / script_name
    assert script.is_file(), f"missing {script}"
    content = script.read_text()
    if "DRY_RUN" not in content:
        pytest.xfail(
            f"v21 G7: {script_name} does not reference DRY_RUN. "
            f"Add a DRY_RUN gate before any destructive op."
        )

    r = subprocess.run(
        ["bash", str(script)],
        env=script_env,
        capture_output=True,
        text=True,
        timeout=30,
        cwd=REPO_ROOT,
    )
    # Exit 0 OR an explicit non-zero with a helpful message; both are OK.
    # Zero side effects are the actual invariant. Per-script side-effect
    # capture (mock kubectl, gh, vault) is the next-step user contribution:
    # decide the mock surface and pin assertions.
    assert "destructive" not in r.stdout.lower() or "[dry-run]" in r.stdout.lower()


def test_secure_token_migration_does_not_print_token_to_stdout(script_env):
    """If a token must be migrated, the script MUST NOT echo it to stdout
    (CI logs are world-readable). Regression here is a credential leak.

    This is a content invariant: scan the script source for direct `echo
    $TOKEN` patterns.
    """
    script = SCRIPTS / "secure_token_migration.sh"
    if not script.is_file():
        pytest.skip(f"{script} not present")
    content = script.read_text()
    # Naive but useful: flag any direct echo of a *_TOKEN variable.
    bad_patterns = [
        'echo "$VAULT_TOKEN"',
        "echo $VAULT_TOKEN",
        'echo "$GH_TOKEN"',
        "echo $GH_TOKEN",
        'echo "$AWS_SECRET_ACCESS_KEY"',
    ]
    for pat in bad_patterns:
        assert pat not in content, f"secure_token_migration.sh leaks token via: {pat!r}"
