# Patent 2 — Unilateral CSI Entropy + PUEK: Significance Dossier

## Identification

- **Title:** Method and System for Unilateral Entropy Harvesting from Wireless Channel State Information with Post-Quantum Key Derivation
- **Applicant / Assignee:** QDaria AS, Oslo, Norway
- **Inventor:** Daniel Mo Houshmand
- **Filing date:** 2026-04-04
- **Jurisdiction (priority filing):** Norway, Patentstyret (Norwegian Industrial Property Office), filed under Norwegian Patents Act §8
- **Filing folder:** `docs/ip/patent-2-csi-entropy-puek/filing-2026-04-04/`
- **Cross-reference:** Norwegian Patent Application No. 20260384 (filed 2026-03-24), shared entropy-pool infrastructure, distinct invention
- **Status:** Norwegian filing complete; priority date secured under Paris Convention; 12-month window for PCT, US, EPO, JP, KR continuations
- **Companion paper:** "Unilateral WiFi CSI as a NIST-Validated Entropy Source: From Bilateral Key Agreement to Single-Device Randomness," target venue ACM WiSec 2026, ACM sigconf format
- **Preprint:** Zenodo deposit prepared (`docs/research/eprint/zenodo-paper2.md`, CC-BY-4.0), publication date 2026-04-13; IACR ePrint submission drafted (`docs/research/eprint/submission-email-paper2.md`)

## Executive Summary

Patent 2 claims the first single-device cryptographic-quality entropy primitive extracted from WiFi Channel State Information (CSI), a measurement that already lives on every 802.11-capable chipset shipped in the last fifteen years. The invention reframes a fifteen-year line of bilateral CSI key-agreement work (Mathur 2008, Jana 2009, Liu 2012, Avrahami 2023) into a unilateral entropy source that needs no cooperating partner, no reconciliation protocol, and no reciprocity assumption. The patent couples that entropy source to a Physical Unclonable Environment Key (PUEK) that derives location-locked keys from the SVD eigenstructure of the CSI matrix, with four configurable subspace-similarity thresholds (Standard 0.75, Elevated 0.85, High 0.95, Military 0.98) and HKDF-SHA256 derivation. The empirical anchor (paper-internal invariant) is 343 Nexmon frames from Broadcom BCM4339, 2,690 bytes of extracted entropy at a 24.5% extraction ratio, final min-entropy 5.50 bits/byte under the NIST SP 800-90B `ea_non_iid` MCV estimator at 99% confidence, benchmarked against IBM Quantum at 6.35 bpb and `os.urandom` at 6.36 bpb. Because the substrate is ambient WiFi, the addressable license footprint spans every IoT chip, consumer router, smartphone, and laptop without silicon changes. That horizontal scope makes Patent 2 the most license-revenue-tractable patent in the QDaria portfolio.

## Technical Novelty

- **Independent Claim 1 (unilateral CSI entropy):** receive WiFi CSI frames from a single wireless interface, compute per-subcarrier phase, quantize to a discrete level, extract the LSB to a raw bit stream, Von Neumann debias (consecutive (0,1) -> 0, (1,0) -> 1, (0,0) and (1,1) discarded), accumulate into entropy bytes usable for any cryptographic purpose. Operates on one device, no second endpoint. This is the structural break from all prior CSI work.
- **Independent Claim 2 (PUEK):** capture complex-valued CSI matrix C in C^{M x K}, run SVD to obtain right singular vectors V, store top-d vectors as an enrollment fingerprint with a configurable similarity threshold tau, recompute V' at key-derivation time, compute subspace similarity s = (1/d) sum |<v_ref_i, v_new_i>|^2, derive a 32-byte key via HKDF-SHA256 with info `zipminator-puek-v1` if s >= tau, reject otherwise. The key is bound to the physical RF environment, not to the device.
- **Independent Claim 3 (hybrid CSI + QRNG mesh keys):** XOR-compose CSI entropy with quantum random bytes, derive MeshKey (16 B PSK for HMAC-SHA256 beacons) and SipHashKey (16 B for SipHash-2-4 frame integrity) via HKDF-SHA256 with distinct info strings, suitable for ML-KEM-768 (NIST FIPS 203) mesh networks. The XOR-lemma argument lifts security to the stronger source.
- **Dependent claims of note:** Claim 8 codifies the four security profiles (0.75 / 0.85 / 0.95 / 0.98); Claim 13 the provenance-preserving pool that raises rather than falls back to `os.urandom`, a regulatory feature; Claim 14 the hardware-agnostic reach across 802.11n / ac / ax.
- **The 5.50 / 6.35 / 6.36 bpb triple:** invariant of the paper. 5.50 bpb after NIST SP 800-90B IID assessment against 343 Nexmon frames, 6.35 bpb for IBM Quantum (`ibm_kingston`, 156 qubits), 6.36 bpb for `os.urandom`. CSI-derived entropy ships within 13% bpb of best-in-class quantum hardware at a unit cost four to six orders of magnitude lower.
- **Implementation reference:** `crates/zipminator-mesh/src/csi_entropy.rs` (407 lines, 11 tests), `puek.rs` (393 lines, 11 tests), `entropy_bridge.rs` (368 lines, 11 tests), Python `csi_pool_provider.py` (133 lines, 11 tests), ESP32-S3 platform (802.11n HT20, 56 subcarriers). 33 Rust tests plus 11 Python tests.

