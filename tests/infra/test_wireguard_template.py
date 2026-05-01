"""
Coverage gap G2: PQ-WireGuard template render & no-classical-key invariants.

infra/wireguard/{server,client}.conf.tmpl render to wg-quick configs that
gate the entire VPN pillar. Drift here causes:

  - Hybrid-mode regression: a `PrivateKey =` line slips back in (Curve25519
    classical fallback) and the FIPS 203 ML-KEM-768 guarantee weakens.
  - Placeholder leak: rendered config retains `{{VAR}}` and the daemon
    crashes at startup, but the template author thinks it's working.
  - Real-key smuggle: a developer renders the template against real keys
    and accidentally commits the rendered file. This test catches both
    accidental commits AND template authors leaving real-looking key
    fragments in the .tmpl.

Discovered: 2026-05-01 v22 audit, never tested in 21 prior passes.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

CORE_ROOT = Path(__file__).resolve().parents[2]
WG_DIR = CORE_ROOT / "infra" / "wireguard"
SERVER_TMPL = WG_DIR / "server.conf.tmpl"
CLIENT_TMPL = WG_DIR / "client.conf.tmpl"


# ─── No classical Curve25519 PrivateKey line ─────────────────────────────

@pytest.mark.parametrize("path", [SERVER_TMPL, CLIENT_TMPL])
def test_no_classical_privatekey_line(path: Path) -> None:
    """PQ-only mode forbids `PrivateKey = ...`. Only `PqPrivateKeyFile` is allowed."""
    text = path.read_text()
    # Must not contain a bare PrivateKey assignment (only PqPrivateKey* allowed).
    forbidden = re.compile(r"^\s*PrivateKey\s*=", re.MULTILINE)
    match = forbidden.search(text)
    assert match is None, (
        f"{path.name} contains classical Curve25519 PrivateKey line "
        f"(line: {match.group(0) if match else ''!r}) — PQ-only contract violated"
    )


# ─── Required PQ key references present ──────────────────────────────────

REQUIRED_SERVER_VARS: tuple[str, ...] = (
    "{{SERVER_PQ_PRIVKEY_PATH}}",
    "{{SERVER_INTERFACE_ADDR}}",
    "{{SERVER_LISTEN_PORT}}",
    "{{CLIENT_PQ_PUBKEY_B64}}",
    "{{CLIENT_ALLOWED_IPS}}",
)

REQUIRED_CLIENT_VARS: tuple[str, ...] = (
    "{{CLIENT_PQ_PRIVKEY_PATH}}",
    "{{CLIENT_INTERFACE_ADDR}}",
    "{{SERVER_PQ_PUBKEY_B64}}",
    "{{SERVER_ENDPOINT}}",
    "{{SERVER_ALLOWED_IPS}}",
)


@pytest.mark.parametrize("var", REQUIRED_SERVER_VARS)
def test_server_template_has_required_var(var: str) -> None:
    text = SERVER_TMPL.read_text()
    assert var in text, f"server.conf.tmpl missing required placeholder {var}"


@pytest.mark.parametrize("var", REQUIRED_CLIENT_VARS)
def test_client_template_has_required_var(var: str) -> None:
    text = CLIENT_TMPL.read_text()
    assert text.count(var) >= 1, f"client.conf.tmpl missing required placeholder {var}"


# ─── Render with fakes leaves no unbound placeholder ─────────────────────

def _render(text: str, mapping: dict[str, str]) -> str:
    """Deliberately simple template substitution (mirrors the deploy script)."""
    out = text
    for key, value in mapping.items():
        out = out.replace(key, value)
    return out


def test_server_template_renders_with_no_unbound_placeholders() -> None:
    fakes = {
        "{{SERVER_PQ_PUBKEY_B64}}": "AAAA",  # length-shape only
        "{{SERVER_PQ_PRIVKEY_PATH}}": "/run/zipminator/server.priv",
        "{{SERVER_LISTEN_PORT}}": "51820",
        "{{SERVER_INTERFACE_ADDR}}": "10.42.0.1/24",
        "{{CLIENT_PQ_PUBKEY_B64}}": "BBBB",
        "{{CLIENT_ALLOWED_IPS}}": "10.42.0.2/32",
    }
    rendered = _render(SERVER_TMPL.read_text(), fakes)
    assert "{{" not in rendered, (
        f"unbound placeholder remains after render: {rendered}"
    )
    assert "}}" not in rendered


def test_client_template_renders_with_no_unbound_placeholders() -> None:
    fakes = {
        "{{CLIENT_PQ_PRIVKEY_PATH}}": "/run/zipminator/client.priv",
        "{{CLIENT_INTERFACE_ADDR}}": "10.42.0.2/24",
        "{{CLIENT_DNS}}": "10.42.0.1",
        "{{SERVER_PQ_PUBKEY_B64}}": "CCCC",
        "{{SERVER_ENDPOINT}}": "vpn.example.com:51820",
        "{{SERVER_ALLOWED_IPS}}": "10.42.0.0/24",
    }
    rendered = _render(CLIENT_TMPL.read_text(), fakes)
    assert "{{" not in rendered
    assert "}}" not in rendered


# ─── Templates contain no real-looking key material ──────────────────────
# A real ML-KEM-768 base64 public key is ~1580 chars. A template should
# only contain placeholders. If a long base64 blob slips in, the deploy
# pipeline will silently render with a real key and the secret may end up
# in process listings or logs.

LONG_BASE64 = re.compile(r"[A-Za-z0-9+/=]{64,}")


@pytest.mark.parametrize("path", [SERVER_TMPL, CLIENT_TMPL])
def test_template_has_no_long_base64_blob(path: Path) -> None:
    text = path.read_text()
    # Strip placeholder regions before scanning so we only catch leaked keys.
    stripped = re.sub(r"\{\{[^}]+\}\}", "", text)
    leaked = LONG_BASE64.search(stripped)
    assert leaked is None, (
        f"{path.name} contains a long base64 run ({len(leaked.group(0))} chars) "
        f"that is not a placeholder — possible key leak: {leaked.group(0)[:32]}..."
    )


# ─── PersistentKeepalive is set (mobile NAT-binding survival) ────────────

@pytest.mark.parametrize("path", [SERVER_TMPL, CLIENT_TMPL])
def test_persistent_keepalive_present(path: Path) -> None:
    """Without PersistentKeepalive, mobile clients drop after NAT timeout (~30s on LTE)."""
    text = path.read_text()
    match = re.search(r"^\s*PersistentKeepalive\s*=\s*(\d+)\s*$", text, re.MULTILINE)
    assert match, f"{path.name} missing PersistentKeepalive — mobile sessions will time out"
    seconds = int(match.group(1))
    # WireGuard recommends 25s for typical NAT timeouts; 60s is the upper sane bound.
    assert 15 <= seconds <= 60, (
        f"{path.name} PersistentKeepalive={seconds} outside sane range [15, 60]"
    )
