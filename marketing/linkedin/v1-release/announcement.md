Zipminator v1.0 is live.

The first stable release of QDaria's post-quantum super-app ships today on iOS, Android, macOS, Linux, Windows, and the web. One codebase, nine pillars of encryption infrastructure, all built on NIST's final post-quantum standards from August 2024.

The nine pillars:

1. Quantum Vault and Self-Destruct Storage, per-file ML-KEM-768 envelopes plus DoD 5220.22-M 3-pass overwrite.
2. PQC Messenger, end-to-end messages with ML-DSA signatures and forward-secret session keys.
3. Quantum VoIP and Video, WebRTC calls with PQC-protected signalling and SRTP key exchange.
4. Q-VPN, a PQ-WireGuard userspace tunnel with ML-KEM-768 hybrid handshake.
5. 10-Level Anonymization Suite, covering hashing, tokenisation, differential privacy, k-anonymity, format-preserving encryption, and homomorphic paths. L1 through L3 are free; L4 and higher are API-gated.
6. Q-AI PQC AI Assistant, on-device inference plus encrypted remote completion with PQC-wrapped prompts and responses.
7. Quantum-Secure Email, an S/MIME replacement with ML-DSA signatures and ML-KEM envelope encryption, plus legacy bridges.
8. ZipBrowser, a Tauri 2.x desktop browser shell with a PQC tunnel and content-level verification.
9. Q-Mesh, a Channel-State-Information entropy harvester, Physical Unclonable Environment Key, EM canary, vital-auth, topo-auth, and spatiotemporal presence proofs.

Implements NIST FIPS 203 (ML-KEM-768) for key encapsulation and FIPS 204 (ML-DSA-65) for signatures. Verified against NIST Known Answer Test vectors through a deterministic DRBG harness. Built on a single from-scratch Rust core exposed to Python via PyO3 and to Flutter via a `cdylib` FFI bridge, so every platform surface runs one crypto implementation, fuzzed once and audited once. Four `cargo-fuzz` targets run continuously against keygen, encapsulate, decapsulate, and round-trip. Constant-time guards come from the `subtle` crate; secret cleanup comes from `zeroize` on drop.

Why this release matters right now. Q-day is not a hypothetical. Harvest-now-decrypt-later is already policy for state-level adversaries, which means every packet shipped today under RSA-2048 or ECDSA P-256 is a bet that those algorithms hold until the packet ages out of retention. NIST has already set the deprecation calendar: RSA and ECC are deprecated after 2030 and disallowed after 2035. European operators running under DORA, now Norwegian law since 1 July 2025, have an Article 6.4 quantum-readiness clause that expects periodic cryptographic updates based on cryptanalysis developments, and an Article 7 clause that requires full key lifecycle management. Zipminator v1.0 gives regulated operators an auditable migration path today, not a slide deck about one in 2029.

What is explicitly not claimed. Zipminator v1.0 is not FIPS 140-3 certified. CMVP submission is on the v1.1 roadmap; until a CMVP certificate is in hand, nobody on the team will use the words "FIPS 140-3 certified" or "FIPS compliant" in any context. What ships today is a NIST FIPS 203, 204, and 205 implementation verified against the public KAT vectors. Throughput numbers published in release candidates are labelled Projected or Target until measured on release hardware. No classical-only crypto sits on the user-data path. No silent downgrade to OS entropy when a quantum provider has a bad day; fallback is explicit and logged.

What ships today versus what ships next. v1.0 is production-ready for the userspace PQ-WireGuard tunnel, the full messenger, vault, email, browser, AI assistant, and 10-level anonymization stack. v1.1 targets a PQ-WireGuard kernel module (Linux first), a public TestFlight invite link, Google Play open beta, and a sub-50ms PQC handshake overhead in ZipBrowser. v1.0 is deployable for Norwegian banks and fintechs running under SB1 or DNB umbrella supervision.

Full release notes, install instructions, and the complete changelog:
https://github.com/MoHoushmand/zipminator-pqc/blob/main/docs/releases/v1.0.0/release-notes.md

Contact: mo@qdaria.com

#PostQuantumCrypto #NIST #CyberSecurity #ZipMinator #DORA #QuantumReady #MLKem #MLDsa
