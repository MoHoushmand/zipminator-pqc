# Patent 1 — Quantum-Certified Anonymization: Significance Dossier

## Identification

- **Title:** Method and System for Irreversible Data Anonymization Using Quantum Random Number Generation with Physics-Guaranteed Non-Reversibility
- **Norwegian application number:** 20260384
- **Filing date:** 2026-03-24
- **Filed at:** Patentstyret (Norwegian Industrial Property Office), Oslo, Norway
- **Applicant / assignee:** QDaria AS, Oslo, Norway
- **Inventor:** Daniel Mo Houshmand
- **Priority status:** Norwegian priority secured under the Paris Convention; US 35 U.S.C. § 111(b) provisional drafted; PCT/EPO/USPTO continuations pending
- **Companion paper:** "Quantum-Certified Anonymization: Irreversibility Beyond Computational Hardness" (target venue Proceedings on Privacy Enhancing Technologies, PoPETs 2026)
- **Internal review score:** 0.97 / 1.0 (post-revision, 2026-04-02)
- **IACR Cryptology ePrint Archive:** previously rejected once on "insufficient contribution"; revised manuscript with new IND-ANON game, DP composition theorem, and UC ideal functionality is ready for resubmission once the original `YYYY/NNN` rejection ID is recovered
- **Zenodo deposit:** drafted (CC-BY-4.0, Preprint, publication date 2026-04-13), not yet published as of 2026-04-21
- **Implementation:** Apache-2.0; Python SDK, REST API, CLI, Tauri browser, Flutter mobile; 429 Python tests, 441 Rust tests at last count

## Executive Summary

Patent 1 protects a method and system that transforms personally identifiable information into quantum-random tokens, then physically destroys the mapping that links original to token, producing data whose irreversibility is bound by the Born rule of quantum mechanics rather than by computational hardness. This is the first construction, to QDaria's knowledge, in which the irreversibility of an anonymization step rests on physical law rather than on the secrecy of a PRNG seed. The buyers are regulated data controllers (banks, insurers, healthcare providers, sovereign data holders, AI-training operators) for whom GDPR Recital 26 anonymization, DORA Article 6.4 cryptographic-update obligations, and "harvest now, decrypt later" risk make pseudonymization legally insufficient. The patent locks in a defensible position in a Post-Quantum Cryptography submarket projected at USD 2.84B by 2030 and USD 29.95B by 2034, with the anonymization wedge sitting at the intersection of PQC, privacy-enhancing technologies, and certified randomness.

## Technical Novelty

- **Independent Claim 1 (method):** end-to-end QRNG-OTP-Destroy pipeline. Quantum random bytes are read from a Born-rule entropy source, used to construct a one-time-pad mapping for each unique PII value, applied across the dataset, then the mapping is destroyed via multi-pass overwrite. No deterministic seed exists at any point; irreversibility is asserted "regardless of computational resources, including in a scenario where P = NP."
- **Independent Claim 2 (system):** QRNG subsystem, thread-safe entropy pool with position tracking, processor executing the anonymization, and a dedicated mapping-destruction module. The system claim ties the construction to GDPR Recital 26 anonymous-information language.
- **Independent Claim 3 (medium):** non-transitory computer-readable medium carrying instructions for Claim 1.
- **Dependent claims that broaden the moat:** at least 100-qubit QRNG (Claim 4); DoD 5220.22-M three-pass overwrite (Claim 5); k-anonymity pre-processing (Claim 6); QRNG-sourced Laplace differential-privacy noise (Claim 7); hardware-enclave mapping destruction via SGX or TrustZone (Claim 8); provenance log per byte with provider, processor, qubit count, and timestamp (Claim 9); multi-provider failover priority chain (Claim 10); consistent-within-run, non-reproducible-across-runs token mapping (Claim 11); explicit "classically anonymized" fallback labelling when no QRNG is available (Claim 12); append-only entropy-pool file populated by daemon harvesters (Claim 13); column-selective application combining k-anonymity, OTP, and pass-through (Claim 14); and an issued quantum-anonymization certificate carrying timestamp, provider IDs, entropy bytes consumed, and a dataset hash (Claim 15).
- **Three-tier irreversibility hierarchy:** the paper introduces a strict ordering of computational, information-theoretic, and physics-guaranteed irreversibility. The patent claims read on the third tier, which classical anonymization tooling cannot reach without architectural changes (CSPRNG-to-QRNG swap, OTP construction, mapping destruction, and provenance certification).
- **Concrete security bound:** the revised security argument yields a per-value mapping-recovery probability of 62^-16 ≈ 2^-95.3, derived from the actual rejection-sampled 16-character base-62 token construction rather than a hand-waved 2^-128 estimate.
- **Hardware grounding:** 156-qubit IBM Quantum (ibm_kingston / ibm_fez) production harvests, qBraid gateway integration, Rigetti Ankaa support, and a documented OS-entropy fallback path that is required by Claim 12 to be labelled differently in the output certificate.

