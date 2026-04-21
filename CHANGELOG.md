# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc1] - 2026-04-21

Release candidate for the v1.0.0 stable tag. All 9 PQC super-app pillars are code-verified per `docs/guides/FEATURES.md`; the `v1.0.0` identifier is reserved for the final tag once kernel-mode PQ-WireGuard lands and external TestFlight rolls to App Store public.

### 9-Pillar Status Snapshot (code-verified)

| # | Pillar | % | Gaps captured below |
|---|--------|:-:|---------------------|
| 1 | Quantum Vault and Self-Destruct Storage | 100 | none |
| 2 | PQC Messenger | 85 | E2E tests need running API server; WebSocket signaling not yet covered in integration suite |
| 3 | Quantum VoIP and Video | 90 | WebRTC DTLS-SRTP not replaced at browser level; no TURN/STUN server shipped |
| 4 | Q-VPN (PQ-WireGuard) | 90 | Packet wrapping uses userspace shortcuts; macOS kernel module deferred |
| 5 | 10-Level Anonymization Suite | 95 | Flutter UI level selector not wired to backend |
| 6 | Q-AI PQC AI Assistant | 85 | Local model auto-download absent; Tauri sidebar not wired to Ollama backend |
| 7 | Quantum-Secure Email | 75 | Production SMTP/IMAP deployment pending hosting; attachment anonymization not wired into email pipeline |
| 8 | ZipBrowser (PQC AI Browser) | 85 | Uses system WebView; custom engine is out of scope for v1 (ADR documented) |
| 9 | Q-Mesh (Quantum-Secured WiFi Sensing) | 90 | Cross-repo integration script pending; ESP32-S3 hardware demo human-gated |

### Test Coverage (verified, live counts)

- Rust workspace: 550 tests total (393 excluding `zipbrowser`, plus 157 in `zipbrowser`); 1 ignored doctest
- Flutter (`cd app && flutter test`): 23 widget tests (5 core + 8 pillar + 5 extended + 5 cross-pillar)
- Web (`cd web && pnpm test`): 30 vitest cases
- Python + integration (`micromamba activate zip-pqc && pytest tests/`): 800 cases
- Grand total: 1,403 tests across the canonical surfaces
- Legacy Expo starter (`mobile/`, kept for reference only): 267 of 274 passing; not counted in the canonical total

### Added

- v1.0.0-rc1 cut of the Zipminator PQC super-app covering all 9 pillars with percentages above
- Release notes document at `docs/guides/RELEASE_NOTES_v1.0.0.md` with a user-facing narrative of this RC
- Marathon run metadata captured in `_archive/marathon/2026-04-21-open-items/` (per-track wip commits, progress log)

### Security

- Implements NIST FIPS 203 (ML-KEM-768). Verified against NIST KAT test vectors via deterministic DRBG, run as part of `cargo test -p nist-kat`
- Implements NIST FIPS 204 (ML-DSA-65) for signatures; FIPS 205 (SLH-DSA) path reserved for high-assurance builds
- Constant-time arithmetic on all secret-dependent paths via `subtle`; secret material zeroized via `zeroize` on drop
- No FIPS 140-3 CMVP certificate; CMVP engagement planned, budget and timeline noted in `grants/README.md` and `docs/guides/FEATURES.md`

### Compliance Alignment (DORA, Norwegian law since 1 July 2025)

- Art. 6.1 (encryption policies for data at rest, in transit, in use): documented in `docs/guides/architecture.md` and mapped to ML-KEM-768, AES-256-GCM, HKDF-SHA-256, and DoD 5220.22-M self-destruct
- Art. 6.4 (periodic cryptographic updates against cryptanalysis developments): covered by the 90-day mesh key rotation, per-session ephemeral ML-KEM keypairs for Q-AI, and the auditable QRNG pool refresh schedule
- Art. 7 (full cryptographic key lifecycle management): key generation, rotation, escrow, and destruction paths logged through the audit subsystem (`browser/src-tauri/src/privacy/audit.rs` and the QRNG provenance trail)

### Known Deferrals (do not block v1.0.0-rc1)

