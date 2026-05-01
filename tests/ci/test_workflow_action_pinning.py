"""v23 G1: GitHub Actions workflows pin third-party actions to mutable refs.

Inventory across 15 workflows in .github/workflows/ (1894 LOC unaudited):
- aquasecurity/trivy-action@master      (docker, production, security)
- trufflesecurity/trufflehog@main       (pre-commit)
- dtolnay/rust-toolchain@stable         (security, others)
- EmbarkStudios/cargo-deny-action@v1    (security)
- actions/checkout@v4, setup-python@v5  (everywhere)

@master / @main are MUTABLE: an upstream compromise rewrites the action
behavior with no PR signal. SLSA Level 3 + OpenSSF best practice = SHA pin
(`uses: org/repo@<40-char-sha>`).

USER DECISION (TODO before un-skipping):
    A. STRICT: every external action must be SHA-pinned. Block PR otherwise.
    B. TIERED: SHA-pin actions reaching outside actions/* (Trivy, TruffleHog,
       cargo-deny, rust-toolchain). actions/* may stay on @v4/v5. Easier to
       maintain; relies on GitHub's own action publisher trust.
    C. DEPENDABOT: enable .github/dependabot.yml `package-ecosystem: github-actions`
       and accept whatever Dependabot pins. Lowest manual burden.

Recommended: B. The actions/* org has a strong publisher trust model;
third-party actions don't.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = REPO_ROOT / ".github" / "workflows"

USES_RE = re.compile(r"uses:\s*([^@\s]+)@([^\s#]+)")

# Tier B allowlist: first-party actions that may pin to @vN.
ALLOWLIST_VTAG = {
    "actions/checkout",
    "actions/setup-python",
    "actions/setup-node",
    "actions/cache",
    "actions/upload-artifact",
    "actions/download-artifact",
    "actions/upload-pages-artifact",
    "actions/deploy-pages",
    "actions/github-script",
    "github/codeql-action/init",
    "github/codeql-action/autobuild",
    "github/codeql-action/analyze",
    "github/codeql-action/upload-sarif",
}

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
VTAG_RE = re.compile(r"^v\d+(\.\d+(\.\d+)?)?$")


def _scan() -> list[tuple[Path, str, str]]:
    if not WORKFLOWS.is_dir():
        pytest.skip(".github/workflows/ not present")
    refs: list[tuple[Path, str, str]] = []
    for wf in WORKFLOWS.glob("*.yml"):
        for line in wf.read_text(encoding="utf-8").splitlines():
            m = USES_RE.search(line)
            if m:
                refs.append((wf.relative_to(REPO_ROOT), m.group(1), m.group(2)))
    return refs


@pytest.mark.skip(reason="TODO v23 G1: pick policy tier (A/B/C) before enabling")
def test_no_branch_refs_in_third_party_actions() -> None:
    """Tier B: third-party actions must not pin to a branch (master/main)."""
    branchy = [
        (wf, action, ref)
        for wf, action, ref in _scan()
        if action not in ALLOWLIST_VTAG
        and not SHA_RE.match(ref)
        and not VTAG_RE.match(ref)
    ]
    assert branchy == [], (
        "Third-party actions pinned to branch refs (mutable, supply-chain risk):\n"
        + "\n".join(f"  {wf}: {a}@{r}" for wf, a, r in branchy)
    )


@pytest.mark.skip(reason="TODO v23 G1: enable when Tier A is selected")
def test_strict_sha_pinning_for_third_party() -> None:
    """Tier A: every non-actions/* reference must be a 40-char SHA."""
    unpinned = [
        (wf, action, ref)
        for wf, action, ref in _scan()
        if action not in ALLOWLIST_VTAG and not SHA_RE.match(ref)
    ]
    assert unpinned == [], (
        "Tier A requires SHA pinning. Convert these:\n"
        + "\n".join(f"  {wf}: {a}@{r}" for wf, a, r in unpinned)
    )
