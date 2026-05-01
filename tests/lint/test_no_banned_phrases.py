"""v23 G3: no automated guard for CLAUDE.md zero-tolerance phrase list.

CLAUDE.md states (zero tolerance, every surface):
    BANNED FIPS: "FIPS 140-3 certified", "FIPS 140-3 validated", "FIPS compliant"
        Reason: federal procurement red flag without an active CMVP certificate.
    BANNED WORDS: "robust", "leverage", "delve", "honest", "honestly",
        "to be honest", "I appreciate", "Great question", "Absolutely",
        "Let me be clear", "it's worth noting", "importantly", "game-changer",
        "paradigm shift", "cutting-edge"
    BANNED PUNCTUATION: em dash (U+2014)

Today these are enforced only by docs/research/eprint/SHIP_READINESS.md
(human checklist) and a Stop hook on assistant chat output. Source code,
docs/, web/lib/pitch-data.ts, README* can drift silently.

USER DECISION (TODO before un-skipping):
    A. STRICT: any banned phrase in any text file fails CI.
    B. SCOPED: only docs/, web/lib/pitch-data.ts, web/lib/sb1-pitch-types.ts,
       web/lib/blueprint-prose.ts, README*, RELEASE_NOTES*. Code comments OK.
    C. FIPS-ONLY: only the 3 FIPS phrases are blocking; banned words are warnings.

Recommended: B. The FIPS phrases are external-comms blockers; the AI-style
banned words mostly matter for marketing surfaces, not Rust source.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]

BANNED_FIPS = (
    "FIPS 140-3 certified",
    "FIPS 140-3 validated",
    "FIPS compliant",
)

BANNED_WORDS = (
    r"\brobust\b",
    r"\bleverage\b",
    r"\bdelve\b",
    r"\bhonestly\b",
    r"\bgame-changer\b",
    r"\bparadigm shift\b",
    r"\bcutting-edge\b",
)

EM_DASH = "—"

# Tier B scope.
SCOPED_PATHS = (
    "docs",
    "web/lib/pitch-data.ts",
    "web/lib/sb1-pitch-types.ts",
    "web/lib/blueprint-prose.ts",
    "README.md",
)

# False-positive containment: discuss-the-banned-phrase contexts.
ALLOWLIST_DOCS = (
    "docs/research/eprint/SHIP_READINESS.md",
    "docs/releases",
    "docs/guides/RELEASE_NOTES_v1.0.0.md",
    "docs/guides/FEATURES.md",
    "docs/social/github-release-notes.md",
    "docs/guides/prompts/AESR/v5/AESR_v5.md",
    "docs/book/content/appendix/fips_203.md",
)


def _iter_scoped_files() -> list[Path]:
    files: list[Path] = []
    for entry in SCOPED_PATHS:
        p = REPO_ROOT / entry
        if p.is_file():
            files.append(p)
        elif p.is_dir():
            files.extend(
                f
                for f in p.rglob("*")
                if f.is_file()
                and f.suffix.lower() in {".md", ".txt", ".ts", ".tsx", ".rst"}
            )
    return files


def _is_allowlisted(path: Path) -> bool:
    rel = str(path.relative_to(REPO_ROOT))
    return any(rel.startswith(a) for a in ALLOWLIST_DOCS)


@pytest.mark.skip(reason="TODO v23 G3: pick scope tier (A/B/C) before enabling")
def test_no_banned_fips_phrases_in_user_facing_text() -> None:
    """The 3 FIPS phrases are commercial procurement blockers."""
    leaks: list[str] = []
    for path in _iter_scoped_files():
        if _is_allowlisted(path):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for phrase in BANNED_FIPS:
            if phrase in text:
                leaks.append(f"{path.relative_to(REPO_ROOT)}: '{phrase}'")
    assert leaks == [], (
        "Banned FIPS phrasing detected. Replace with "
        "'Implements NIST FIPS 203 (ML-KEM-768)' or "
        "'Verified against NIST KAT test vectors'.\n"
        + "\n".join(leaks)
    )


@pytest.mark.skip(reason="TODO v23 G3: enable after Tier B/C is selected")
def test_no_banned_words_in_user_facing_text() -> None:
    leaks: list[str] = []
    for path in _iter_scoped_files():
        if _is_allowlisted(path):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in BANNED_WORDS:
            for m in re.finditer(pattern, text, flags=re.IGNORECASE):
                leaks.append(
                    f"{path.relative_to(REPO_ROOT)}: '{m.group()}' at offset {m.start()}"
                )
    assert leaks == [], "AI-style banned words:\n" + "\n".join(leaks[:50])


@pytest.mark.skip(reason="TODO v23 G3: em-dash policy - replace with comma/semicolon")
def test_no_em_dashes_in_user_facing_text() -> None:
    leaks: list[str] = []
    for path in _iter_scoped_files():
        if _is_allowlisted(path):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if EM_DASH in text:
            count = text.count(EM_DASH)
            leaks.append(f"{path.relative_to(REPO_ROOT)}: {count} em-dash(es)")
    assert leaks == [], (
        "Em-dashes found. Replace with comma, semicolon, or split sentence.\n"
        + "\n".join(leaks)
    )
