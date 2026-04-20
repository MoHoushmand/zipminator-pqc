# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1+45] - 2026-04-20 (mobile release track)

### Added
- `scripts/release-mobile.sh` wrapper: chains `flutter pub get`, scoped
  `flutter analyze`, `flutter test`, `flutter build appbundle --release`,
  and `bundletool validate`. Supports `--skip-aab` and `--ios` flags.
- `docs/guides/mobile-release.md` playbook with RELEASE_CHECKLIST,
  Android signing via `android/key.properties`, Play Store dry-run
  via bundletool, and iOS TestFlight upload notes.
- `app/test/release_version_test.dart` TDD gate: asserts pubspec version
  is strictly increasing over last shipped 0.5.0+44, iOS Info.plist
  reads from `$(FLUTTER_BUILD_NAME)` / `$(FLUTTER_BUILD_NUMBER)`, and
  Android applicationId stays `com.qdaria.zipminator`.

### Changed
- `app/pubspec.yaml`: bump version from `0.5.0+44` to `0.5.1+45`.
- `app/pubspec.yaml`: promote `yaml` and `test` to explicit
  dev_dependencies so the release gate test passes analyzer hygiene.

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
  - `csi_entropy.rs` — Von Neumann debiased CSI entropy harvester
  - `puek.rs` — Physical Unclonable Environment Key via SVD eigenstructure
  - `em_canary.rs` — 4-level electromagnetic threat escalation
  - `vital_auth.rs` — WiFi-derived biometric continuous authentication
  - `topo_auth.rs` — Graph-topology-invariant mesh authentication
  - `spatiotemporal.rs` — Presence-proof non-repudiation signatures
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

[1.0.0]: https://github.com/QDaria/zipminator/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/QDaria/zipminator/compare/v0.5.0b1...v0.5.0
[0.5.0b1]: https://github.com/QDaria/zipminator/compare/v0.2.0...v0.5.0b1
[0.2.0]: https://github.com/QDaria/zipminator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/QDaria/zipminator/releases/tag/v0.1.0
