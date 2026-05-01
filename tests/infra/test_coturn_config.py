"""
Coverage gap G1: TURN/STUN server hardening invariants.

The coturn config at infra/coturn/turnserver.conf relays SRTP-encrypted
PQ-VoIP traffic. Any drift in hardening flags turns the relay into an open
amplifier (RFC 5780 NAT discovery), an abuse vector (loopback peers), or a
TLS downgrade target (tlsv1/tlsv1_1 enabled). The application layer cannot
catch these — only the server config does.

Discovered: 2026-05-01 v22 audit, never tested in 21 prior passes.

Risks if drift goes unnoticed:
  - Open TURN relay → traffic amplification, IP-laundering, DoS-by-proxy
  - Loopback / RFC-1918 reachable → SSRF-via-TURN to internal services
  - TLSv1/TLSv1.1 enabled → downgrade attack on TURNS
  - static-auth-secret committed → trivial relay takeover

Tests parse the config as text (no live coturn process needed).
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

CORE_ROOT = Path(__file__).resolve().parents[2]
COTURN_CONF = CORE_ROOT / "infra" / "coturn" / "turnserver.conf"


@pytest.fixture(scope="module")
def conf_text() -> str:
    assert COTURN_CONF.is_file(), f"missing {COTURN_CONF}"
    return COTURN_CONF.read_text()


# ─── Mandatory hardening flags ───────────────────────────────────────────
# These flags must be present-and-uncommented for any production deploy.
# A regression that silently removes one is the failure mode this suite
# catches.

MANDATORY_FLAGS: tuple[str, ...] = (
    "fingerprint",                 # RFC 5389 §6 — required for STUN-with-TURN multiplexing
    "lt-cred-mech",                # long-term credential auth
    "use-auth-secret",             # REST API short-lived creds (turn-rest)
    "no-multicast-peers",          # block 224.0.0.0/4 relay
    "no-cli",                      # disable telnet admin
    "no-tlsv1",                    # CVE-2014-3566 (POODLE)
    "no-tlsv1_1",                  # CVE-2011-3389 (BEAST)
    "no-rfc5780",                  # disable NAT-behavior discovery (amplification)
    "no-stun-backward-compatibility",
    "no-loopback-peers",           # block 127.0.0.0/8 relay (SSRF)
    "mobility",                    # RFC 8016 — required for mobile hand-off
)


@pytest.mark.parametrize("flag", MANDATORY_FLAGS)
def test_mandatory_flag_present_and_uncommented(conf_text: str, flag: str) -> None:
    """Each mandatory flag must appear on its own line, not commented out."""
    pattern = re.compile(rf"^\s*{re.escape(flag)}\s*$", re.MULTILINE)
    assert pattern.search(conf_text), (
        f"mandatory hardening flag '{flag}' missing or commented in turnserver.conf"
    )


# ─── Denied peer-IP ranges (RFC1918 + loopback) ──────────────────────────
# RFC 1918 ranges + loopback + 0.0.0.0/8 must all be in `denied-peer-ip` to
# prevent SSRF-via-TURN. Production may add more; these are the floor.

REQUIRED_DENIED_RANGES: tuple[str, ...] = (
    "10.0.0.0-10.255.255.255",
    "172.16.0.0-172.31.255.255",
    "192.168.0.0-192.168.255.255",
    "127.0.0.0-127.255.255.255",
    "0.0.0.0-0.255.255.255",
)


@pytest.mark.parametrize("rng", REQUIRED_DENIED_RANGES)
def test_required_denied_peer_ip_range_present(conf_text: str, rng: str) -> None:
    pattern = re.compile(
        rf"^\s*denied-peer-ip\s*=\s*{re.escape(rng)}\s*$",
        re.MULTILINE,
    )
    assert pattern.search(conf_text), (
        f"required denied-peer-ip range '{rng}' missing"
    )


# ─── Static auth secret must remain a placeholder ────────────────────────
# A real secret committed here is an instant relay-takeover. The build
# pipeline substitutes a real value at deploy time; the on-disk file must
# stay templated.

PLACEHOLDER_SENTINEL = "__REPLACE_AT_DEPLOY__"


def test_static_auth_secret_is_placeholder(conf_text: str) -> None:
    """The committed conf must use the placeholder, not a real secret."""
    match = re.search(
        r"^\s*static-auth-secret\s*=\s*(\S+)\s*$",
        conf_text,
        re.MULTILINE,
    )
    assert match, "static-auth-secret line missing"

    secret = match.group(1)
    assert secret == PLACEHOLDER_SENTINEL, (
        f"static-auth-secret must equal placeholder '{PLACEHOLDER_SENTINEL}', "
        f"got '{secret}' — possible secret leak in git history"
    )


# ─── Quotas sane (bound abuse) ───────────────────────────────────────────

def test_user_quota_below_total_quota(conf_text: str) -> None:
    """user-quota must be < total-quota or per-user budget exceeds global."""
    user_match = re.search(r"^\s*user-quota\s*=\s*(\d+)\s*$", conf_text, re.MULTILINE)
    total_match = re.search(r"^\s*total-quota\s*=\s*(\d+)\s*$", conf_text, re.MULTILINE)
    assert user_match and total_match, "quota lines missing"
    assert int(user_match.group(1)) < int(total_match.group(1)), (
        "user-quota must be strictly less than total-quota"
    )


# ─── Port range narrow enough for tractable firewall rules ───────────────

def test_relay_port_range_narrow(conf_text: str) -> None:
    """min-port..max-port window must be < 5000 ports for sane firewalling."""
    min_match = re.search(r"^\s*min-port\s*=\s*(\d+)\s*$", conf_text, re.MULTILINE)
    max_match = re.search(r"^\s*max-port\s*=\s*(\d+)\s*$", conf_text, re.MULTILINE)
    assert min_match and max_match, "min-port/max-port missing"
    width = int(max_match.group(1)) - int(min_match.group(1))
    assert 0 < width < 5000, (
        f"port window {width} is implausible — sane range is 256..4096 wide"
    )


# ─── TODO (user A/B): tier the policy ────────────────────────────────────
# The MANDATORY_FLAGS list above is a hard floor. There is a softer tier of
# RECOMMENDED flags (e.g., `proc-user`, `proc-group`, `pidfile`, explicit
# `cipher-list`) that should be present in production but may be absent in
# dev. Before this skeleton ships, pick one of:
#
#   Shape A — STRICT: promote all RECOMMENDED to MANDATORY. Catches more
#             drift but breaks the dev container until config is upgraded.
#   Shape B — TIERED: keep MANDATORY as floor; add RECOMMENDED as @pytest.mark.warning
#             (xfail w/ strict=False). Documents intent, never breaks CI.
#   Shape C — ENV-GATED: skip RECOMMENDED checks unless ZIPMINATOR_PROD_TURN=1.
#             Matches existing skip-glob patterns in the repo.
#
# Mo: pick Shape A/B/C and I'll wire RECOMMENDED_FLAGS accordingly.
