"""Verifies v1.0.0 release artifacts exist and have minimum required content."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def test_changelog_exists_with_v1_entry():
    path = ROOT / "CHANGELOG.md"
    assert path.exists(), f"missing {path}"
    content = path.read_text()
    assert re.search(r"^## \[1\.0\.0\]", content, re.MULTILINE), "no v1.0.0 heading"


def test_release_notes_exists():
    path = ROOT / "docs" / "releases" / "v1.0.0.md"
    assert path.exists(), f"missing {path}"
    content = path.read_text()
    assert "Zipminator" in content
    assert "ML-KEM-768" in content
    assert "NIST FIPS 203" in content


def test_blog_draft_exists():
    path = ROOT / "docs" / "blog" / "2026-04-19-zipminator-v1.md"
    assert path.exists(), f"missing {path}"


def test_linkedin_draft_exists():
    path = ROOT / "docs" / "marketing" / "v1-linkedin-announcement.md"
    assert path.exists(), f"missing {path}"


def test_release_notes_mention_pillars():
    path = ROOT / "docs" / "releases" / "v1.0.0.md"
    content = path.read_text()
    pillars = [
        "Quantum Vault",
        "PQC Messenger",
        "Q-VPN",
        "Anonymization",
        "Q-AI",
        "Quantum-Secure Email",
        "ZipBrowser",
        "Q-Mesh",
    ]
    for pillar in pillars:
        assert pillar in content, f"release notes missing {pillar}"
