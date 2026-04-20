# Zipminator v1.0.0

**Release date:** 2026-04-19
**Codename:** Q-Day Ready

Zipminator v1.0.0 is the first stable release of QDaria's post-quantum super-app. This release ships all 9 encryption-infrastructure pillars on a single codebase built on NIST's finalized post-quantum standards.

## Highlights

- Implements NIST FIPS 203 (ML-KEM-768) for key encapsulation.
- Implements NIST FIPS 204 (ML-DSA-65) for digital signatures.
- Ships across iOS, Android, macOS, Linux, Windows, and a Next.js 16 web dashboard.
- Single Rust crypto core under `crates/zipminator-core`, exposed to Python via PyO3 and to the Flutter app via an FFI bridge.
- Zero classical-only crypto on the user data path; all new cryptographic operations use NIST PQC algorithms.

## The 9 Pillars

1. **Quantum Vault and Self-Destruct Storage**: Per-file ML-KEM-768 envelopes plus DoD 5220.22-M 3-pass self-destruct.
2. **PQC Messenger**: End-to-end ML-KEM-768 messaging with ML-DSA signatures and forward-secret session keys.
3. **Quantum VoIP and Video**: WebRTC audio and video with PQC-protected signalling and SRTP key exchange.
4. **Q-VPN (PQ-WireGuard)**: Userspace PQ-WireGuard tunnel with ML-KEM-768 hybrid handshake.
5. **10-Level Anonymization Suite**: Levels L1 through L10 covering hashing, tokenisation, differential privacy, k-anonymity, format-preserving encryption, and homomorphic paths. L1 through L3 free; L4+ gated by `ZIPMINATOR_API_KEY`.
6. **Q-AI PQC AI Assistant**: On-device inference plus encrypted remote completion with PQC-wrapped prompts and responses.
7. **Quantum-Secure Email**: S/MIME replacement using ML-DSA signatures and ML-KEM envelope encryption, with legacy bridges.
8. **ZipBrowser (PQC AI Browser)**: Tauri 2.x desktop browser shell with PQC tunnel and content-level verification.
9. **Q-Mesh (Quantum-Secured WiFi Sensing)**: Channel-State-Information entropy harvester, Physical Unclonable Environment Key (PUEK), EM canary, vital-auth, topo-auth, and spatiotemporal presence proofs.

## Supported Platforms

- **iOS**: TestFlight external testing, Build 47 (`v0.5.0+47`).
- **Android**: APK and AAB artefacts for internal testing track.
- **macOS**: Flutter desktop + native Tauri browser DMG.
- **Linux**: Flutter desktop (GTK) and browser AppImage.
- **Windows**: Flutter desktop and browser MSI.
- **Web**: Next.js 16 dashboard on port 3099 locally; production at `https://www.zipminator.zip`.

## Install

### Python SDK

```bash
pip install "zipminator[all]"
```

Activate the project environment if contributing from source:

```bash
micromamba activate zip-pqc
uv pip install maturin
maturin develop
```

### Rust crate

```bash
cargo install zipminator-core   # placeholder; Target availability during v1.0.x
```

### Flutter app (source build)

```bash
cd app && flutter pub get && flutter run
```

### TestFlight

Public TestFlight invite link ships in the v1.0.1 point release; internal testers remain on Build 47.

## Performance and Quality Signals

- Rust workspace: `cargo test --workspace` passes (Target: 513+ tests across Rust + mesh).
- Python: `pytest tests/` passes (Projected: 429 passing, 17 skipped for optional backends per 0.5.0 baseline).
- Clippy: `cargo clippy --workspace -- -D warnings` clean.
- Fuzzing: 4 `cargo-fuzz` targets (keygen, encapsulate, decapsulate, round-trip).
- Constant-time guards via `subtle`; secret cleanup via `zeroize`.

Forward-looking throughput and latency numbers are published separately per release candidate and are labelled Projected or Target until measured on release hardware.

## Known Limitations

- Q-VPN PQ-WireGuard kernel module is not shipped in v1.0.0; the userspace tunnel is the only supported path.
- Q-Mesh CSI harvester requires a supported chipset (Intel AX200 or newer, or Atheros QCA).
- No FIPS 140-3 CMVP certificate yet. CMVP submission is planned; do not claim "FIPS 140-3 certified" or "FIPS 140-3 validated" in downstream marketing.
- Quantum-Secure Email S/MIME bridges to legacy clients are best-effort; recipients without PQC support degrade to ML-DSA-signed classical envelopes.

## Roadmap to v1.1

- Q-VPN PQ-WireGuard kernel module (Linux first, then macOS kext/system extension).
- Public TestFlight link and Google Play open beta.
- Expanded 10-Level Anonymization coverage for SE, DK, FI, and JP PII rulebooks.
- ZipBrowser PQC proxy performance pass targeting sub-50ms handshake overhead (Target).

## Acknowledgements

Built by QDaria. Crypto implementation follows NIST's FIPS 203, FIPS 204, and FIPS 205 final specifications (August 2024). DORA Art. 6 and Art. 7 compliance posture documented in `docs/guides/compliance/`.

Contact: mo@qdaria.com