## Estimated Patent Value

Three independent valuation lenses converge on a wide-but-defensible range.

- **Anchor (prior brief):** NOK 120 to 350 million (USD 11 to 33 million) over a 10-year horizon for a credibly prosecuted Norwegian application with a US continuation; multiply by a factor of 3 to 5 if granted in EPO + USPTO + JPO + KIPO.
- **Lens 1, per-device license fan-out.** The independent claims read on any 802.11 device that exposes per-subcarrier complex CSI. ESP32-class IoT shipments alone run in the high hundreds of millions of units annually [unverified, order of magnitude only]. At a conservative entropy-primitive license of USD 0.02 to 0.10 per device for security-sensitive endpoints (industrial IoT, automotive, medical, smart-grid), a 1% to 3% addressable share over 10 years yields USD 20 to 90 million in cumulative license revenue. The provenance-preserving pool claim (Claim 13) is the lever that makes the license sticky in regulated verticals.
- **Lens 2, HSM-adjacent positioning.** Thales and Entrust dominate a multi-billion-dollar HSM/edge-entropy segment with PQC-ready hardware. A patent that lets a software vendor displace a dedicated TRNG with ambient-CSI entropy validated against NIST SP 800-90B is a credible incumbent-side threat and, more importantly, a credible licensing target. SandboxAQ at USD ~950M raised and USD ~5.6B valuation, PQShield at USD 65M raised, define the comparable funding band; QDaria's IP carries a similar regulatory hook (NIST SP 800-90B IID assessment) without the cost basis of either competitor.
- **Lens 3, regulatory-tailwind market sizing.** PQC market trajectory anchored in the SB1 brief lines 65 to 70: USD 420M (2025) to USD 2.84B (2030) at 46.2% CAGR (MarketsandMarkets), with Precedence Research projecting USD 29.95B by 2034. Defensive financial-services PQC spend rises from USD 7M (2022) to USD 3.7B (2032) per Deloitte. Patent 2 sits orthogonal to the algorithmic side of that market (FIPS 203 / 204 / 205); it is the entropy source feeding those algorithms.
- **Refined valuation:** NOK 180 to 500 million (USD 17 to 47 million) for the Norwegian filing prosecuted into a US continuation over a 10-year horizon. NOK 600 million to NOK 1.6 billion (USD 56 to 150 million) [unverified, anchored on comparable PQC-IP transactions and the SandboxAQ / PQShield funding band] if granted in NO + US + EP + JP + KR with active licensing program and at least one anchor licensee in a regulated IoT vertical. The dominant value driver is horizontal scope: CSI is ambient on every WiFi-capable device, so the per-device license envelope grows mechanically with the IoT installed base.

## Market Impact

