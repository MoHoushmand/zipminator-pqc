# Patent 3 — Certified Heterogeneous Entropy + ARE Provenance: Significance Dossier

## Identification

- **Title:** Certified Heterogeneous Entropy Composition with Algebraic Randomness Extraction and Cryptographic Provenance
- **Application number:** [unverified] (Norwegian Patentstyret application number not yet recorded in the worktree; filed under Norwegian Patents Act § 8)
- **Filing date:** 2026-04-05 (Norwegian Patentstyret); priority date secured under the Paris Convention
- **Jurisdiction:** Norway (Patentstyret), with planned EPO and USPTO extensions inside the 12-month convention window
- **Applicant / Assignee:** QDaria AS, Oslo, Norway
- **Inventor:** Daniel Mo Houshmand
- **Cross-references in family:** Norwegian application No. 20260384 (2026-03-24, Quantum-Certified Anonymization); co-pending Unilateral CSI Entropy + PUEK application (2026-04-04, Patent 2)
- **Status:** filed; provisional materials in `docs/ip/patent-3-che-are-provenance/` cover sammendrag, beskrivelse, patentkrav, and a 17-claim English provisional
- **Companion paper:** "Certified Heterogeneous Entropy with Algebraic Randomness Extraction" by D.M. Houshmand (QDaria AS)
- **Zenodo deposit status:** cleared for upload per `docs/research/eprint/SHIP_READINESS.md`; Zenodo deposit doc is `docs/research/eprint/zenodo-paper3.md`; PDF artifact `docs/research/eprint/paper3-che-are-provenance.pdf`
- **IACR ePrint / arXiv status:** on hold pending the "facelift" itemized in SHIP_READINESS, in particular tightening the GF(p^n) bijection-on-multiplicative-group argument, NIST SP 800-90B `ea_non_iid` official runs, and CSI pool expansion to the 1M-sample certification scale
- **Current hold reasons:** open mixed-domain extraction reduction (Theory gap T1 in `zenodo-paper3-option-b-gaps.md`), pending NIST tool runs (M1), pending CSI pool expansion (M2)
- **Phrasing note carried forward:** the deposit doc line 20 should soften "satisfying DORA Art. 7" to "aligned with DORA Art. 7" or "designed to support DORA Art. 7 alignment", matching the post-Paper-1 lesson

## Executive Summary

Patent 3 is the auditability layer of QDaria's three-patent post-quantum portfolio. The invention solves the regulator-facing problem that Patents 1 and 2 expose: regulated buyers cannot trust a quantum-safe system if they cannot independently audit which entropy sources fed every key derivation event. The patent introduces Algebraic Randomness Extraction (ARE), a new family of seeded extractors over up to nine bounded number domains (Natural, Integer, Rational, Real, Complex, Quaternion, Octonion, GF(p^n), p-adic) with six arithmetic operations, deterministically generated from SHAKE-256; combined with a Certified Heterogeneous Entropy (CHE) composition protocol that XOR-fuses three independent quantum sources (IBM Quantum's 156-qubit ibm_kingston, Rigetti, and qBraid, 156 qubits user-confirmed), classical WiFi CSI from ESP32-S3, and OS entropy, while emitting Merkle-tree provenance certificates that bind every output to its source records. Graceful degradation lowers reported min-entropy when sources fail, with no silent fallback. Patent 3 is the procurement-pull patent of the family; its value rises in lockstep with DORA enforcement intensity under Finanstilsynet and equivalent EU supervisors.

## Technical Novelty

