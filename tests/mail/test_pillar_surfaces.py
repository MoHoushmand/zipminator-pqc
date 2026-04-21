"""Iter 4: Owned docs + web surface assertions for Pillar 7.

The marathon task lists these as owned globs:
  - docs/guides/pillars/07-quantum-email.md
  - web/app/(dashboard)/mail/**

These tests pin the minimum structural contract for both surfaces:
the docs page must exist, must cover the NIST FIPS 203 (ML-KEM-768)
claim, and must link the operational components (Postfix, Dovecot,
docker-compose). The web dashboard page must be a Next.js 16 route that
references the PQC mail infrastructure.
"""
from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PILLAR_DOC = REPO_ROOT / "docs" / "guides" / "pillars" / "07-quantum-email.md"
DASHBOARD_DIR = REPO_ROOT / "web" / "app" / "(dashboard)" / "mail"
DASHBOARD_PAGE = DASHBOARD_DIR / "page.tsx"
DASHBOARD_LAYOUT = DASHBOARD_DIR / "layout.tsx"


def _read(p: Path) -> str:
    assert p.is_file(), f"missing expected file: {p}"
    return p.read_text(encoding="utf-8")


def test_pillar_doc_exists() -> None:
    assert PILLAR_DOC.is_file(), f"missing pillar doc: {PILLAR_DOC}"


def test_pillar_doc_has_fips_language() -> None:
    """Doc must use the approved FIPS language (NIST FIPS 203 / ML-KEM-768)."""
    text = _read(PILLAR_DOC)
    assert "NIST FIPS 203" in text, "missing 'NIST FIPS 203' marker"
    assert "ML-KEM-768" in text, "missing 'ML-KEM-768' marker"
    # Banned in FIPS-context language (global rule):
    assert "FIPS 140-3 certified" not in text
    assert "FIPS 140-3 validated" not in text
    assert "FIPS compliant" not in text


def test_pillar_doc_links_operational_components() -> None:
    """Doc must name the MTA/IMAP stack and the container entry point."""
    text = _read(PILLAR_DOC)
    for needle in ("Postfix", "Dovecot", "docker", "X25519MLKEM768"):
        assert needle in text, f"pillar doc is missing reference to {needle!r}"


def test_pillar_doc_contains_exit_criteria() -> None:
    text = _read(PILLAR_DOC)
    assert "Exit criteria" in text or "exit criteria" in text, (
        "doc should enumerate the pillar's exit criteria"
    )


def test_dashboard_mail_page_exists() -> None:
    assert DASHBOARD_PAGE.is_file(), f"missing dashboard page: {DASHBOARD_PAGE}"


def test_dashboard_mail_page_is_next16_server_component() -> None:
    """The page must be a default-export async function (Next.js 16 RSC)."""
    text = _read(DASHBOARD_PAGE)
    assert "export default" in text
    assert "async function" in text or "async (" in text or "async " in text
    # The page sits under a route group `(dashboard)` so the rendered URL
    # is /mail; the page must reference the PQC mail feature.
    assert "ML-KEM-768" in text or "PQC" in text, (
        "dashboard mail page must reference PQC / ML-KEM-768"
    )


def test_dashboard_mail_layout_exists() -> None:
    assert DASHBOARD_LAYOUT.is_file(), f"missing dashboard layout: {DASHBOARD_LAYOUT}"


def test_dashboard_mail_layout_has_children_prop() -> None:
    text = _read(DASHBOARD_LAYOUT)
    assert "children" in text, "layout must accept children"
    assert "export default" in text


def test_no_banned_tokens_in_owned_web_files() -> None:
    """Global banned-words rule applies to owned surfaces."""
    banned = (
        "honestly",
        "robust",
        "leverage",
        "delve",
        "game-changer",
        "paradigm shift",
        "cutting-edge",
    )
    for p in (DASHBOARD_PAGE, DASHBOARD_LAYOUT):
        if p.is_file():
            text = p.read_text(encoding="utf-8").lower()
            for w in banned:
                assert w not in text, f"banned token {w!r} in {p}"


def test_no_em_dashes_in_owned_surfaces() -> None:
    """Global banned-punctuation rule: em dashes (U+2014) are forbidden."""
    for p in (PILLAR_DOC, DASHBOARD_PAGE, DASHBOARD_LAYOUT):
        if p.is_file():
            text = p.read_text(encoding="utf-8")
            assert "\u2014" not in text, f"em dash (U+2014) found in {p}"