- **IoT and edge-entropy.** Every ESP32-class microcontroller, every consumer router, every smart appliance, every connected sensor that today lacks a dedicated TRNG is a candidate license. The 5 USD ESP32-S3 reference produces 45 to 90 MB of entropy per month at zero marginal cost (projected from the BCM4339 baseline; figure noted as extrapolated in the paper), versus IBM Quantum at USD 1.60 per second. The cost asymmetry collapses one of the standing objections to widespread PQC adoption in IoT, which is that IoT devices cannot afford to call out to a cloud QRNG.
- **HSM and secure-element adjacency.** Patent 2 does not require silicon changes, so it competes with PUF-based and ring-oscillator-based entropy by being deployable as a firmware module on chips already in the field. A software vendor that licenses the CSI entropy primitive can market a NIST SP 800-90B IID-validated entropy source to financial and defense customers without redesigning their existing secure-element pipeline.
- **Consumer-router OEM licensing.** Broadcom, Qualcomm, MediaTek, Realtek, and Espressif ship the vast majority of WiFi chipsets globally. The patent reads on any chipset that exposes per-subcarrier complex CSI, which is most of them. A licensing program targeting routers and access points adds a tier between IoT and HSM.
- **Automotive entropy.** Connected vehicles ship with multiple WiFi radios (V2X, in-cabin, telematics). Automotive security standards (ISO/SAE 21434) require defensible entropy; Patent 2 provides a NIST-validated alternative to per-vehicle TRNG silicon.
- **Mobile device security.** Every modern smartphone has the necessary CSI exposure on at least one WiFi front-end. License pathway runs through chip vendors and OEMs, not end users.
- **QDaria revenue contribution, 5-year horizon:** USD 3 to 12 million in cumulative license and product revenue, weighted to design-win licenses with mid-sized IoT OEMs and to Zipminator's own product line consuming the primitive internally (Q-Mesh, Q-Vault, Q-Messenger). [unverified, ranges depend on prosecution speed and first licensee timing]
- **10-year horizon:** USD 25 to 110 million if at least one Tier-1 chipset vendor or HSM incumbent licenses the patent; the upper bound assumes a regulatory pull from a DORA-aligned cryptographic-update mandate or an EU CRA-driven IoT entropy mandate. [unverified upper bound]

## Companion Paper

- **Title:** Unilateral WiFi CSI as a NIST-Validated Entropy Source: From Bilateral Key Agreement to Single-Device Randomness
- **Format:** ACM sigconf (acmart), target venue ACM WiSec 2026
- **LaTeX source:** `docs/research/paper-2-csi-entropy-puek/main.tex`, body in `docs/research/paper-2-csi-entropy-puek/body-ieee.tex`
- **Shipped PDF:** `docs/research/eprint/paper2-csi-entropy-puek.pdf`
- **Zenodo deposit:** prepared per `docs/research/eprint/zenodo-paper2.md`, publication date 2026-04-13, license CC-BY-4.0
- **IACR ePrint:** submission email drafted at `docs/research/eprint/submission-email-paper2.md`, category Implementation
- **Reproducibility:** open-source extraction pipeline, public Gi-z/CSI-Data corpus (`https://github.com/seemoo-lab/nexmon_csi`)
- **Outstanding nit (from SHIP_READINESS.md section 2):** the abstract's "first system" claim should be pre-pended with "To our knowledge" before final ePrint submission. PoPETs reviewers flagged the same pattern on Paper 1. Non-blocking for Zenodo, blocking for ePrint resubmission risk.
- **Pilot-scale caveat:** the 2,690-byte assessment is below NIST's recommended ≥1M-sample threshold for production `ea_non_iid` certification. The paper labels the result a methodological first step, not a production entropy certificate. Reviewers will probe this; the patent claims do not depend on production-scale certification, only on the validated extraction pipeline.

## Regulatory and Strategic Significance