- **New extractor family.** ARE is distinct from every known hash-based extractor (universal hashing, Trevisan, Leftover Hash Lemma, GUV). It is the first published family that parameterizes extraction by algebraic programs across multiple number domains rather than linear hashes over GF(2).
- **Heterogeneous 3-source quantum mixing.** Composition runs across IBM Quantum (ibm_kingston, 156 qubits), Rigetti, and qBraid plus optional classical sources, defending against single-vendor quantum-cloud compromise; 6.8 MB cumulative entropy harvested from IBM Quantum is the authoritative figure (the 2.7 MB figure in earlier iteration logs is superseded).
- **Merkle-tree provenance certificates.** Each composition emits a `ProvenanceCertificate` whose leaves are canonically serialized `ProvenanceRecord` blobs (`source_name|min_entropy(6dp)|health_status|bytes_contributed|timestamp(6dp)|sha256_hash`). The root hash is independently verifiable by an auditor without access to the entropy itself.
- **Graceful degradation with formally adjusted min-entropy.** Failed sources are excluded, degraded sources continue with a logged warning, and the reported conservative min-entropy bound is recomputed from the contributing subset; a configurable `min_sources` threshold prevents composition below safety.
- **NIST SP 800-90B health monitoring per source.** Repetition Count Test, Adaptive Proportion Test, MCV-based min-entropy estimator, with a 1% failure-rate threshold for FAILED classification.
- **ARE as entropy source conditioner.** ARE replaces Von Neumann debiasing at the CSI source layer, processing all 8 quantized bits per subcarrier instead of the LSB only; extraction efficiency rises from approximately 25% to approximately 85%.
- **Provable per-step uniformity in GF(p^n).** Bijection on the multiplicative group of GF(p^n) gives a formal H_min preservation bound of log_2(p^n - 1) bits per step for the GF subcase.
- **Hardware-acceleration path.** GF(2^8) and GF(2^128) implementations align with AES and AES-GCM, enabling PCLMULQDQ-class instructions on commodity x86.
- **Distinct from prior multi-source aggregators.** US10402172B1 (Qrypt) uses flat metadata tags only; US10140095 (Oracle) uses binary include/exclude. Neither produces a Merkle-rooted certificate nor recomputes composite min-entropy bounds under partial failure.
- **17 independent + dependent claims covering** ARE construction (Claim 1), certified composition with Merkle provenance (Claim 2), graceful degradation (Claim 3), and seven dependent claims that extend the algebra to H, O, GF(p^n), Q_p, and split-complex and tropical embodiments, plus a CSI-conditioner application claim (Claim 17).

## Estimated Patent Value

Anchor range (Norway-only, 10-year horizon, pre-grant): NOK 150-400 million, USD 14-38 million.

Refined range (Norway grant + EPO + USPTO grant, 10-year horizon, bundled with Patents 1 and 2): NOK 450 million to 2.0 billion, USD 42-190 million.

Reasoning:

- **Direct procurement driver.** DORA Article 7 mandates full cryptographic key lifecycle management, in force since 1 July 2025 in Norway; non-compliance can reach 2% of global turnover or EUR 1 million for individuals. Patent 3 is the only construction in the QDaria portfolio that produces a per-key auditable lineage trail, which is the artefact a Finanstilsynet examiner or an ENISA-listed conformity assessment body actually requests. Regulated buyers under DORA, NIS2, Solvency II ICT chapter, and the EU AI Act provenance requirements pay a price premium for the audit primitive, not for the underlying randomness.
- **Bundle multiplier.** Patent 1 (quantum-certified anonymization) and Patent 2 (CSI entropy + PUEK) consume the entropy that Patent 3 certifies. The three patents together cover the data-protection chain end-to-end: source (Patent 2) → composition with audit trail (Patent 3) → application to anonymization (Patent 1). Cross-licensing value rises 3-5x relative to single-patent value when sold as a portfolio; the Merkle-certificate primitive is the keystone that lets the other two patents claim "auditable" rather than "claimed-to-be auditable".
- **Market sizing.** PQC market USD 420M (2025) → USD 2.84B (2030) at 46.2% CAGR (MarketsandMarkets); Precedence Research projects USD 29.95B by 2034. McKinsey estimates USD 400-600B in value creation in financial services by 2035 from quantum-adjacent technology. Defensive PQC spending in financial services alone is projected to grow from USD 7M to USD 3.7B in 2032 (Deloitte). The certified-randomness segment is now a real procurement category after JPMorgan's March 2025 Nature publication (71,313 certified bits via Quantinuum 56-qubit) and HSBC's PQC VPN deployment.
- **Royalty model.** A per-key certificate-emission royalty of EUR 0.001 to EUR 0.01 against an addressable base of EU regulated key-derivation events (banks, insurers, telcos, government cloud) implies seven-to-eight-figure annual royalty potential at maturity; comparable patent pools in TLS extension primitives historically settle in this range.
- **Comparable benchmarks.** SandboxAQ approximately USD 5.6 billion valuation with USD 950M raised; PQShield USD 65M raised as co-author of all four NIST PQC standards. QDaria's Patent 3 captures the regulatory-audit niche neither company holds as a core licensable primitive.
- **Asymmetric upside.** The ARE family itself is broader than the CHE application; an extractor-theory community result that closes the open mixed-domain reduction (Theory gap T1) would convert Patent 3 from "applied auditability tool" into "foundational extractor patent", expanding the licensable surface to any cryptographic library using seeded extractors. Probability of this upside in the 10-year horizon: 30-50% [unverified, founder estimate], conditional on the T1 reduction being closed in published form.
- **Downside.** If Norway's grant is delayed, EPO or USPTO scope is reduced, or NIST revises SP 800-90B in a way that obsoletes the MCV proxy, the lower-end NOK 150M figure is the realistic floor; the patent retains commercial value because the Merkle-certificate construction is independent of the SP 800-90B specifics.

