# Google Play Store — Main Store Listing (paste-ready)

Source of truth: `docs/guides/FEATURES.md`. Last refresh: 2026-04-29.

Paste these into Play Console → **Main store listing**.

---

## App name (50 char limit)

```
Zipminator: PQC Super-App
```
Length: 24 chars. Comfortably under cap; leaves room for localized variants.

---

## Short description (80 char limit)

```
Quantum-resistant encryption for files, calls, mail, browser, and WiFi mesh.
```
Length: 76 chars. Hits the three highest-search keywords (quantum-resistant, encryption, mail) inside cap.

---

## Full description (4000 char limit, current draft: ~3600 chars)

```
Zipminator is the world's first post-quantum cryptography (PQC) super-app. One install gives you nine independent privacy pillars, each protected by NIST FIPS 203 ML-KEM-768 algorithms and seeded with true quantum entropy harvested from 156-qubit IBM Quantum computers.

WHY POST-QUANTUM, WHY NOW

A "harvest now, decrypt later" attack is already underway: nation-state actors are recording today's encrypted internet traffic, betting that a future quantum computer will crack it within a decade. RSA, ECDH, and ECDSA are all known to fall to Shor's algorithm. Zipminator gives you a complete, field-tested replacement stack today.

THE NINE PILLARS

1. QUANTUM VAULT — AES-256-GCM file encryption with keys derived from ML-KEM-768. DoD 5220.22-M three-pass self-destruct. PII pre-scan with 20 detection patterns.

2. PQC MESSENGER — Post-quantum Double Ratchet protocol. Forward secrecy, offline message queue, group fan-out. WebSocket signaling.

3. QUANTUM VOIP — PQ-SRTP voice and video calls. AES-256-GCM frame encryption with HKDF-SHA-256 key derivation from ML-KEM-768 shared secrets. Encrypted voicemail leg.

4. Q-VPN — PQ-WireGuard with kill-switch, automatic reconnect, and ML-KEM-768 hybrid handshake. Native iOS Network Extension.

5. 10-LEVEL ANONYMIZER — From regex masking to differential privacy to quantum-OTP irreversible anonymization (patent pending). Production code originally built for the Norwegian Labour and Welfare Administration.

6. Q-AI ASSISTANT — Local-first LLM via Ollama. Eighteen-pattern prompt injection guard across six attack categories. Built-in PII pre-send scanner. PQC tunnel for cloud LLM fallback.

7. QUANTUM MAIL — Self-destructing email with TTL header. SMTP and IMAP transport with PQC envelope crypto. DKIM signing. Pre-send PII gate. Domain @zipminator.zip.

8. ZIPBROWSER — Tauri-based PQC browser with seven privacy subsystems: VPN, fingerprint spoofing, per-tab cookie isolation, telemetry blocking, password vault with Argon2id, zero-telemetry audit log, quantum-readiness scanner that grades every site A-F.

9. Q-MESH — Quantum-secured WiFi sensing via the RuView ESP32-S3 mesh. HMAC-SHA-256 beacon authentication, SipHash-2-4 frame integrity. WiFi CSI signals detect human pose, breathing, and heartbeat without cameras. Healthcare and defense applications.

ENGINEERING

- 800+ verified tests across Rust, Flutter, Python, and TypeScript
- Constant-time crypto operations with no unsafe Rust
- IBM Quantum Marrakesh and Fez 156-qubit machines for entropy harvesting
- Full CI gates on cargo test, cargo clippy with deny warnings, vitest, pytest, flutter test
- Pure Rust ML-KEM-768 implementation with PyO3 bindings for Python and FRB bindings for Flutter

COMPLIANCE

- NIST FIPS 203 ML-KEM-768 (final, August 2024)
- CNSA 2.0 alignment for US federal procurement
- ETSI quantum-safe cryptography standards
- DORA compliance for Norwegian financial-services use cases
- GDPR, HIPAA, CCPA data-handling

NOT FIPS 140-3 VALIDATED. Zipminator implements the FIPS 203 algorithms but is not currently a CMVP-certified module. CMVP certification is on the roadmap for enterprise customers; contact sales.

PRICING TIERS

Free — 1 GB storage, anonymization levels 1-3.
Developer ($9/mo early-bird) — 10 GB, levels 1-5, full API.
Pro ($29/mo early-bird) — 100 GB, levels 1-7, team management, SSO.
Enterprise (custom) — unlimited, all 10 anonymization levels, QRNG access, on-premise deployment, HSM support, 24/7 dedicated support.

GitHub star supporters unlock the Developer tier free with code GHSTAR-LEVEL5.

DOWNLOADS AND DOCS

Website: https://zipminator.zip
Documentation: https://zipminator.zip/docs
Source on GitHub (open core): https://github.com/QDaria/zipminator-pqc
Investor pitch deck: https://zipminator.zip/invest

A QDaria AS product. Built in Norway. Quantum-ready since day one.
```

Length: ~3650 chars. Add or remove sections to fine-tune.

---

## App category

Primary: **Tools**
Secondary: **Communication** (so the messenger and mail features are findable)

Tags (max 5): `encryption`, `privacy`, `vpn`, `secure messaging`, `quantum`

---

## Required graphics checklist

| Asset | Spec | Source/notes |
|---|---|---|
| App icon | 512×512 PNG, no alpha, ≤1 MB | Export from `web/public/logo.svg` or design new from quantum cyan tokens |
| Feature graphic | 1024×500 PNG | New design needed; show 4-6 pillar tiles + tagline |
| Phone screenshots (min 2, max 8) | 9:16 or 16:9, ≥320px short side, ≤8 MB each | Capture from iPhone 17 Pro sim once auth is working |
| 7-inch tablet (optional) | 16:10 or 10:16, ≥320px short side | Capture from iPad mini sim |
| 10-inch tablet (optional) | 16:10 or 10:16, ≥320px short side | Capture from iPad Pro 13-inch (M5) sim |
| Promo video URL | YouTube link, 30s-2min | Defer for beta |

The 8 phone screenshots should follow this storyboard:
1. Login screen with brand (already captured: `_screenshots/2026-04-29/sim-zipminator-home.png`)
2. Vault: file encryption with self-destruct timer
3. Messenger: encrypted chat with peer identity verified
4. VoIP: in-call screen with "PQC active" indicator
5. VPN: kill switch toggle + connection state
6. Anonymizer: level slider with PII detection counts
7. Q-AI: chat with local-LLM badge
8. Mail: compose with PII pre-send gate active

---

## Country / region availability

Initial launch: **Available in all countries except** US embargo countries (Cuba, Iran, North Korea, Syria, Crimea/Donetsk/Luhansk regions). The Play Console preset "All countries except US-restricted" handles this.

Encryption export note: `My app uses encryption` → **Yes**. ECCN 5D002.c.1, eligible for License Exception ENC under EAR §740.17(b)(1). Self-classification report (SCR) submitted to BIS at https://snap-r.bis.doc.gov within 30 days of first US distribution. (Action item: file the SCR.)
