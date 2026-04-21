# Zipminator v1.0.0: Nine Pillars of Post-Quantum Cryptography, Shipping Today

**Date:** 2026-04-19
**Author:** Mo Houshmand, Founder & Chief Technology Officer, QDaria AS
**Codename:** Q-Day Ready
**Reading time:** 6 minutes

---

## Why v1.0.0 matters

Zipminator is the first release of QDaria's post-quantum super-app, assembled from nine encryption-infrastructure pillars on a single codebase. This is the release where every data path, on every supported platform, uses a NIST-standardized post-quantum primitive by default. No classical-only fallback on the user data path.

The timing is deliberate. NIST finalized ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) in August 2024. NIST's transition timeline deprecates RSA and ECC after 2030 and disallows them after 2035. Adversaries who harvest encrypted data today can decrypt it the moment a cryptographically relevant quantum computer arrives. "Harvest now, decrypt later" is not a future threat; it is the current threat, and the only defense is to stop shipping classical-only crypto now.

DORA (Digital Operational Resilience Act) has been Norwegian law since 2025-07-01. Article 6.4 requires periodic cryptographic updates based on cryptanalysis developments. Article 50 fines non-compliance at up to 2% of global turnover. Zipminator's per-operation audit trail, hybrid classical+PQC migration mode, and hardware-backed key lifecycle are built to make that audit trivial.

## The nine pillars

1. **Quantum Vault + Self-Destruct Storage.** Per-file ML-KEM-768 envelopes. DoD 5220.22-M three-pass shredding for self-destruct. Free on local disk; metered for cloud-backed recovery.
2. **PQC Messenger.** End-to-end ML-KEM-768 session keys, ML-DSA-65 authentication, forward secrecy via rotating ephemeral keys. WebSocket signaling for fan-out.
3. **Quantum VoIP + Video.** WebRTC audio and video with PQC-protected signaling and SRTP key exchange. No TURN/STUN server shipped in v1; operators bring their own or use public infrastructure.
4. **Q-VPN (PQ-WireGuard).** Userspace PQ-WireGuard tunnel with ML-KEM-768 hybrid handshake. macOS kernel-module path is deferred to v1.1.
5. **10-Level Anonymization Suite.** L1 through L10 covering hashing, tokenization, differential privacy, k-anonymity, format-preserving encryption, and homomorphic paths. L1 through L3 are free; L4 and above gate on `ZIPMINATOR_API_KEY`.
6. **Q-AI PQC AI Assistant.** On-device inference plus encrypted remote completion. Prompts and responses wrapped in ML-KEM envelopes. Local model auto-download is a v1.1 item.
7. **Quantum-Secure Email.** S/MIME replacement using ML-DSA signatures and ML-KEM envelope encryption. Postfix + Dovecot + docker-compose reference deployment in the repo. Legacy IMAP/SMTP bridge for migration.
8. **ZipBrowser (PQC AI Browser).** Tauri 2.x desktop shell with PQC tunnel and content-level verification. System WebView in v1; custom engine is out of scope for this release and has an ADR documenting the decision.
9. **Q-Mesh (Quantum-Secured WiFi Sensing).** Channel-State-Information entropy harvester. Physical Unclonable Environment Key. Electromagnetic canary. Vital-auth, topo-auth, and spatiotemporal presence proofs.

## What's inside the crates

The Rust workspace now ships 550 tests across nine crates. The core (`zipminator-core`) is exposed to Python via PyO3 and to the Flutter app via an FFI bridge, so every binding tests against the same crypto primitives.

Key numbers:

- `cargo test --workspace`: 550 tests passing (393 in the main workspace, 157 in `zipbrowser`)
- `cd app && flutter test`: 23 widget tests covering 5 core + 8 pillar + 5 extended + 5 cross-pillar scenarios
- `cd web && pnpm test`: 30 vitest cases on the Next.js 16 dashboard
- `cd browser/src-tauri && cargo test`: 179 tests on the Tauri browser crypto path

## What's NOT in v1.0.0

Shipping discipline means saying "not yet" out loud:

- **FIPS 140-3 validation.** This release implements NIST FIPS 203 (ML-KEM-768). It does not hold a CMVP certificate. A CMVP run costs roughly USD 80,000 to 150,000 and takes 12 to 18 months; we will start that process when the first enterprise contract funds it.
- **Kernel-mode PQ-WireGuard.** Userspace ships; macOS kernel extension is deferred to v1.1.
- **ESP32-S3 physical demo for Q-Mesh.** Hardware integration is human-gated and tracked in the repo issue queue.
- **Production SMTP/IMAP hosting.** The containers are in the repo; operator-hosted deployment is the v1 path. SaaS hosting is a v1.2 target.

## Install

### Python SDK

```bash
pip install "zipminator[all]"
```

If you are contributing from source, activate the project environment first:

```bash
micromamba activate zip-pqc
uv pip install maturin
maturin develop
```

### Rust crate

```bash
cargo add zipminator-core
```

### Flutter app

Download the iOS TestFlight build, Android APK, or desktop DMG/AppImage/MSI from the GitHub Release page.

## What ships next

v1.1 targets the gaps called out above: macOS kernel PQ-WireGuard, local model auto-download for Q-AI, ESP32-S3 integration for Q-Mesh, and the first enterprise CMVP run for a FIPS 140-3 certificate. v1.2 targets SaaS hosting for the Quantum-Secure Email pillar.

## Acknowledgements

QDaria AS is based in Bergen, Norway. The Zipminator codebase is Apache-2.0. Patents are filed on the 10-Level Anonymization architecture, the Q-Mesh PUEK construction, and the PQC AI Browser tunnel design; full details are in `docs/ip/`.

References for the crypto primitives:

- NIST FIPS 203 (ML-KEM): Module-Lattice-Based Key-Encapsulation Mechanism Standard
- NIST FIPS 204 (ML-DSA): Module-Lattice-Based Digital Signature Standard
- NIST FIPS 205 (SLH-DSA): Stateless Hash-Based Digital Signature Standard
- NIST PQC transition timeline: SP 800-131A Rev. 3

Q-Day isn't soon. It's already here for data that was harvested yesterday. Ship post-quantum today.