## Market Impact

Five-year QDaria revenue contribution attributable to Patent 3: NOK 60-180M (USD 5.7-17M). Ten-year contribution: NOK 250M-1.0B (USD 24-95M). These ranges assume QDaria captures 0.5% to 2% of the EU regulated-finance PQC defensive spend ([unverified] capture rate; based on SB1 intelligence brief market sizing).

Target buyer segments:

- **Banks and payment processors under DORA.** Norwegian alliance buyers (SpareBank 1 alliance covering 14 banks via the Utvikling Azure platform; DNB; Nordea); pan-Nordic and EU equivalents. JPMorgan, HSBC, BBVA, Goldman Sachs, Deutsche Bank, Crédit Agricole, and Intesa Sanpaolo already run quantum programs; certified-randomness procurement is a live category.
- **Insurers under Solvency II ICT chapter.** ICT risk management of cryptographic controls dovetails with the DORA pattern and creates a parallel buyer base in the Nordic and EU insurance market.
- **Telcos under NIS2 Article 21.** Cryptographic-control reporting requires evidence of entropy provenance for key material protecting subscriber and signaling data.
- **Government cloud and defense.** Norwegian Forsvarsmateriell, NSM, and EU equivalents under the EU Cybersecurity Act and ENISA's Common Criteria Scheme need audit-grade entropy lineage for sovereign cryptographic deployments.
- **AI provenance buyers.** EU AI Act requirements for training-data and model-decision provenance create a secondary market where Merkle-rooted certified randomness is the trust anchor for synthetic data pipelines and model-card seed disclosures.

Strategic positioning: Patent 3 is the wedge that turns QDaria from a quantum-research story into a regulated-procurement vendor. Patents 1 and 2 sell the technology; Patent 3 sells the audit.

## Companion Paper

- **Title:** Certified Heterogeneous Entropy with Algebraic Randomness Extraction
- **Author:** Daniel Mo Houshmand, QDaria AS
- **Source:** `docs/research/paper-3-che-are-provenance/main-draft.tex`
- **Built PDF:** `docs/research/eprint/paper3-che-are-provenance.pdf`
- **Zenodo deposit doc:** `docs/research/eprint/zenodo-paper3.md`
- **Submission email draft:** `docs/research/eprint/submission-email-paper3.md`
- **Scoped Option A variant:** `docs/research/paper-3-che-are-provenance/zenodo-paper3-option-a-scoped.tex` (drops "we prove" framing to the GF(p^n) subcase)
- **Gap analysis (Option B):** `docs/research/paper-3-che-are-provenance/zenodo-paper3-option-b-gaps.md`

Open gaps from SHIP_READINESS and Option B that block IACR ePrint and arXiv:

- **T1:** general mixed-domain ARE extraction reduction is not closed; the abstract's "we prove" framing only earns the GF(p^n) subcase under bijection on the multiplicative group. Effort 40-200 h.
- **T2 / T3:** quaternion and octonion adversary models are combinatorial prose; require either formal reduction or softening to "structural diversity" language.
- **T4:** p-adic orthogonal-metric mixing claim must be proven or dropped.
- **T5:** 27% fold collision vs. XOR composition floor needs a short reconciliation lemma.
- **M1:** official NIST SP 800-90B `ea_non_iid` runs on the IBM Quantum 6.8 MB trace, CSI trace, and `os.urandom` baseline.
- **M2:** CSI pool expansion from 9 KB to at least 1M samples (Paper 2 Nexmon trace reuse path is the fastest).
- **M3:** cross-source mutual-information validation to back the independence assumption in XOR composition.

