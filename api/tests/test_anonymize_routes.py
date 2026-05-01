"""FastAPI route coverage for src/routes/anonymize.py.

Routes tested:
  - POST /api/anonymize          JSON  {level: 1-10, text}
  - POST /v1/anonymize-attachment multipart upload + ?level= query

Run:
    micromamba activate zip-pqc
    DATABASE_URL=sqlite:///./test.db SECRET_KEY=test \\
      pytest api/tests/test_anonymize_routes.py -v

REGRESSIONS CAUGHT BY THIS SUITE (xfail strict=True; remove the marker
when the underlying bug is fixed and the test will start passing loudly):

  B1  test_unicode_text_does_not_crash_regex
        Surrogate `\\udcff` in `text` slips past `\\b\\w+\\b` (not a word
        char), passes through `_apply_text_anonymization` untouched, then
        Starlette raises UnicodeEncodeError on response render → 500.
        Fix: input-sanitize before regex (e.g. `text.encode('utf-8',
        'replace').decode('utf-8')` or pydantic validator that rejects
        unpaired surrogates with 422). Choice is a USER DESIGN DECISION
        (see test docstring for trade-offs).

  B2  test_attachment_csv_round_trip
        CRITICAL privacy-leak: response body is the EXACT original CSV
        unchanged. Either `zipminator.anonymizer.AdvancedAnonymizer` is
        absent from this env (silent ImportError) or `.process()` is a
        no-op. Caller saw HTTP 200 but received PII back verbatim. The
        ImportError-fallback path also doesn't engage because the CSV
        content_type is not `text/plain`.

  B3  test_attachment_path_traversal_filename_safe
        `Content-Disposition: filename="anon_L5_../../etc/passwd"` —
        path components from the uploaded filename leak into the
        response header. CWE-22 / CWE-179. Most browsers strip but
        downloader proxies, curl -OJ, etc. don't.

USER DESIGN DECISIONS (still pending — these tests cover both branches):
  1. Levels 0 and 11+ — hard 422 (current Pydantic ge=1 le=10 is correct).
  2. Oversize attachment threshold (pandas.read_csv on 2 GiB OOMs worker
     before 413 fires). Pick a streaming check at ingress.
  3. Empty text input — 200 with empty anonymized_text vs 422.
  4. **Surrogate sanitization strategy for B1** (one of):
       (a) Pydantic validator rejecting unpaired surrogates → 422
       (b) Pre-regex `text.encode('utf-8','replace').decode('utf-8')`
       (c) Catch UnicodeEncodeError on response and 500 with safer body
       (d) Response with errors='replace' encoding
"""

from __future__ import annotations

