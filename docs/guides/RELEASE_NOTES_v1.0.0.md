# Zipminator v1.0.0-rc1 Release Notes

**Release candidate date**: 2026-04-21
**Stable tag**: `v1.0.0-rc1` (final `v1.0.0` tag reserved for post-RC sign-off)
**Canonical status**: `docs/guides/FEATURES.md`

Zipminator v1.0.0-rc1 is the release candidate for the first stable version of the PQC super-app. All 9 pillars are code-verified against the percentages published in `FEATURES.md`, the Rust workspace is green across 550 tests, and the Flutter super-app runs on iOS, Android, macOS, Linux, and Windows from a single codebase. This document mirrors the CHANGELOG in prose form for readers who want narrative context rather than bullet lists.

## What v1.0.0-rc1 Means

`v1.0.0-rc1` is a release candidate, not the final 1.0 tag. We cut this RC to freeze the API surface, lock the crypto algorithms, and expose the build to a broader internal and early-adopter audience while the last two kernel-mode items land. When the two blockers listed under Known Deferrals clear, we promote the same commit to `v1.0.0` without code changes, only a re-tag and a signed release artifact.

## The 9 Pillars at v1.0.0-rc1

Pillar 1, Quantum Vault and Self-Destruct Storage, is at 100 percent. Files encrypt with AES-256-GCM using keys derived from ML-KEM-768, seeds are drawn from the live IBM Quantum entropy pool, and the Tauri UI wires the DoD 5220.22-M 3-pass self-destruct command with a two-step confirmation and a system-path safety guard.

Pillar 2, PQC Messenger, is at 85 percent. The post-quantum Double Ratchet is implemented in Rust with ML-KEM-768 for ratchet key exchange, AES-256-GCM for payloads, HKDF-SHA-256 chain keys, and an offline message queue with group fanout. The remaining 15 percent is end-to-end integration testing against a running API; the protocol itself is complete.

Pillar 3, Quantum VoIP and Video, is at 90 percent. PQ-SRTP frame encryption runs at full AES-256-GCM over SRTP keys derived from ML-KEM-768 shared secrets; the call state machine, signaling WebSocket, and encrypted voicemail storage are all wired. The remaining gap is replacing WebRTC's own DTLS-SRTP key exchange at the browser level and deploying a TURN/STUN server.

Pillar 4, Q-VPN (PQ-WireGuard), is at 90 percent in userspace. The ML-KEM-768 handshake replaces the Curve25519 handshake end to end, the VPN state machine and kill switch are tested, and metrics flow to the Tauri dashboard. The macOS kernel module for packet wrapping is a deferred item (see Known Deferrals); the Linux reference host works with `wg-quick` in userspace.

Pillar 5, the 10-Level Anonymization Suite, is at 95 percent. Levels 1 through 10 ship as selectable tiers through `LevelAnonymizer.apply(df, level=N)`, covering regex masking, SHA-3 hashing, PQC-salted hashing, reversible tokenization, k-Anonymity, l-Diversity, quantum noise jitter, differential privacy, combined k-Anonymity + DP, and quantum OTP anonymization from the live entropy pool. The open 5 percent is wiring the Flutter UI level selector; the CLI and API paths are complete.

Pillar 6, Q-AI PQC AI Assistant, is at 85 percent. OllamaClient runs local-first models (llama3.2, mistral, phi-3), PromptGuard blocks 18 injection patterns across six categories, PII scanning runs on every prompt before LLM dispatch, and the PQC tunnel wraps prompts with AES-256-GCM under a per-session ephemeral ML-KEM-768 keypair. Local model auto-download and Ollama-to-Tauri-sidebar integration close out the remaining 15 percent.

Pillar 7, Quantum-Secure Email, is at 75 percent. The envelope crypto, SMTP transport, server-side self-destruct via `X-Zipminator-TTL`, and GreenMail-based test harness all work, and 15 transport tests pass. The remaining work is production SMTP/IMAP hosting and wiring attachment anonymization into the compose flow.

Pillar 8, ZipBrowser (PQC AI Browser), is at 85 percent. The Tauri 2.x shell, VPN state machine, PQC proxy, fingerprint spoofing, per-tab cookie isolation, telemetry blocker, password vault with Argon2, and AI sidebar all ship. 157 Rust tests cover the browser crate. The system WebView limitation (as opposed to a custom engine) is documented in an ADR and is out of scope for v1.