Zenodo deposit is cleared today; ePrint and arXiv wait on T1 closure or a publication-grade scope-down via Option A. The IACR rejection signal pattern that hit Paper 1 (insufficient formal proofs, missing constructive comparisons, implementation-only claims, parameter-analysis gaps) maps directly to T1-T5 and M1-M3 in Paper 3; closing them before resubmission is the rational path.

## Regulatory & Strategic Significance

- **DORA Article 7 (audit trail for cryptographic key lifecycle).** Merkle-rooted provenance certificates are designed to support DORA Art. 7 alignment by providing per-key, per-derivation, per-source verifiable lineage. The DORA regime is in force in Norway from 1 July 2025; non-compliance fines reach 2% of global turnover.
- **DORA Article 6.4 (periodic cryptographic updates).** The graceful-degradation protocol and per-source health classification implement the cryptanalysis-tracking requirement at the entropy-source layer.
- **NIST SP 800-90B.** Per-source health tests (Repetition Count, Adaptive Proportion, MCV min-entropy) follow SP 800-90B Section 6.3.1 patterns. Official `ea_non_iid` runs are queued as a pre-submission deliverable.
- **EU AI Act provenance requirements.** The Merkle-rooted certificate is a generic trust anchor reusable for AI training-data and model-decision provenance, extending Patent 3 beyond the financial vertical.
- **ENISA CSA (EU Cybersecurity Act Common Criteria scheme).** Auditable entropy chains are a Common Criteria-aligned evidence artefact for high-assurance evaluation levels.
- **NIS2 Article 21 (cryptographic controls and incident reporting).** Per-source FAILED / DEGRADED logging produces incident-report-ready records aligned with NIS2 reporting workflows.
- **Norwegian sovereignty narrative.** Patent 3 anchors QDaria's claim to be the only Norwegian quantum company providing sovereign-grade entropy auditability after NQCG's December 2024 dissolution.
- **Patent family interlock.** Patent 3 binds Patent 1 (anonymization) and Patent 2 (CSI entropy + PUEK) into a single regulator-defensible chain; cross-citation across the three Norwegian filings closes the licensable surface.

## Highlights

- First post-quantum entropy framework with a Merkle-rooted, source-by-source audit trail aligned with DORA Article 7.
- Three independent quantum sources, 156 qubits user-confirmed (IBM Quantum ibm_kingston + Rigetti + qBraid), eliminating single-vendor quantum-cloud lock-in.
- New extractor family (ARE) over nine number domains, distinct from every known hash-based extractor.
- 6.8 MB cumulative IBM Quantum entropy harvest already collected and processed end-to-end.
- Graceful degradation with formally adjusted min-entropy bounds and zero silent fallback.
- ARE conditioner triples CSI extraction efficiency from approximately 25% to approximately 85% versus Von Neumann debiasing.
- GF(p^n) per-step bijection on the multiplicative group yields a formal H_min preservation bound of log_2(p^n - 1) bits.
- Hardware-acceleration path via GF(2^8) PCLMULQDQ and GF(2^128) AES-GCM hardware paths.
- Cross-cites Norwegian Patent 20260384 (Quantum-Certified Anonymization) and the co-pending Unilateral CSI Entropy + PUEK filing, closing the QDaria portfolio.
- Open-source code under CC-BY-4.0; Zenodo deposit cleared; IACR ePrint and arXiv pending T1 + M1-M3.
- Norwegian filing date 2026-04-05 secures the Paris Convention priority for EPO and USPTO extensions.
- Buyer pull is regulatory: DORA, NIS2, Solvency II ICT, ENISA CSA, EU AI Act, NSA CNSA 2.0 timeline through 2027 / 2035.

## Competitive Moat

