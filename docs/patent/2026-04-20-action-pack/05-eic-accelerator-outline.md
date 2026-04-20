# EIC Accelerator Step 1, Short Application, draft outline

**Portal:** https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en
**2026 budget:** EUR 634 M total, with dedicated quantum-tech envelope
**Grant:** up to EUR 2.5 M
**Equity:** up to EUR 10 M via EIC Fund
**Deadlines 2026 (Step 1, rolling):** Check portal for exact cutoff; typical cutoffs March, June, October
**Eligibility:** SME from EU Member State or Horizon Europe associated country (Norway qualifies)
**Format:** Short application (10-15 pages) at Step 1, full business plan at Step 2

---

## Pre-submission checklist

1. QDaria AS registered with Norwegian org.nr.
2. Participant Identification Code (PIC) registered via EU Funding & Tenders Portal
3. PCT applications filed (planned by March 2027), priority dates locked
4. Letter of Intent from at least 2 pilot customers (tied to Innovation Norway Phase 1 output)
5. At least 2 years of financial projections

## Application sections (Step 1 structure)

### 1. Company and project identity
- **Legal name:** QDaria AS
- **Project acronym:** ZIPMINATOR
- **Full title:** Post-Quantum Cryptographic Super-App for EU Financial Services DORA Compliance and Quantum Readiness
- **Sector:** Deep Tech, Cybersecurity, Quantum Technology
- **Requested:** EUR 2.5 M grant + EUR 5 M equity

### 2. Value proposition (max 1,000 chars)
QDaria Zipminator shields EU financial institutions against quantum adversaries. The platform implements NIST FIPS 203/204/205 post-quantum algorithms with quantum-measured entropy for information-theoretic irreversibility. Nine integrated pillars cover vault storage, messaging, VoIP, VPN, anonymization, AI assistant, email, browser, and WiFi sensing. Three priority patent applications (Patentstyret 2026) cover unique methods not in competitor offerings. Target customers are DORA-regulated entities facing EU deadline 2030 NIST deprecation, 2035 prohibition.

### 3. Problem and market

**Problem:** Quantum computing threatens all classical cryptography. Gidney 2025 (arXiv:2505.15917) estimated RSA-2048 break at under 1 million noisy qubits. Google's March 2026 announcement narrowed the timeline. DORA Article 6.4 mandates cryptographic agility. NIST deprecates RSA/ECC after 2030, prohibits after 2035.

**Market:** European PQC market projected USD 12 B by 2030 (Fortune Business Insights, 2025). EU financial sector addressable market is 5,900 regulated entities under DORA. Adjacent defense and government markets add EUR 4 B annually.

**Customers:** DNB, Nordea, SEB, Handelsbanken, Swedbank tier-1 banks; European Central Bank participants; NATO-adjacent defense SMB.

### 4. Innovation (what is new)

Three patent-pending methods that competitors (PQShield, SandboxAQ, IBM Quantum Safe) do not cover:

1. **Quantum-Measured Irreversible Anonymization (Patent 20260384):** Information-theoretic irreversibility via Born rule. 2^-128 recovery probability per 16-byte identifier. Mathematically provable against both classical and quantum attackers.
2. **CSI Entropy PUEK (Patent filed 2026-04-04):** Channel State Information-derived entropy keys with provenance attestation. Solves the key-material supply chain problem for distributed PQC deployments.
3. **CHE-ARE Provenance (Patent filed 2026-04-05):** Hash-chained logs bound to measured quantum randomness. Forensic tamper-evident logging for regulated industries.

All three methods are composable with standard NIST PQC primitives (ML-KEM-768, ML-DSA, SLH-DSA) and operate as an orthogonal security layer.

### 5. Competitive landscape

| Competitor | Strength | Gap vs QDaria |
|---|---|---|
| PQShield | Strong hardware IP | No quantum-entropy integration, no full-stack app |
| SandboxAQ | Google backing, enterprise sales | Proprietary stack, no information-theoretic anonymization |
| IBM Quantum Safe | Enterprise relationships | Bound to IBM platforms, no mobile or Flutter SDK |
| Thales/Gemalto | Crypto hardware history | Slow to PQC, no new patent methods |

