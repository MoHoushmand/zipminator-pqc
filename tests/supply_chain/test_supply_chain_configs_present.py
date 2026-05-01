"""v23 G4: supply-chain configs absent. Re-flag of v7 G2.

Today's state vs CI expectations:
    .pre-commit-config.yaml    MISSING -> .github/workflows/pre-commit.yml is a no-op
    deny.toml                  MISSING -> EmbarkStudios/cargo-deny-action falls back
                                          to defaults (advisory only, no policy)
    audit.toml                 MISSING -> `cargo audit --deny warnings` has no
                                          ignore list, so accepted-risk advisories
                                          (e.g. RUSTSEC-2023-0071 / RSA timing in
                                          a compile-only dep) cannot be acknowledged
                                          and CI flips red on every advisory.

Effect: the security-audit job in .github/workflows/security.yml LOOKS like
it enforces supply-chain hygiene, but two of three checks degrade silently
when their config is absent.

USER DECISION (TODO before un-skipping):
    A. PERMISSIVE: deny.toml allows all licenses + advisories => useful only as
       a tripwire that surfaces NEW issues over time.
    B. STRICT: deny.toml whitelists a fixed license set (Apache-2.0, MIT, BSD-3,
       MPL-2.0) and bans GPL/AGPL. audit.toml ignores nothing.
    C. EXPLICIT: deny.toml STRICT + audit.toml documents each accepted advisory
       with reason + expiry date.

Recommended: C, with a quarterly review hook. The cost of B is exactly one
new advisory away from a red CI; C lets the team triage without bypass.
"""
from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.skip(reason="TODO v23 G4: pick policy tier (A/B/C) and create the file")
def test_pre_commit_config_present() -> None:
    """A .github/workflows/pre-commit.yml that runs against a missing config is a no-op."""
    cfg = REPO_ROOT / ".pre-commit-config.yaml"
    assert cfg.exists(), (
        ".pre-commit-config.yaml missing. The pre-commit.yml workflow has nothing "
        "to run. Add hooks for: ruff, black, mypy, prettier, eslint, cargo-fmt, "
        "trufflehog (mirrors the Action), python-env-guard."
    )


@pytest.mark.skip(reason="TODO v23 G4: pick deny.toml policy tier")
def test_cargo_deny_config_present() -> None:
    """cargo-deny-action degrades to advisory-only without a deny.toml."""
    cfg = REPO_ROOT / "deny.toml"
    assert cfg.exists(), (
        "deny.toml missing. EmbarkStudios/cargo-deny-action@v1 in security.yml "
        "falls back to defaults. Generate with: `cargo deny init` from core/."
    )


@pytest.mark.skip(reason="TODO v23 G4: enable once accepted-advisory list is curated")
def test_cargo_audit_config_present() -> None:
    """`cargo audit --deny warnings` cannot be tuned without audit.toml."""
    cfg = REPO_ROOT / ".cargo" / "audit.toml"
    fallback = REPO_ROOT / "audit.toml"
    assert cfg.exists() or fallback.exists(), (
        "audit.toml missing. Without it, every new advisory turns CI red even "
        "for accepted compile-only risks. Create at .cargo/audit.toml with "
        "[advisories.ignore] entries that include reason + review_by date."
    )