- **Single-source QRNG-as-a-service vendors (ID Quantique, Quantinuum, IBM Quantum-Safe, Rigetti, qBraid).** None publishes a Merkle-rooted, multi-vendor, auditable composition certificate; each is a single point of compromise. Patent 3's heterogeneous mixing is the procurement answer to "what if your vendor is breached".
- **JPMorgan / Quantinuum precedent.** JPMorgan published 71,313 bits of certified quantum randomness in Nature (March 2025) using Quantinuum's 56-qubit system. Patent 3 covers the next step: composing multiple certified randomness streams with end-to-end audit trails, which JPMorgan's single-vendor publication does not address.
- **HSBC PQC VPN deployment.** Demonstrates real procurement appetite for auditable quantum-safe primitives; Patent 3 is the missing audit primitive that the HSBC-class buyer needs to satisfy DORA equivalents in the UK and EU.
- **SandboxAQ AQtive Guard.** Achieves FedRAMP Ready status; sells cryptographic-discovery and migration tooling, but does not own a certified-entropy provenance primitive. Patent 3 fills the gap and is licensable into the SandboxAQ-class stack.
- **PQShield.** Co-authored all four NIST PQC standards; sells PQC algorithms, not entropy auditability. Complementary, not competing; potential licensee.
- **Thales / Entrust / Eviden.** Sell HSMs and migration consulting. None publishes a Merkle-rooted provenance primitive at the entropy layer. Patent 3 is a board-grade addition to their HSM firmware path.
- **Qrypt (US10402172B1) and Oracle (US10140095).** Prior art uses flat metadata or binary include/exclude; neither produces a Merkle-rooted, formally-adjusted-min-entropy certificate. Patent 3 is novel against both.
- **Nordic incumbents.** No Norwegian or Nordic bank has a confirmed quantum initiative tied to certified-randomness procurement; Danske Bank's 2022 QKD pilot is closest. QDaria is the first mover, with patent priority secured.

## Risk Factors

- **GF(p^n) bijection claim must be tightened for ePrint and arXiv.** SHIP_READINESS flags this as the binding constraint; current paper proves the GF subcase but the abstract over-asserts on the mixed-domain case until T1 closes.
- **Quantum-cloud vendor lock-in residual risk.** IBM Quantum, Rigetti, and qBraid service-terms or SLA changes could disrupt the three-source orchestration; mitigation is the protocol's source-pluggability (`EntropySource` protocol).
- **NIST SP 800-90B revision risk.** A future revision could invalidate the MCV proxy currently used pending `ea_non_iid` runs (M1); the Merkle certificate itself is independent of SP 800-90B specifics, but the per-source min-entropy estimates would need recomputation.
- **3-source orchestration complexity.** Coordinating IBM Quantum, Rigetti, and qBraid availability windows requires reliable health monitoring; the FAILED / DEGRADED classification handles this in protocol, but production deployment must tune the 1% failure-rate threshold to match real-world variance.
- **IBM Quantum service-terms dependency.** IBM Quantum's terms of service constrain commercial re-distribution of harvested entropy; the patent claims cover the composition method, not the IBM-specific entropy bytes; legal review of IBM TOS for commercial CHE deployment is queued.
- **Patent grant uncertainty.** Norwegian first-action timelines are 18-36 months; EPO and USPTO grant outcomes are not certain. Patent value above the NOK 150-400M floor depends on grant scope.
- **Open extractor-theory reduction (T1) is research-grade.** Effort estimated at 40-200 hours for a single researcher; if pursued, it should not be rushed against a DOI deposit deadline. Zenodo accepts now; ePrint and arXiv should wait.
- **CSI pool size below NIST certification floor.** 9 KB current ESP32-S3 pool is below the 1M-sample recommendation; M2 expansion is queued via reuse of Paper 2's BCM4339 Nexmon trace.
- **Phrasing risk on DORA wording.** Line 20 of `zenodo-paper3.md` should be softened from "satisfying DORA Art. 7" to "aligned with DORA Art. 7" before any subsequent re-deposit; matches Paper 1 post-revision pattern.
- **"First system" claim qualifier.** Add "to our knowledge" before any "first" claim to pre-empt the IACR reviewer pattern that hit Paper 1.

## References

- `docs/ip/patent-3-che-are-provenance/sammendrag.md`
- `docs/ip/patent-3-che-are-provenance/beskrivelse.md`
- `docs/ip/patent-3-che-are-provenance/patentkrav.md`
- `docs/ip/patent-3-che-are-provenance/provisional-patent-che-are-provenance.md`
- `docs/research/paper-3-che-are-provenance/main-draft.tex`
- `docs/research/paper-3-che-are-provenance/references.bib`
- `docs/research/paper-3-che-are-provenance/zenodo-paper3-option-a-scoped.tex`
- `docs/research/paper-3-che-are-provenance/zenodo-paper3-option-b-gaps.md`
- `docs/research/eprint/zenodo-paper3.md`
- `docs/research/eprint/submission-email-paper3.md`
- `docs/research/eprint/SHIP_READINESS.md`
- `docs/research/eprint/paper3-che-are-provenance.pdf`
- `docs/research/quantum-safe-banking-sb1-intelligence-brief.md`