## Estimated Patent Value

Anchoring on Mo's prior estimate (NOK 80–220M / USD 7.5–21M over a 10-year licensing horizon for the Norwegian patent with a US continuation, with a 3-5x bundle and grant multiplier), the refined model below uses the actual claim surface and the SB1 brief's TAM anchors.

**Bottom-up license-revenue model (Norway-only filing, single jurisdiction, 10-year horizon):**

- PQC submarket: USD 2.84B in 2030 (MarketsandMarkets), expanding to USD 29.95B by 2034 (Precedence Research).
- Anonymization-adjacent slice: privacy-enhancing technologies + structured-data PQC migration. Estimated at 6-10% of the PQC submarket through 2030, rising as DORA Article 6.4 enforcement matures. Midpoint TAM 2030: USD 200-280M annually.
- Capturable share for a single defensible claim family with credible prosecution and a peer-reviewed companion paper: 0.5-1.5% via license, OEM, and field-of-use deals. Annual licensing revenue range: USD 1.0-4.2M.
- Net present value over 10 years (10% discount, ramp from 2027): USD 5-21M. This is consistent with the prior anchor. [unverified specific discount-rate selection; sensitivity within +/- 30% per discount-rate choice]

**Top-down comparables (cross-check):**

- SandboxAQ: USD ~950M raised at USD ~5.6B valuation across a multi-patent PQC + AI portfolio. Per-patent attributable value at SandboxAQ-style multiples is USD 5-15M for non-foundational claims; foundational claims trade higher. Patent 1 is closer to the foundational end because it defines a new irreversibility category, not an incremental parameter.
- PQShield: USD 65M raised on the back of NIST standardization authorship. Their patent portfolio is dense but covers standardized primitives; Patent 1 covers an unoccupied disciplinary gap (QRNG + OTP + destruction for anonymization), which is rarer.

**Bundle and jurisdiction multipliers:**

- Bundled with Patents 2 (Unilateral CSI Entropy + PUEK) and 3 (Certified Heterogeneous Entropy + ARE Provenance), the three-patent family forms a vertically-integrated post-quantum-data-protection stack covering entropy harvesting, anonymization, and provenance. Bundled, the family is plausibly worth 3-5x the sum of the individual valuations, because licensees do not need to assemble the stack from competing vendors.
- Granted EPO + USPTO continuations move the valuation toward the upper bound of the multiplier; defensive-only Norwegian grant sits at the lower bound.

**Headline range for Patent 1 alone (Norway grant + US continuation), 10-year licensing horizon:**

- **NOK 80-220M (USD 7.5-21M)** at single-jurisdiction prosecution with a credible PoPETs publication.
- **NOK 240-1,100M (USD 22-105M)** scaled with EPO + USPTO grants and bundled with Patents 2-3 (3-5x multiplier).
- **Strategic ceiling** if QDaria executes the Nordic banking play and the patent becomes the regulatory reference under DORA Article 6.4: 2-3x the upper bundled range. [unverified upper bound; depends on DORA enforcement trajectory and the existence of a sympathetic Norwegian DPA precedent]

**Why this range is defensible.** The PQC submarket is documented at 46.2% CAGR through 2030. McKinsey models USD 400-600B in value creation in financial services by 2035, of which a small fraction is attributable to anonymization for GDPR Article 17 / Recital 26 compliance. The average financial-services breach costs USD 6.08M (IBM 2024), so even a single avoided breach pays back the upper end of single-jurisdiction licensing. GDPR maxes at 4% of global turnover and DORA at 2%, both of which dwarf annual licensing fees, giving licensees a structural reason to pay.

