# DORA + GDPR Compliance Checklist — Zipminator

**DRAFT — For internal compliance mapping only. Not legal advice.**  
Date: 2026-06-03 | Prepared by: QDaria AS engineering

This checklist maps DORA (EU 2022/2554), as enacted in Norwegian law effective 1 July 2025, and selected GDPR (EU 2016/679) requirements to the Zipminator codebase. References to `.claude/rules/02-security-pqc.md` ("PQC Rules") and file paths are as of branch `marathon/20260603/licensing`.

---

## DORA Article 6 — ICT Risk Management Framework (Crypto Focus)

### Art. 6.1 — Document encryption policies for data at rest, transit, and use

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| Encryption policy documented | `.claude/rules/02-security-pqc.md` §§ "NIST PQC Standards", "Zipminator PQC Implementation Rules" | Partial | Formal ICT security policy document required (separate from code rules) |
| Data at rest encrypted | `crates/zipminator-core/` — ML-KEM-768 KEM + AES-GCM-256 for file vault; `src/zipminator/` Python SDK | Yes | FIPS 203 algorithm, not CMVP-certified |
| Data in transit encrypted | `browser/src-tauri/src/` — rustls + `rustls-post-quantum` for HTTPS proxy; `crates/pq-wireguard/` for VPN | Yes | Certificate pinning policy not yet formalised |
| Key material for data in use | `crates/zipminator-core/src/` — `zeroize` crate used on key structs; constant-time ops via `subtle` crate | Yes | Formal in-use encryption (TEE/SGX) not implemented; document scope limitation |
| Algorithm inventory | `docs/compliance/sbom/sbom-cargo.cyclonedx.json` lists all crypto crates | Partial | Separate algorithm registry (FIPS 203/204/205 versions, key sizes) needed |

### Art. 6.4 — Periodic cryptographic updates based on cryptanalysis developments

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| Quantum-readiness clause (Art. 6.4 trigger) | `.claude/rules/02-security-pqc.md` — "NIST deprecates RSA/ECC after 2030, disallows after 2035" | Yes — policy stated | No formal review cadence (annual review scheduled?) |
| Migration plan documented | `docs/guides/implementation_plan.md` — hybrid mode during migration phases | Partial | Formal deprecation timeline for classical keys not written |
| Dependency version pinning for crypto | `crates/pq-wireguard/Cargo.toml` — exact version pins (`=0.8.1`, `=0.3.5`); `.claude/rules/02-security-pqc.md` §"Dependency Security" | Yes | Other crates use `^` — enforce exact pinning for all crypto deps |
| SBOM for supply chain | `docs/compliance/sbom/sbom-cargo.cyclonedx.json` (671 Rust components) | Yes (Cargo) | Python + Flutter SBOMs are stubs; automate in CI |
| Audit trail for algorithm changes | Git history + conventional commits | Partial | No dedicated crypto-change audit log; consider CHANGELOG section |

---

## DORA Article 7 — Cryptographic Key Lifecycle Management

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| Key generation with quality entropy | `quantum_entropy/quantum_entropy_pool.bin` — 6.8 MB IBM quantum QRNG; `crates/zipminator-core/` uses `getrandom` + QRNG pool | Yes | QRNG pool replenishment cadence not automated |
| Key storage — hardware-backed | `.claude/rules/02-security-pqc.md` §"Code Security Patterns" — "use hardware-backed key storage" | Policy yes | HSM/SE integration not yet shipped in production app |
| Key rotation policy | `src/zipminator/` — API key gating L4+ via ZIPMINATOR_API_KEY | Partial | No automated rotation schedule; no key revocation mechanism documented |
| Key destruction / zeroisation | `crates/zipminator-core/` — `zeroize` crate on all key structs (verified via `#[zeroize(drop)]`) | Yes | Audit all struct fields; ensure zeroize on error paths |
| Key lifecycle audit log | `.claude/rules/02-security-pqc.md` — "Log all cryptographic operations for audit trail" | Policy yes | Audit log schema and storage not yet implemented |
| Separation of duties for key management | Single developer currently | No | For Enterprise Tier: implement m-of-n key ceremony or HSM quorum |
| Backup and recovery | Supabase auth + `.env` bundled credentials (App Store) | Partial | Key backup procedure for user keys not documented |