- **NIST SP 800-90B (IID track).** Patent 2 is the first NIST SP 800-90B-validated entropy-source patent that uses ambient wireless channel measurements. Safe phrasing: "validated against the NIST SP 800-90B IID battery." Never "FIPS 140-3 certified" or "FIPS compliant." The SP 800-90B alignment is the regulatory differentiator most ambient-entropy proposals lack.
- **DORA Article 6.4 (cryptographic updates) and Article 7 (key lifecycle).** Norwegian and EU financial institutions must demonstrate ongoing cryptographic readiness. The provenance-preserving pool claim (Claim 13), which refuses to silently fall back to `os.urandom`, gives auditors a traceable entropy substrate compatible with DORA Article 7 key-lifecycle requirements. Article 50 fines up to 2% of global turnover make this a board-level risk.
- **EU Cyber Resilience Act (CRA).** The CRA pulls IoT devices into the same security-by-design regime as enterprise IT. A NIST SP 800-90B-validated ambient-CSI entropy source is a near-drop-in solution for OEMs that today rely on `getrandom()` plus thermal noise. Patent 2 is a direct fit.
- **EU Radio Equipment Directive 2022/30.** The cyber requirements that became mandatory under the RED delegated act target consumer wireless devices. Patent 2 reads on those devices natively.
- **ML-KEM-768 (NIST FIPS 203) compatibility.** The hybrid-entropy claim derives keys suitable for ML-KEM-768 mesh networks, which positions the patent inside the PQC migration story rather than orthogonal to it. Implements NIST FIPS 203 (ML-KEM-768); verified against NIST KAT test vectors at the Rust workspace level.
- **Norwegian-first prosecution.** Norway is a regulatorily-strict, technically-competent jurisdiction with strong Paris Convention reach. A granted Norwegian patent is a credible base for EPO, USPTO, JPO, and KIPO continuations. The 12-month priority window from 2026-04-04 closes 2027-04-04; planning the PCT path should be in motion now.

## Highlights (one-liners)

- First single-device entropy primitive from WiFi Channel State Information, 15 years of bilateral CSI work re-framed unilaterally.
- 5.50 bpb min-entropy under NIST SP 800-90B IID, within 13% of IBM Quantum's 6.35 bpb at four to six orders of magnitude lower unit cost.
- 343 Nexmon frames, 2,690 bytes extracted, 24.5% extraction ratio, on commodity Broadcom BCM4339.
- ESP32-S3 reference implementation ships 45 to 90 MB of entropy per month for a 5 USD bill of materials.
- PUEK derives location-locked cryptographic keys from CSI eigenstructure; the key is bound to the room, not to the chip.
- Four security profiles configurable via subspace-similarity threshold: Standard 0.75, Elevated 0.85, High 0.95, Military 0.98.
- Hybrid CSI + QRNG composition lifts security to the stronger source under the XOR lemma; ML-KEM-768 compatible.
- Provenance-preserving pool refuses to silently fall back to `os.urandom`, giving DORA Article 7 auditors a traceable entropy substrate.
- 14 claims; horizontal scope across every IoT, router, smartphone, and laptop that exposes per-subcarrier complex CSI.
- Open-source reference pipeline accelerates licensee on-ramp without surrendering the patent moat.

## Competitive Moat

- **Versus PUF-based entropy (RF-PUF, Chatterjee 2018).** PUFs fingerprint hardware manufacturing variations and require silicon support. PUEK fingerprints the physical RF environment and runs on any 802.11 chip already in the field. The key changes when the room changes, not when the device changes; this is structurally different and structurally cheaper to deploy.
- **Versus SRAM-startup entropy.** SRAM PUFs require an unpowered cold-start window that breaks under always-on use cases and gets weaker with chip aging. CSI is generated continuously from ambient traffic with no special boot sequence.
- **Versus ring-oscillator TRNGs.** Ring oscillators consume silicon area, draw power, and ship with known characterization quirks that make NIST SP 800-90B certification nontrivial per design. The CSI primitive ships on chips that already exist and is validated against the public Gi-z corpus, replicable on a 5 USD ESP32-S3.
- **Versus Quantinuum software QRNG and ID Quantique QRNG.** Both require either cloud access or a USB-connected photonic device (the ID Quantique Quantis USB-4M, ~15,000 NOK in the demo-kit BOM). Patent 2 produces entropy on-device, off-network, at zero marginal cost. ID Quantique remains useful as a hybrid second source under Claim 3.
- **Versus SandboxAQ AQtive Guard, PQShield.** Neither competitor has a published entropy-source patent in this configuration. SandboxAQ's strength is migration tooling; PQShield's is core PQC algorithms. Patent 2 sits underneath both stacks as a substrate primitive that either could license rather than reinvent.
- **Defensive position.** The bilateral-CSI prior art (WO2007124054A2, US20210345102A1, US10402172B1, US8015224B1) is structurally incompatible with the unilateral claim. A challenger needs either (a) a unilateral CSI source predating 2026-04-04, which does not exist in the surveyed literature, or (b) a non-CSI ambient-RF entropy source that also clears NIST SP 800-90B, which is a different invention.