- macOS kernel module for PQ-WireGuard remains out of scope for the RC; userspace wrapping covers the Tier 1 threat model, kernel module is scheduled post-RC
- Local Flutter SDK pinning vs system SDK is not yet frozen in `flutter.yaml`; CI uses `subosito/flutter-action` to bypass, follow-up tracked on the M track
- Q-Mesh cross-repo integration script (Zipminator QRNG to RuView `scripts/provision.py`) not yet merged; mesh key provisioning currently runs manually
- Production SMTP/IMAP hosting (Hetzner or equivalent) not provisioned; Docker compose stack is ready but unhosted
- FIPS 140-3 CMVP validation, SOC 2 Type II, USPTO non-provisional conversions, and enterprise pilot onboarding remain human-gated (see Human-Gated Items in `docs/guides/FEATURES.md`)

## [1.0.0] - 2026-04-19

### Added
- First stable v1.0.0 of the Zipminator PQC super-app covering all 9 pillars: Quantum Vault and Self-Destruct Storage; PQC Messenger; Quantum VoIP and Video; Q-VPN (PQ-WireGuard); 10-Level Anonymization Suite; Q-AI PQC AI Assistant; Quantum-Secure Email; ZipBrowser (PQC AI Browser); Q-Mesh (Quantum-Secured WiFi Sensing).
- Flutter super-app `app/` promoted to canonical mobile surface (iOS, Android, macOS, Linux, Windows) with 47 TestFlight builds since first submission.
- Rust workspace `crates/zipminator-core` exposes a from-scratch ML-KEM-768 implementation with NTT, Montgomery and Barrett reductions, `subtle` constant-time guards, and `zeroize` key hygiene.
- PyO3 Python bindings published to PyPI under `zipminator` with extras for `data`, `anonymization`, `cli`, `quantum`, `jupyter`, `email`, `benchmark`, `dev`, `all`.
- Tauri 2.x desktop browser shell under `browser/` with DMG output at `target/release/bundle/dmg/`.
- Quantum entropy harvester aggregating IBM Quantum (Fez, Marrakesh), qBraid, and Rigetti with OS fallback.

### Changed
- Marketing and product documentation consolidated under `docs/guides/FEATURES.md` as the single source of truth for pillar status and pricing.
- `mobile/` (Expo React Native) and `browser/app/` (nested Flutter starter) marked legacy and frozen for reference only; all new mobile work lives in `app/`.

### Security
- Implements NIST FIPS 203 (ML-KEM-768). Verified against NIST KAT test vectors via deterministic DRBG.
- Implements NIST FIPS 204 (ML-DSA-65) for signatures and prepares for FIPS 205 (SLH-DSA) on high-assurance paths.
- No FIPS 140-3 CMVP certificate yet; CMVP submission is planned but not scheduled in this release.

### Known Limitations
- Q-VPN PQ-WireGuard kernel integration is userspace-only in v1.0.0; kernel module lands in v1.1.
- TestFlight external testing build is 47; App Store public release follows in a point release.
- Q-Mesh WiFi CSI backend requires supported chipset (Intel AX200+ or Atheros QCA).

## [0.5.0] - 2026-04-02

### Added
- Python SDK v0.5.0 general availability on PyPI: `pip install zipminator` (extras: `data`, `anonymization`, `cli`, `quantum`, `jupyter`, `email`, `benchmark`, `dev`, `all`)
- API-key gating: L1-L3 anonymisation free; L4+ requires `ZIPMINATOR_API_KEY`
- 429 passing tests (17 skipped for optional backends)

### Changed
- Graduated from `0.5.0b1` beta to stable. All public APIs frozen for 0.5.x.

## [flutter-build-43] - 2026-04-06

### Added
- Flutter super-app published to TestFlight as Build 43 (`v0.5.0+43`)
- 11 feature screens (Vault, Messenger, VoIP, Q-VPN, Anonymiser, Q-AI, Mail, Browser, Mesh, Settings, Dashboard)
- 17 Riverpod 3 providers wiring the Rust bridge to the UI layer
- Supabase OAuth (GitHub / Google / LinkedIn / Apple) verified on physical iOS device

### Fixed
- iPhone messenger routing (live- prefix mismatch)
- VoIP answer detection and WebRTC audio path
- macOS deployment target set to 13.0 with camera/mic entitlements