## Market Impact

**Primary addressable buyers (5-year horizon, 2026-2031):**

- Norwegian and Nordic banks subject to DORA Article 6.4. SpareBank 1 alliance alone has ~NOK 625B in assets and a centralized Azure platform that consolidates the buyer-side decision into a single Utvikling procurement.
- Norwegian and EU healthcare data holders (helseplattformen, regional health authorities) where GDPR Recital 26 anonymization is the only legally durable path to data sharing for AI training.
- EU financial-services AI training and synthetic-data programs that need to demonstrate Recital 26 anonymization for source datasets.
- US healthcare and financial data fiduciaries where HIPAA Safe Harbor and Expert Determination intersect with PQC migration.

**Secondary addressable buyers (5-10 year horizon):**

- Sovereign data holders (Norwegian SSB, Statistics Sweden, ENISA reference deployments) seeking an auditable PQC-anchored anonymization workflow.
- Large AI-training operators (model providers, foundation-model labs) who need provable irreversibility for training-data anonymization to comply with the EU AI Act and forthcoming national supplements.
- QRNG vendors (IDQ, Quantinuum, Quandela, Toshiba) looking to bundle anonymization with their hardware appliances.

**Revenue contribution to QDaria (illustrative):**

- 5-year (2026-2031): NOK 30-90M cumulative revenue attributable to Patent 1 via Zipminator licensing, OEM, and direct anonymization contracts. Assumes 2-6 anchor customers and a single Nordic banking reference deployment.
- 10-year (2026-2036): NOK 150-450M cumulative, dependent on EPO/USPTO grant timing and on whether the EU adopts a quantum-certified anonymization reference architecture.
- Strategic upside: Patent 1 is the single QDaria invention most likely to be cited in EU privacy guidance, because it provides the cleanest answer to the open question of "what does technical anonymization that survives a quantum-capable adversary look like?" Acquisition interest from SandboxAQ-class buyers becomes a credible exit option once the paper is peer-reviewed and the patent is granted.

## Companion Paper

- **Title:** "Quantum-Certified Anonymization: Irreversibility Beyond Computational Hardness"
- **Target venue:** PoPETs 2026; secondary track Nature Communications letter
- **Internal review score:** 0.97 / 1.0 (2026-04-02, after 10 RALPH iterations)
- **Status:** revised draft compiles clean at 17 pages, 109 anonymizer tests pass, 47 citations verified, 2.7 MB of ibm_kingston-harvested entropy embedded in evaluation, second ibm_fez harvest (job d76hr068faus73f1ah20) added for reproducibility
- **ePrint history:** IACR Cryptology ePrint Archive rejected once on "insufficient contribution"; rebuttal will reference the new IND-ANON indistinguishability game, the DP composition theorem (epsilon-DP survives QRNG-OTP post-processing), and the UC ideal functionality F_ANON. Resubmission is blocked only on retrieving the original ePrint ID from Mo's other Mac.
- **Zenodo deposit:** drafted at docs/research/eprint/zenodo-paper1.md, awaiting upload via the ZENODO-PUBLISH-RUNBOOK preflight sequence.
- **Primary artifacts:** docs/research/paper-1-quantum-anonymization/main.tex and docs/research/eprint/paper1-quantum-anonymization.pdf

**Current blockers (paper):**

1. Retrieve original IACR rejection ID for resubmission letter.
2. Confirm Zenodo deposit checksum on the 0.97-iteration PDF before upload.
3. Optional: formalize cryptographic game in Appendix A camera-ready; non-blocking for Zenodo, low risk for PoPETs.

## Regulatory & Strategic Significance

