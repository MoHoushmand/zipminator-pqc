//! Mechanical checks that the wg-quick-style templates in
//! `infra/wireguard/` declare every placeholder the bring-up docs expect.
//!
//! Keeping this in Rust (not shell) means the marathon test gate
//! (`cargo test -p pq-wireguard`) catches template drift in the same run as
//! the handshake tests. If an operator or a templating refactor strips a
//! placeholder, the build turns red loudly.

use std::fs;
use std::path::PathBuf;

fn repo_relative(p: &str) -> PathBuf {
    // Cargo runs integration tests with CARGO_MANIFEST_DIR pointed at the
    // crate root; walk up two components to reach the vpn/ worktree root.
    let mut root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    root.pop(); // crates/
    root.pop(); // crate root
    root.join(p)
}

#[test]
fn server_template_declares_every_required_placeholder() {
    let path = repo_relative("infra/wireguard/server.conf.tmpl");
    let body = fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("missing template at {}: {e}", path.display()));
    for key in [
        "{{SERVER_PQ_PUBKEY_B64}}",
        "{{SERVER_PQ_PRIVKEY_PATH}}",
        "{{SERVER_LISTEN_PORT}}",
        "{{SERVER_INTERFACE_ADDR}}",
        "{{CLIENT_PQ_PUBKEY_B64}}",
        "{{CLIENT_ALLOWED_IPS}}",
    ] {
        assert!(
            body.contains(key),
            "server.conf.tmpl missing placeholder {key}"
        );
    }
    // PQ-WireGuard extensions the userspace binary parses: these named keys
    // are the contract, operators rendering through Ansible or sed rely on
    // their exact spelling.
    for key in ["PqPrivateKeyFile", "PqPublicKey"] {
        assert!(
            body.contains(key),
            "server.conf.tmpl missing extension key {key}"
        );
    }
}

#[test]
fn client_template_declares_every_required_placeholder() {
    let path = repo_relative("infra/wireguard/client.conf.tmpl");
    let body = fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("missing template at {}: {e}", path.display()));
    for key in [
        "{{CLIENT_PQ_PRIVKEY_PATH}}",
        "{{CLIENT_INTERFACE_ADDR}}",
        "{{CLIENT_DNS}}",
        "{{SERVER_PQ_PUBKEY_B64}}",
        "{{SERVER_ENDPOINT}}",
        "{{SERVER_ALLOWED_IPS}}",
    ] {
        assert!(
            body.contains(key),
            "client.conf.tmpl missing placeholder {key}"
        );
    }
    for key in ["PqPrivateKeyFile", "PqPublicKey"] {
        assert!(
            body.contains(key),
            "client.conf.tmpl missing extension key {key}"
        );
    }
}

#[test]
fn templates_do_not_leak_real_keys() {
    // Sanity gate: a base64 block long enough to plausibly be an ML-KEM-768
    // public key (1184 bytes -> 1580 base64 chars) committed to the template
    // would be a red flag. Checks both templates.
    for p in [
        "infra/wireguard/server.conf.tmpl",
        "infra/wireguard/client.conf.tmpl",
    ] {
        let body = fs::read_to_string(repo_relative(p)).unwrap();
        // Longest run of base64 alphabet characters on any single line.
        let longest = body
            .lines()
            .map(|line| {
                line.chars()
                    .filter(|c| c.is_ascii_alphanumeric() || *c == '+' || *c == '/' || *c == '=')
                    .count()
            })
            .max()
            .unwrap_or(0);
        assert!(
            longest < 256,
            "{p}: a suspiciously long base64-looking run ({longest} chars) was \
             committed; templates must only contain placeholders, not real keys"
        );
    }
}

#[test]
fn readme_documents_handshake_contract() {
    let body = fs::read_to_string(repo_relative("infra/wireguard/README.md")).unwrap();
    // Each of these phrases is load-bearing for auditor spot-checks.
    for token in [
        "ML-KEM-768",
        "FIPS 203",
        "HKDF-SHA-256",
        "ConstantTimeEq",
        "PQ-WireGuard v1 FIPS203 ML-KEM-768",
        "tests/vpn/fixtures/initiation.hex",
    ] {
        assert!(
            body.contains(token),
            "infra/wireguard/README.md must document `{token}`"
        );
    }
}