import io
import json
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# ── Happy path ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("level", [1, 5, 10])
def test_anonymize_text_levels(client: TestClient, level: int) -> None:
    r = client.post(
        "/api/anonymize",
        json={"level": level, "text": "Mo Houshmand mo@qdaria.com 555-1234"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["level"] == level
    assert body["original_text"].startswith("Mo Houshmand")
    # Higher level -> stronger redaction. At minimum the email must be masked
    # at L>=3. TODO: confirm exact L->mask matrix with product.
    if level >= 3:
        assert "mo@qdaria.com" not in body["anonymized_text"]


# ── Trust-seam (boundary) ──────────────────────────────────────────────────

@pytest.mark.parametrize("level", [0, -1, 11, 999])
def test_level_out_of_range_rejected(client: TestClient, level: int) -> None:
    """L1-L10 is product contract. Out-of-range must not silently clamp."""
    r = client.post("/api/anonymize", json={"level": level, "text": "hi"})
    # TODO: pick policy. Recommended: 422 (Pydantic Field(ge=1, le=10)).
    assert r.status_code == 422


def test_empty_text_is_handled(client: TestClient) -> None:
    r = client.post("/api/anonymize", json={"level": 5, "text": ""})
    # TODO: 200 with empty anonymized_text, or 422?
    assert r.status_code in (200, 422)


@pytest.mark.xfail(
    strict=True,
    reason="B1: surrogate \\udcff slips past \\b\\w+\\b regex, Starlette UnicodeEncodeError on render → 500. Awaiting user A/B/C/D pick on sanitization strategy (see module docstring).",
)
def test_unicode_text_does_not_crash_regex(client: TestClient) -> None:
    """Surrogate pairs and combining characters must not raise UnicodeError.

    Smuggled-input vector: a malicious caller sends an unpaired surrogate
    in the `text` field. The regex `\\b\\w+\\b` does NOT match `\\udcff`
    because it's not a word character, so the surrogate passes through
    `_apply_text_anonymization` and into the response body. Starlette
    then crashes on UTF-8 encode → 500.
    """
    nasty = "👨‍💻 ‮ attack \udcff " + "𝓐" * 5000
    r = client.post("/api/anonymize", json={"level": 7, "text": nasty})
    assert r.status_code == 200, r.text


def test_oversize_text_payload(client: TestClient) -> None:
    """A 50 MiB inline text must not OOM the worker."""
    huge = "alice@example.com " * 3_000_000  # ~50 MiB
    r = client.post("/api/anonymize", json={"level": 5, "text": huge})
    # TODO: enforce a max_length on the Pydantic model. 422 expected after.
    assert r.status_code in (200, 413, 422)


# ── Attachment endpoint ────────────────────────────────────────────────────

@pytest.mark.xfail(
    strict=True,
    reason="B2 (CRITICAL): tabular path returns ORIGINAL CSV unchanged at level 5. AdvancedAnonymizer.process() is no-op or absent; ImportError-fallback never engages because text/csv content_type bypasses the text-only branch. Privacy leak.",
)
def test_attachment_csv_round_trip(client: TestClient) -> None:
    """At L5, the response body must NOT contain the original PII verbatim.

    Currently fails: caller receives HTTP 200 + the unmodified CSV. This
    is silently equivalent to a security incident — user requested
    anonymization, server reported success, but PII left the system
    intact. The fix touches src/routes/anonymize.py:196-211 (the tabular
    branch and its ImportError fallback).
    """
    csv = b"name,email,phone\nMo,mo@qdaria.com,555-1234\nAlice,a@b.io,555-9999\n"
    r = client.post(
        "/v1/anonymize-attachment?level=5",
        files={"file": ("contacts.csv", csv, "text/csv")},
    )
    assert r.status_code == 200, r.text
    assert b"mo@qdaria.com" not in r.content


def test_attachment_unsupported_mime_returns_415(client: TestClient) -> None:
    r = client.post(
        "/v1/anonymize-attachment?level=5",
        files={"file": ("img.png", b"\x89PNG\r\n", "image/png")},
    )
    assert r.status_code in (415, 422)


def test_attachment_corrupt_csv_does_not_500(client: TestClient) -> None:
    """A truncated quoted field must surface as 4xx, not 500."""
    bad = b'name,email\n"unterminated quote, mo@qdaria.com\n'
    r = client.post(
        "/v1/anonymize-attachment?level=5",
        files={"file": ("bad.csv", bad, "text/csv")},
    )
    assert 400 <= r.status_code < 500, r.text


def test_attachment_json_array_round_trip(client: TestClient) -> None:
    data = json.dumps([{"name": "Mo", "email": "mo@qdaria.com"}]).encode()
    r = client.post(
        "/v1/anonymize-attachment?level=8",
        files={"file": ("data.json", data, "application/json")},
    )
    assert r.status_code == 200, r.text
    assert b"mo@qdaria.com" not in r.content


@pytest.mark.xfail(
    strict=True,
    reason="B3: anon_filename string-prefixes user-supplied filename without sanitisation; '../' leaks into Content-Disposition (CWE-22/179). Fix: os.path.basename() at src/routes/anonymize.py:225.",
)
def test_attachment_path_traversal_filename_safe(client: TestClient) -> None:
    """Filename `../../etc/passwd` must not influence response Content-Disposition.

    Currently produces `Content-Disposition: filename="anon_L5_../../etc/passwd"`.
    The route concatenates the raw filename without `os.path.basename()`.
    Browsers strip path components on save, but curl -OJ, downloader
    proxies, and shell scripts that pipe `Content-Disposition` to a path
    do not.
    """
    r = client.post(
        "/v1/anonymize-attachment?level=5",
        files={"file": ("../../etc/passwd", b"name\nalice\n", "text/csv")},
    )
    cd = r.headers.get("content-disposition", "")
    assert "../" not in cd
    assert "etc/passwd" not in cd


@pytest.mark.parametrize("level", [0, 11, "abc"])
def test_attachment_level_query_validation(client: TestClient, level) -> None:
    r = client.post(
        f"/v1/anonymize-attachment?level={level}",
        files={"file": ("a.csv", b"x\n1\n", "text/csv")},
    )
    assert r.status_code == 422


# ── Invariant tests (per-level class) ──────────────────────────────────────
#
# `_apply_text_anonymization` has THREE distinct invariant classes:
#   • L1-L5   deterministic: f(f(x)) == f(x)         (idempotence)
#   • L6-L8   hash-deterministic: f(x) == f(x) when called twice (stable)
#             but lossy: f(f(x)) != f(x) (rehashing the hash differs)
#   • L9-L10  non-deterministic (secrets.choice):
#             f(x) != f(x) generally; only length-preservation holds
#
# These three classes need different invariants. A single proptest can't
# span them; this is why parametrize splits by level-band below.

_DETERMINISTIC_FIXTURES = [
    "Mo Houshmand mo@qdaria.com 555-1234",
    "alice@example.io is here",
    "no PII whatsoever",
    "Hello World",
]


@pytest.mark.parametrize("level", [1, 2])
@pytest.mark.parametrize("text", _DETERMINISTIC_FIXTURES)
def test_l1_l2_idempotent(client: TestClient, level: int, text: str) -> None:
    """L1, L2 ARE idempotent (mask shapes don't re-match the regex).

    L1 SSN/email mask: `***-**-****` and `[EMAIL]` don't re-match the SSN
    or email regex, so f(f(x)) == f(x).
    L2 partial: `H...o` is 5 chars but contains `.` (non-word), so the
    `\\b\\w{5,}\\b` regex skips it. Idempotent by accident; flag if the
    L2 implementation ever drops the dot.
    """
    once = client.post("/api/anonymize", json={"level": level, "text": text}).json()
    twice = client.post(
        "/api/anonymize",
        json={"level": level, "text": once["anonymized_text"]},
    ).json()
    assert twice["anonymized_text"] == once["anonymized_text"]


@pytest.mark.xfail(
    strict=True,
    reason="B4: L3-L5 use marker `[REDACTED]` which contains word chars; \\b\\w+\\b re-matches `REDACTED` inside `[REDACTED]` on second pass, expanding to `[[REDACTED]]`. Fix options: (a) change marker to '***' (no word chars), (b) post-process to dedupe nested markers, (c) accept non-idempotence and document. USER DESIGN PICK required.",
)
@pytest.mark.parametrize("level", [3, 4, 5])
@pytest.mark.parametrize("text", ["Hello World", "alice@example.io is here"])
def test_l3_l5_idempotent_known_broken(
    client: TestClient, level: int, text: str
) -> None:
    """L3-L5: f(f(x)) != f(x) because `[REDACTED]` contains word chars.

    Currently `[REDACTED]` becomes `[[REDACTED]]` on second application
    (and `[[[REDACTED]]]` on third, etc.). Audit-log dedup, cache keys,
    and re-upload safety all assume idempotence — fix is one of:
      (a) marker = "***" or "???" (no word chars) — easy, breaks no callers
      (b) post-process: re.sub(r'\\[+REDACTED\\]+', '[REDACTED]', out)
      (c) keep current behavior, document non-idempotence loudly
    """
    once = client.post("/api/anonymize", json={"level": level, "text": text}).json()
    twice = client.post(
        "/api/anonymize",
        json={"level": level, "text": once["anonymized_text"]},
    ).json()
    assert twice["anonymized_text"] == once["anonymized_text"]


@pytest.mark.parametrize("level", [6, 7, 8])
def test_l6_l8_stable_within_call(client: TestClient, level: int) -> None:
    """L6-L8: same input → same output across two calls (hash determinism).

    Note: L6-L8 are NOT idempotent — f(f(x)) re-hashes the hash and
    yields a different string. Only stability holds.
    """
    text = "Mo Houshmand mo@qdaria.com 555-1234"
    a = client.post("/api/anonymize", json={"level": level, "text": text}).json()
    b = client.post("/api/anonymize", json={"level": level, "text": text}).json()
    assert a["anonymized_text"] == b["anonymized_text"]


@pytest.mark.parametrize("level", [9, 10])
def test_l9_l10_non_deterministic_but_length_class_preserved(
    client: TestClient, level: int
) -> None:
    """L9-L10 (OTP via secrets.choice): two calls produce DIFFERENT output;
    only the *word-length distribution* is preserved.

    The strongest invariant we can assert without crossing into specific
    plaintext semantics is: number of \\b\\w+\\b matches is preserved AND
    each token's length is preserved.

    USER DECISION: how strict should this be? Options:
        (a) STRICT  — exact word count + per-token length (current below)
        (b) LOOSE   — only word count, allow length drift (e.g. for L≥10
                      future-extension that adds salt prefixes)
        (c) STATISTICAL — accept ±1 token tolerance (handle edge case
                      where a regex match boundary shifts)

    Pick (a) | (b) | (c) — drives whether a future contributor changing
    the OTP token format breaks this test.
    """
    import re

    text = "Mo Houshmand mo@qdaria.com 555-1234"
    a = client.post("/api/anonymize", json={"level": level, "text": text}).json()
    b = client.post("/api/anonymize", json={"level": level, "text": text}).json()

    # Non-determinism: two calls must NOT match (probabilistic, but with
    # ~70 chars and 62-char alphabet, collision probability is ~62^-70).
    assert a["anonymized_text"] != b["anonymized_text"], (
        "L9-L10 are OTP-style; two calls colliding indicates RNG failure"
    )

    # Word-count preservation (option a — strict).
    orig_tokens = re.findall(r"\b\w+\b", text)
    out_tokens = re.findall(r"\b\w+\b", a["anonymized_text"])
    assert len(orig_tokens) == len(out_tokens)
    assert [len(t) for t in orig_tokens] == [len(t) for t in out_tokens]


def test_response_does_not_echo_unchanged_pii_at_l5(client: TestClient) -> None:
    """L5 must materially alter recognisable PII patterns.

    This is a regression sentinel: if `_apply_text_anonymization` ever
    becomes a passthrough (e.g. via a refactor that breaks the level
    dispatch), this catches it before the JSON route looks "fine" but
    leaks data.
    """
    text = "alice@example.com SSN 123-45-6789"
    r = client.post("/api/anonymize", json={"level": 5, "text": text}).json()
    assert "alice@example.com" not in r["anonymized_text"]
    assert "123-45-6789" not in r["anonymized_text"]