- **GDPR Recital 26:** the patent's core commercial argument is that QRNG-OTP-Destroy produces output meeting the Recital 26 standard for "anonymous information" where the data subject is "not or no longer identifiable." Recital 26 output sits outside GDPR's scope entirely, which removes Article 17 erasure, Article 32 security, and Article 33 breach-notification obligations for the anonymized data. The companion paper softens the language from "satisfies" to "provides the strongest technical basis for arguing" in response to legal critique, which is the prudent posture pre-DPA opinion.
- **DORA Article 6.4:** Norwegian law since 1 July 2025. Requires periodic updates to cryptographic technology to ensure resilience against "evolving threats, including cryptanalysis developments." The patent's information-theoretic guarantee is the strongest possible answer to this clause because there is no cryptanalysis development that can defeat a destroyed mapping derived from quantum-measurement outcomes. Non-compliance penalties reach 2% of global turnover.
- **DORA Article 7:** key lifecycle management. Claim 15's quantum-anonymization certificate (timestamp, provider, entropy bytes consumed, dataset hash) supplies the auditable evidence that Article 7 demands.
- **NIST FIPS 203 (ML-KEM-768):** the underlying Zipminator PQC core implements NIST FIPS 203 and is verified against NIST KAT test vectors. The anonymization patent does not claim a cryptographic primitive standardized by NIST; it claims an application of QRNG to anonymization. The two layers compose: PQC for confidentiality of the anonymized data in transit and at rest; QRNG-OTP-Destroy for the anonymization transformation itself.
- **EU AI Act:** Articles on training-data provenance and lawfulness of processing intersect directly with anonymization claims for training datasets. Patent 1's certificate-bearing output is well-positioned as the reference evidence for "anonymous training data" arguments.
- **NIST SP 800-90B:** the entropy-pool layer is consistent with SP 800-90B language (paper 2 of the family achieves explicit validation). Patent 1 leverages the same pool architecture without claiming the certification itself.
- **Standardization opportunity:** the patent's claim structure is compatible with future NIST or ENISA reference architectures for quantum-certified anonymization. Filing now (2026-03-24) places QDaria ahead of any standards body activity in this area.

## Highlights (one-liners)

- First anonymization construction whose irreversibility is bound by the Born rule rather than by computational hardness, to QDaria's knowledge.
- Security holds in a world where P = NP, because the guarantee is physical rather than computational.
- Filed at Patentstyret on 2026-03-24 as Norwegian application 20260384; Paris-Convention priority secured.
- Three independent claims, twelve dependent claims, covering method, system, and computer-readable medium.
- Per-value mapping-recovery probability bounded at 62^-16 ≈ 2^-95.3 by rejection-sampled 16-character base-62 tokens.
- 156-qubit IBM Quantum production harvest (ibm_kingston, ibm_fez) anchors the entropy pool in real hardware, not simulator output.
- Companion paper at internal score 0.97/1.0; PoPETs 2026 target, Zenodo deposit drafted, IACR ePrint resubmission queued.
- Implements NIST FIPS 203 (ML-KEM-768) underneath; the anonymization output is then protected by post-quantum confidentiality.
- DORA Article 6.4's quantum-readiness clause is structurally satisfied by Born-rule irreversibility because no cryptanalysis development can defeat a destroyed mapping.
- GDPR Recital 26 anonymous-information argument is supported by an auditable provenance certificate (Claim 15).
- Single defensible Norwegian patent valuation range: NOK 80-220M (USD 7.5-21M); bundled with Patents 2-3 across EPO + USPTO grants: NOK 240-1,100M (USD 22-105M).
- Patent 1 is QDaria's strongest single-claim asset for a SandboxAQ-class strategic acquisition or licensing partnership.

## Competitive Moat

- **SandboxAQ:** focused on cryptographic management, AQtive Guard inventory, and FedRAMP track. They do not publish on physics-guaranteed anonymization and have not filed claims that read on QRNG + OTP + mapping destruction for tabular PII. Their workflows are CSPRNG-based, which the patent positions as a separate (lower) tier of irreversibility.
- **PQShield:** authored NIST PQC standards (ML-KEM, ML-DSA, SLH-DSA). Their portfolio covers primitives standardized by NIST. Patent 1 covers an application layer above the primitives; PQShield IP does not block QDaria, and QDaria's claim does not block PQShield. The two portfolios are complementary, not overlapping.
- **Thales, Entrust:** HSM and key-management incumbents. They ship PQC-ready hardware, not anonymization workflows. They are credible licensees, not credible competitors on this specific claim.
- **IDQ, Quantinuum:** QRNG hardware vendors. IDQ's Quantis line has NIST SP 800-90B Entropy Source Validation; Quantinuum's Quantum Origin became the first software QRNG to achieve SP 800-90B validation in 2025. Both focus on cryptographic key generation, not anonymization. They are upstream vendors whose hardware QDaria can consume; they are not competing on the anonymization claim itself.
- **ARX (Prasser et al.), sdcMicro, Amnesia, Google DP Library, OpenDP, Apple Local DP, Microsoft Presidio, Privitar:** all classical-PRNG-backed. Per the comparison table in docs/research/quantum-anonymization-comparison.md, none of these tools claims physics-based irreversibility, none implements mapping destruction, and none survives the seed-recovery threat model. Retrofitting any of them to clear Patent 1's claim surface requires architectural change (QRNG sourcing, OTP construction, mapping destruction), not parameter swap.
- **Disciplinary gap as moat:** the QRNG community has focused on key generation; the anonymization community has treated CSPRNGs as sufficient. The combination of these two skill sets in a single, working, production-tested system is the differentiator. The patent claims read on this combination, not on either component alone.