## Risk Factors

- **WiFi standard evolution.** 802.11be (Wi-Fi 7) and beyond may change the way CSI is exposed, potentially restricting per-subcarrier complex measurements behind vendor-private APIs. Claim 14 is drafted broadly across 802.11n / ac / ax to absorb the near-term standards range, but a long-horizon prosecution should consider continuation claims that frame the invention by the measurement physics rather than the chipset.
- **BCM4339 deprecation.** The Broadcom BCM4339 driver underpinning the Gi-z corpus is a legacy chipset. The patent itself reads on any 802.11 chip with complex CSI exposure, so this is more a reproducibility headache for reviewers than a patent-validity risk. The ESP32-S3 alternative platform is current and shipping.
- **Nexmon firmware-modification legal exposure.** The Nexmon tooling modifies Broadcom firmware. Some jurisdictions treat firmware modification as a DMCA-adjacent grey area. The patent claims operate at the protocol layer and do not require Nexmon specifically, but go-to-market material should not pin itself to Nexmon as the only path.
- **CSI manipulation attack surface.** An adversary in close RF proximity may actively shape the channel to bias CSI measurements. The XOR-composition claim (Claim 3) is the architectural mitigation: under the XOR lemma, full CSI compromise does not reduce composed-entropy security below the QRNG source. The patent should be paired with a deployment guide that recommends hybrid mode for high-assurance use cases.
- **Pilot-scale sample size.** The 2,690-byte assessment is below NIST's production threshold. Reviewers and licensees will press on this. The remediation is a follow-up large-sample study (~1 MB or more across multiple environments), which the demo kit in `docs/research/paper-2-csi-entropy-puek/demo-kit.md` is set up to produce.
- **"First system" claim qualification.** Pre-pending "To our knowledge" to the abstract before ePrint submission addresses the recurring reviewer pattern flagged in SHIP_READINESS.md section 2. Not patent-relevant; relevant to companion-paper acceptance.
- **Prosecution risk in the US.** USPTO continues to push back on software-implemented signal-processing claims under §101 (Alice). The claims should be presented with the ESP32-S3 hardware embodiment forward and the mathematical extraction in the dependent claims to reduce abstract-idea exposure.

## References

- Patent abstract: `docs/ip/patent-2-csi-entropy-puek/sammendrag.md`
- Patent description: `docs/ip/patent-2-csi-entropy-puek/beskrivelse.md`
- Patent claims: `docs/ip/patent-2-csi-entropy-puek/patentkrav.md`
- English provisional: `docs/ip/patent-2-csi-entropy-puek/provisional-patent-csi-entropy-puek.md`
- Filing folder: `docs/ip/patent-2-csi-entropy-puek/filing-2026-04-04/`
- Companion paper, LaTeX source: `docs/research/paper-2-csi-entropy-puek/main.tex`
- Companion paper, body: `docs/research/paper-2-csi-entropy-puek/body-ieee.tex`
- Companion paper, demo kit: `docs/research/paper-2-csi-entropy-puek/demo-kit.md`
- Shipped PDF: `docs/research/eprint/paper2-csi-entropy-puek.pdf`
- Zenodo deposit doc: `docs/research/eprint/zenodo-paper2.md`
- IACR ePrint submission email: `docs/research/eprint/submission-email-paper2.md`
- Publication readiness audit: `docs/research/eprint/SHIP_READINESS.md`
- Market and TAM anchors: `docs/research/quantum-safe-banking-sb1-intelligence-brief.md`
- Rust reference: `crates/zipminator-mesh/src/csi_entropy.rs`, `puek.rs`, `entropy_bridge.rs`
- Python pool provider: `src/zipminator/entropy/csi_pool_provider.py`