## [mesh-wave-1] - 2026-03-20

### Added
- `crates/zipminator-mesh/` six physical-cryptography modules:
  - `csi_entropy.rs`, Von Neumann debiased CSI entropy harvester
  - `puek.rs`, Physical Unclonable Environment Key via SVD eigenstructure
  - `em_canary.rs`, 4-level electromagnetic threat escalation
  - `vital_auth.rs`, WiFi-derived biometric continuous authentication
  - `topo_auth.rs`, Graph-topology-invariant mesh authentication
  - `spatiotemporal.rs`, Presence-proof non-repudiation signatures
- 106 mesh tests (90 unit + 16 integration)
- Total workspace test count: 513

## [paper-1-eprint-cycle] - 2026-04-06

### Changed
- Paper 1 "Quantum-Certified Anonymization" strengthened after first ePrint cycle with IND-ANON definition, composition theorem, and UC-security treatment. Target venue: PoPETs 2027 (deadline 2026-05-31).

## [0.5.0b1] - 2026-03-16

### Added
- Python SDK rewrite with PyO3 bindings to Rust Kyber768 core
- 10-level data anonymization engine (hashing through homomorphic encryption)
- PII scanner with 15-country coverage (US, UK, UAE, NO, SE, DK, FI, EU, DE, FR, IN, BR, JP, CA, AU)
- Quantum entropy harvester with scheduler daemon (IBM Quantum, qBraid, Rigetti)
- Entropy quota management system (Free/Developer/Pro/Enterprise tiers)
- Pool-based entropy provider with thread-safe file reads and OS fallback
- Subscription gating with API key validation and activation codes
- CLI tools: `zipminator keygen`, `zipminator entropy`
- QuantumRandom drop-in replacement for Python's `random` module
- Self-destruct with DoD 5220.22-M 3-pass overwrite
- JupyterLab magics and widgets
- Universal installer scripts for macOS, Linux, and Windows
- Jupyter Book documentation (20 pages, 5 use cases)
- Community files (SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md)
- CI with Python 3.9-3.13 matrix testing
- 162 Python tests, 413 Rust tests (575 total)

### Changed
- Repository moved from `MoHoushmand/zipminator-pqc` to `QDaria/zipminator`
- License classifier corrected from MIT to Apache-2.0
- Contact email updated to mo@qdaria.com
- Entropy factory priority: Pool -> qBraid -> IBM -> Rigetti -> API -> OS

### Fixed
- Stale repository URLs across all configuration files
- License classifier mismatch in pyproject.toml

## [0.2.0] - 2025-11-15

### Added
- Rust CRYSTALS-Kyber-768 implementation (from-scratch, constant-time)
- NTT layer with Montgomery and Barrett reductions
- PyO3 bindings for Python (`keypair`, `encapsulate`, `decapsulate`)
- NIST FIPS 203 Known Answer Test validation via deterministic DRBG
- Four `cargo-fuzz` targets (keygen, encapsulate, decapsulate, round-trip)
- Quantum entropy pool with IBM Quantum (Fez, Marrakesh) via qBraid
- macOS ARM64 installer script
- Basic PII scanning (US, UK, UAE)
- 255 Rust tests passing

### Security
- All secret-dependent operations use `subtle` crate for constant-time arithmetic
- `csubq()` with arithmetic masking (no conditional branches)
- `zeroize` for automatic secret key cleanup

## [0.1.0] - 2025-09-01

### Added
- Initial project scaffolding
- Cargo workspace with `zipminator-core` crate
- Basic Kyber768 key generation

[1.0.0-rc1]: https://github.com/MoHoushmand/zipminator-pqc/compare/v1.0.0...v1.0.0-rc1
[1.0.0]: https://github.com/MoHoushmand/zipminator-pqc/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/MoHoushmand/zipminator-pqc/compare/v0.5.0b1...v0.5.0
[0.5.0b1]: https://github.com/MoHoushmand/zipminator-pqc/compare/v0.2.0...v0.5.0b1
[0.2.0]: https://github.com/MoHoushmand/zipminator-pqc/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/MoHoushmand/zipminator-pqc/releases/tag/v0.1.0