Pillar 9, Q-Mesh (Quantum-Secured WiFi Sensing), is at 90 percent. Wave 1 of the physical-cryptography modules is complete: CSI entropy harvesting, PUEK location-as-key, EM canary session control, vital-sign continuous auth, topological mesh auth, and spatiotemporal non-repudiation. 118 tests cover the mesh crate; the cross-repo integration script to RuView and ESP32-S3 hardware demos remain gated by hardware and human review.

## Crypto Posture and FIPS Language

Zipminator v1.0.0-rc1 implements NIST FIPS 203 (ML-KEM-768) for key encapsulation and NIST FIPS 204 (ML-DSA-65) for digital signatures. The implementation is verified against NIST KAT test vectors via a deterministic DRBG, run on every `cargo test -p nist-kat` invocation and on every CI pass. All secret-dependent arithmetic uses the `subtle` crate for constant-time operations, and all secret material is zeroized on drop via `zeroize`.

Zipminator is not a FIPS 140-3 validated module. FIPS 140-3 validation requires a CMVP certificate through an accredited NVLAP laboratory; that engagement is tracked in `grants/README.md` and is not in scope for the v1.0.0 cut. Public materials say "Implements NIST FIPS 203 (ML-KEM-768)" and "Verified against NIST KAT test vectors"; they never say "FIPS 140-3 certified", "FIPS 140-3 validated", or "FIPS compliant" without an active CMVP certificate.

## DORA Alignment (Norwegian law since 1 July 2025)

Zipminator's documentation covers the three DORA articles most relevant to cryptographic products. Art. 6.1 requires documented encryption policies for data at rest, in transit, and in use; our architecture guide maps every data path to its algorithm and key source. Art. 6.4 requires periodic cryptographic updates based on cryptanalysis developments, and our 90-day mesh key rotation, per-session ephemeral ML-KEM keypairs for Q-AI, and auditable QRNG pool refresh schedule satisfy the "must be auditable" requirement. Art. 7 requires full cryptographic key lifecycle management, and our audit subsystem logs key generation, rotation, escrow, and destruction events with provenance back to the QRNG entropy source.

## Test Coverage Snapshot

550 Rust tests (393 in the main workspace excluding the browser crate, 157 in the browser crate), 23 Flutter widget tests, 30 web vitest cases, and 800 Python tests including integration. Grand total is 1,403 tests across canonical surfaces. The legacy Expo mobile starter still carries 267 of 274 passing tests and is kept for reference only; it is not part of the canonical count.

## Known Deferrals

Two items are deferred from v1.0.0-rc1 to the v1.0.0 final cut. First, the macOS kernel module for PQ-WireGuard; userspace packet wrapping covers our Tier 1 threat model but a kernel-mode path gives better performance and matches the Linux reference. Second, the local Flutter SDK pinning; CI currently uses `subosito/flutter-action` which bypasses the question, but we want an explicit pin in `flutter.yaml` before the final tag. Neither blocks the RC.

Additional items tracked as human-gated and out of scope for any v1.0.x release: FIPS 140-3 CMVP validation, SOC 2 Type II audit, USPTO non-provisional conversions for the three filed provisionals, enterprise pilot onboarding, healthcare ESP32-S3 hardware demo, and defence ESP32-S3 mesh demo. Status and blockers for each are listed in `docs/guides/FEATURES.md` under Human-Gated Items.

## Upgrading from v1.0.0 (2026-04-19) to v1.0.0-rc1

No breaking changes. v1.0.0-rc1 is a documentation, release-preparation, and test-stability cut on top of the v1.0.0 commit. Python SDK consumers can stay on the v0.5.x line; the SDK's public API is frozen for all of 0.5.x. Flutter super-app consumers should pull the latest TestFlight build once available. Web users on `https://www.zipminator.zip` receive the update automatically through the next Vercel deployment.

## Where to Go Next

- Canonical pillar status: `docs/guides/FEATURES.md`
- Architecture: `docs/guides/architecture.md`
- Roadmap and implementation phases: `docs/guides/implementation_plan.md`
- IP references: `docs/ip/` (three patents, USPTO provisional filing guide)
- Research references: `docs/research/` (three matching research papers, ePrint submissions)

Questions, issues, or early-adopter requests: `mo@qdaria.com`.