## Risk Factors

- **IACR ePrint rejection history:** the prior rejection on "insufficient contribution" indicates a high bar for cryptographic novelty. Mitigated by the new IND-ANON game, DP composition theorem, and UC ideal functionality added in the 0.97-iteration revision. Resubmission is queued; PoPETs remains the primary venue regardless.
- **Prosecution risk at EPO and USPTO:** patentability of methods that combine standard components (QRNG hardware + OTP + secure erase) may face Section 101 / Article 52(2)(c) objections in the US and EPO respectively. Mitigated by (a) the concrete hardware claim (Claim 4, at least 100 qubits) and (b) the multi-provider failover and certificate claims that anchor the method in physical apparatus.
- **Prior-art exposure:** Amer et al. (2025) in Nature Reviews Physics is the closest published work and discusses certified randomness for differential privacy. Amer does not propose OTP mapping or mapping destruction. The companion paper qualifies "first" claims with "to our knowledge" to soften the novelty argument while keeping the priority date.
- **Bohmian-mechanics / superdeterminism objection:** the Born-rule argument is strengthened by Bell-theorem references but does not formally exclude non-local hidden variables. Mitigated by an explicit footnote in the paper and by the practical inaccessibility of any hypothetical hidden variables.
- **QRNG provider dependency:** Born-rule guarantee assumes the quantum hardware faithfully prepares qubits in superposition. A vendor backdoor would defeat the security argument. Mitigated by multi-provider failover (Claim 10), provenance log (Claim 9), and a forward path to device-independent randomness certification (not claimed; left as a future invention).
- **Quantum-hardware noise:** preparation and readout errors introduce bias. Mitigated by rejection sampling in the token-generation code and a dedicated paper subsection on noise considerations.
- **GDPR Recital 26 legal exposure:** "satisfies Recital 26" is a legal claim outside the inventors' expertise. The paper softens this to "provides the strongest technical basis." Risk remains that a DPA opinion will set a higher bar; Patent 1's certificate (Claim 15) is designed to support such a bar.
- **Zenodo and ePrint coordination:** the deposit is drafted but not published. Until published, the priority story rests on the Norwegian filing date (2026-03-24), which is sufficient. Publication moves the academic credibility line from "score 0.97 internal" to "preprint with persistent DOI."
- **Bundle execution risk:** the 3-5x bundle multiplier assumes Patents 2 (CSI Entropy + PUEK) and 3 (CHE + ARE Provenance) also prosecute successfully. Failure on either reduces the bundled valuation toward the single-patent floor.

## References

- docs/ip/patent-1-quantum-anonymization/sammendrag.md
- docs/ip/patent-1-quantum-anonymization/beskrivelse.md
- docs/ip/patent-1-quantum-anonymization/patentkrav.md
- docs/ip/patent-1-quantum-anonymization/provisional-patent-quantum-anonymization.md
- docs/research/paper-1-quantum-anonymization/main.tex
- docs/research/paper-1-quantum-anonymization/peer-review-report.md
- docs/research/quantum-anonymization-comparison.md
- docs/research/eprint/zenodo-paper1.md
- docs/research/eprint/SHIP_READINESS.md
- docs/research/eprint/paper1-quantum-anonymization.pdf
- docs/research/quantum-safe-banking-sb1-intelligence-brief.md