---

## GDPR — Selected Essential Requirements

### Article 5 — Data Minimisation and Purpose Limitation

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| Collect only what is necessary | Supabase auth collects email + OAuth tokens only | Yes | Verify no unexpected analytics SDK calls in Flutter app |
| Purpose limitation | `docs/legal/TERMS_OF_SERVICE.md` §5 (this draft) | Partial — draft only | Finalise privacy policy with lawful bases per GDPR Art. 6 |

### Article 25 — Privacy by Design and Default

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| End-to-end encryption by default | ML-KEM-768 + AES-GCM; Messenger/VoIP via WebRTC DTLS + signalling server | Yes for core comms | Verify no plaintext fallback in error paths |
| Pseudonymisation | Anonymous identity pillar (`src/zipminator/anonymization/`) — IND-ANON scheme | Yes | Formal re-identification risk assessment not documented |
| Default settings privacy-preserving | App requests minimal permissions (see `app/lib/`) | Partial | Audit all `permission_handler` request sites |

### Article 32 — Security of Processing

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| Appropriate technical measures | PQC encryption + QRNG entropy + TLS 1.3 | Yes | Third-party penetration test not yet conducted |
| Ongoing testing | `.github/workflows/security.yml` — cargo-audit, Trivy, CodeQL, miri, fuzzing | Yes | Python dependency scanning not in CI (add pip-audit) |
| Encryption of personal data | All comms E2E encrypted; vault files encrypted at rest | Yes | Backup copies — verify encryption at rest |

### Article 33/34 — Breach Notification

| Requirement | Codebase evidence | Status | Gap |
|-------------|-------------------|--------|-----|
| 72-hour notification procedure | Not documented | No | Write incident response procedure (`docs/compliance/INCIDENT_RESPONSE.md`) |
| Contact point for DPA | `security@qdaria.com` in `SECURITY.md` | Partial | Register DPO / data protection contact with Datatilsynet (Norway) |

### Article 28 — Data Processing Agreements (for third-party processors)

| Processor | Personal data involved | DPA status |
|-----------|----------------------|------------|
| Supabase (EU region) | Auth email, session tokens | Check Supabase DPA terms |
| Fly.io (signalling server) | IP addresses, session metadata | Check Fly.io DPA terms |
| Apple App Store / Google Play | App telemetry (minimal) | Platform DPA — standard |

---

## Export Control Note

The Software includes post-quantum cryptographic algorithms (ML-KEM-768, ML-DSA, SLH-DSA). Distribution may be subject to:

- **EU Dual-Use Regulation** (EU 2021/821) — crypto software category 5A002/5D002
- **Norwegian eksportkontrolloven** — mirrors EU dual-use classification
- **US EAR** — if re-exported from US or if US-origin components exist

**Action required:** Obtain export classification opinion from legal counsel before distributing to restricted jurisdictions or parties on denied-party lists.

---

## Summary — Priority Actions

| Priority | Action | Owner | DORA/GDPR ref |
|----------|--------|-------|---------------|
| P1 | Write formal ICT crypto policy document | Legal + Eng | DORA Art. 6.1 |
| P1 | Add pip-audit to CI for Python supply chain | DevOps | DORA Art. 6.4 |
| P1 | Write incident response procedure | Legal + Eng | GDPR Art. 33 |
| P1 | Register data protection contact with Datatilsynet | Legal | GDPR Art. 34 |
| P2 | Automate SBOM generation (pip + Flutter) in CI | DevOps | DORA Art. 6.4 |
| P2 | Implement audit log for key lifecycle events | Eng | DORA Art. 7 |
| P2 | Formalise key rotation schedule | Eng | DORA Art. 7 |
| P2 | Export classification opinion | Legal | eksportkontrolloven |
| P3 | Add HSM/SE integration for key storage (Enterprise Tier) | Eng | DORA Art. 7 |
| P3 | Conduct third-party penetration test | Security | GDPR Art. 32 |
| P3 | Add `license` field to `zipminator-fuzz` and `rust_lib_zipminator` Cargo.toml | Eng | SBOM completeness |

---

*This checklist is a DRAFT produced by automated analysis of the codebase. It does not constitute legal advice or a complete regulatory audit. Engage qualified DORA/GDPR legal counsel before asserting compliance.*