QDaria positioning: "The PQC super-app, not just a library." Flutter mobile + Tauri browser + Next.js web + Rust core + Python API, all using the same three patented methods.

### 6. Team

**Founder:** Daniel Mo Houshmand
- Inventor on 3 patent applications
- (insert academic credentials from CV)
- (insert prior industry roles)

**Planned hires (post-funding):**
- CTO, Cryptography (target: Senior from University of Waterloo IQC or ETH Zurich QLab)
- CTO, Distributed Systems (target: Senior from AWS Crypto or Google Cloud KMS)
- Head of Growth (target: EU fintech with DORA-adjacent sales history)
- Head of Research (target: Postdoc with peer-reviewed PQC publications)

### 7. Business model

- **SaaS subscription:** EUR 50 to 500 per seat per month (tiered by pillar access)
- **Enterprise licensing:** EUR 100 K to 1 M per year (DORA-regulated financial institution, full nine pillars)
- **Source-available core with commercial extensions** (open-core model like GitLab, MongoDB)
- **Professional services:** EUR 500 per day consultancy for migration engagements

### 8. Traction and milestones

- **Current (April 2026):** 3 patents filed, Rust core implements NIST FIPS 203/204/205 verified against KAT, Flutter mobile with 46+ TestFlight builds, Tauri browser DMG built.
- **Q4 2026 (Innovation Norway Phase 1 output):** 5 Letters of Intent, 2 signed pilots.
- **Q2 2027 (post PCT):** Peer-reviewed paper accepted, 5 paying pilots, EUR 500 K ARR.
- **End of EIC grant (year 2):** EUR 5 M ARR, 20 enterprise customers, CE/FIPS 140-3 CMVP submitted.

### 9. Use of funds (EUR 2.5 M grant + EUR 5 M equity)

| Category | EUR grant | EUR equity | Total |
|---|---|---|---|
| Engineering team (8 FTE, 24 months) | 1 500 000 | 2 000 000 | 3 500 000 |
| Go-to-market (EU sales, 3 FTE + events) | 400 000 | 1 500 000 | 1 900 000 |
| Patent prosecution (PCT national phases) | 300 000 | 200 000 | 500 000 |
| CMVP / CE certification | 200 000 | 400 000 | 600 000 |
| Quantum hardware access + research | 100 000 | 400 000 | 500 000 |
| Operations, legal, admin | 0 | 500 000 | 500 000 |
| **Total** | **2 500 000** | **5 000 000** | **7 500 000** |

### 10. Strategic fit with EIC priorities

- **Strategic Technology Areas 2026:** Quantum Technologies (direct fit), Cybersecurity (direct fit), Critical Infrastructure Protection (via DORA)
- **Gender dimension:** Target 40% female engineering team by year 2 (co-founder recruitment prioritizes)
- **Sustainability:** Reduced server-side computation via offloading to quantum randomness beacons (EU projects: Q-TREX, QUANT-COM)

---

## Ready-to-send status

**NOT ready to send.** Requires:

1. QDaria AS registered
2. PIC code obtained from EU Funding & Tenders Portal
3. Full 2-year financial projections (spreadsheet attachment)
4. 2 Letters of Intent from customers (output of Innovation Norway Phase 1)
5. Founder CV updated with verified academic and industry history
6. Team recruitment plan with named candidates (LinkedIn URLs)
7. Detailed work packages with deliverables, person-months, and risk register

Recommended sequence:
1. File Innovation Norway Phase 1 (yields LoIs) → 3 to 6 months
2. Recruit 1-2 co-founders or senior advisors → 3 months
3. File EIC Accelerator Step 1 → Q3 2026 or Q1 2027
4. If invited, Step 2 requires full business plan + interview + equity due diligence → 2 to 3 months additional
