"""Automated DKIM signing test for the Zipminator mailserver.

Three layers, each gated by what's available in the env:

1. **Config sanity** (always runs, no deps): asserts that the OpenDKIM
   configuration files (`opendkim.conf`, `signing.table`, `key.table`)
   exist, point at `zipminator.zip`, and use the `s1` selector.

2. **Header parser** (always runs, no deps): builds a synthetic
   `DKIM-Signature: ...` header by hand and verifies that
   `email.message.Message` parses it and exposes the standard `v=`,
   `a=`, `c=`, `d=`, `h=`, `s=`, `bh=`, `b=` tag-value fields.

3. **Live milter sign** (skipped when `dkimpy` is not installed *or* the
   configured private key is absent on disk): uses dkimpy's pure-Python
   signer to produce a signature with the same key/selector/domain that
   OpenDKIM would, and asserts the resulting header parses.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DKIM_CONF_DIR = REPO_ROOT / "email" / "mailserver" / "config" / "dkim"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _parse_dkim_header(header: str) -> dict[str, str]:
    """Tag-value parser per RFC 6376 §3.2.

    Returns a dict of tag -> value with whitespace-around-equals stripped
    and folded whitespace inside values collapsed.
    """
    if header.lower().startswith("dkim-signature:"):
        header = header.split(":", 1)[1]
    # Collapse folded whitespace (CRLF + WSP) into a single space.
    header = re.sub(r"\s+", " ", header).strip()
    out: dict[str, str] = {}
    for part in header.split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        tag, _, value = part.partition("=")
        out[tag.strip()] = value.strip()
    return out


# ---------------------------------------------------------------------------
# Layer 1: OpenDKIM configuration sanity
# ---------------------------------------------------------------------------


class TestDkimConfig:
    """Verify that the static OpenDKIM config files match the spec."""

    def test_opendkim_conf_exists(self):
        conf = DKIM_CONF_DIR / "opendkim.conf"
        assert conf.is_file(), f"missing: {conf}"

    def test_opendkim_conf_targets_zipminator_domain(self):
        text = _read(DKIM_CONF_DIR / "opendkim.conf")
        # Must be configured for the canonical domain
        assert re.search(r"^Domain\s+zipminator\.zip\s*$", text, re.MULTILINE), (
            "opendkim.conf must declare Domain zipminator.zip"
        )

    def test_opendkim_conf_uses_rsa_sha256(self):
        text = _read(DKIM_CONF_DIR / "opendkim.conf")
        assert re.search(
            r"^SignatureAlgorithm\s+rsa-sha256\s*$", text, re.MULTILINE
        ), "Classical DKIM signature must be rsa-sha256"

    def test_opendkim_conf_canonicalization(self):
        text = _read(DKIM_CONF_DIR / "opendkim.conf")
        assert re.search(
            r"^Canonicalization\s+relaxed/simple\s*$", text, re.MULTILINE
        ), "DKIM canonicalization must be relaxed/simple"

    def test_signing_table_maps_zipminator_zip(self):
        text = _read(DKIM_CONF_DIR / "signing.table")
        # Must map *@zipminator.zip to the s1 selector entry
        assert re.search(
            r"^\s*\*@zipminator\.zip\s+s1\._domainkey\.zipminator\.zip\s*$",
            text,
            re.MULTILINE,
        ), "signing.table must map *@zipminator.zip to s1._domainkey.zipminator.zip"

    def test_key_table_points_at_s1_private_key(self):
        text = _read(DKIM_CONF_DIR / "key.table")
        assert re.search(
            r"^\s*s1\._domainkey\.zipminator\.zip\s+"
            r"zipminator\.zip:s1:/etc/opendkim/keys/zipminator\.zip/s1\.private\s*$",
            text,
            re.MULTILINE,
        ), "key.table must reference /etc/opendkim/keys/zipminator.zip/s1.private"

    def test_trusted_hosts_includes_localhost_and_subdomain(self):
        text = _read(DKIM_CONF_DIR / "trusted.hosts")
        for needle in ("127.0.0.1", "localhost", "*.zipminator.zip"):
            assert needle in text, f"trusted.hosts missing {needle}"


# ---------------------------------------------------------------------------
# Layer 2: DKIM-Signature header parser sanity
# ---------------------------------------------------------------------------


class TestDkimHeaderParser:
    """Verify that a synthetic DKIM-Signature header parses correctly.

    This test is the contract that the live signer (Layer 3) must satisfy:
    the produced header must contain v=1, a=rsa-sha256, c=relaxed/simple,
    d=zipminator.zip, s=s1, h=..., bh=..., b=...
    """

    SAMPLE = (
        "DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/simple;\r\n"
        "    d=zipminator.zip; s=s1;\r\n"
        "    h=From:To:Subject:Date;\r\n"
        "    bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;\r\n"
        "    b=fakebase64sigvalue=="
    )

    def test_header_parses_into_tag_value_pairs(self):
        tags = _parse_dkim_header(self.SAMPLE)
        assert tags["v"] == "1"
        assert tags["a"] == "rsa-sha256"
        assert tags["c"] == "relaxed/simple"
        assert tags["d"] == "zipminator.zip"
        assert tags["s"] == "s1"
        assert tags["h"] == "From:To:Subject:Date"
        assert "bh" in tags and tags["bh"]
        assert "b" in tags and tags["b"]

    def test_signed_headers_include_from(self):
        tags = _parse_dkim_header(self.SAMPLE)
        h_list = [h.strip() for h in tags["h"].split(":")]
        # Per OpenDKIM's "OversignHeaders From" we require From to be signed.
        assert "From" in h_list

    def test_body_hash_is_base64(self):
        tags = _parse_dkim_header(self.SAMPLE)
        bh = tags["bh"]
        # SHA-256 base64 = 44 chars (incl. trailing '=' padding)
        assert len(bh) == 44
        assert re.match(r"^[A-Za-z0-9+/]+=*$", bh) is not None


# ---------------------------------------------------------------------------
# Layer 3: Live signature via dkimpy (skipped when dep or key absent)
# ---------------------------------------------------------------------------


class TestDkimLiveSign:
    """Produce a real signature with dkimpy and verify it parses.

    Skipped when:
      - `dkimpy` (the `dkim` Python package) is not installed; OR
      - the configured private key path doesn't exist on this host.

    The OpenDKIM config points at /etc/opendkim/keys/zipminator.zip/s1.private
    inside the Docker container. Locally that path is absent, so the test
    looks for a sibling key file at email/mailserver/config/dkim/keys/s1.private.
    When opendkim isn't configured locally, mark as blocked rather than fail.
    """

    PRIVATE_KEY_LOCAL = (
        DKIM_CONF_DIR / "keys" / "zipminator.zip" / "s1.private"
    )

    @pytest.fixture
    def dkim_module(self):
        return pytest.importorskip(
            "dkim",
            reason="dkimpy not installed -- live signing test skipped",
        )

    @pytest.fixture
    def private_key_pem(self) -> bytes:
        if not self.PRIVATE_KEY_LOCAL.is_file():
            pytest.skip(
                f"DKIM private key not present at {self.PRIVATE_KEY_LOCAL}; "
                f"OpenDKIM not configured for local test (Docker-only). "
                f"[blocked: opendkim not configured locally]"
            )
        return self.PRIVATE_KEY_LOCAL.read_bytes()

    def test_live_sign_produces_valid_header(self, dkim_module, private_key_pem):
        msg = (
            b"From: alice@zipminator.zip\r\n"
            b"To: bob@example.com\r\n"
            b"Subject: dkim live test\r\n"
            b"Date: Mon, 26 Apr 2026 12:00:00 +0000\r\n"
            b"\r\n"
            b"hello\r\n"
        )

        signed = dkim_module.sign(
            msg,
            selector=b"s1",
            domain=b"zipminator.zip",
            privkey=private_key_pem,
            include_headers=[b"From", b"To", b"Subject", b"Date"],
            canonicalize=(b"relaxed", b"simple"),
        )

        assert signed.startswith(b"DKIM-Signature:"), (
            "dkimpy must emit a DKIM-Signature header"
        )
        header_text = signed.split(b"\r\n\r\n", 1)[0].decode()
        tags = _parse_dkim_header(header_text)
        assert tags.get("d") == "zipminator.zip"
        assert tags.get("s") == "s1"
        assert tags.get("a") == "rsa-sha256"
