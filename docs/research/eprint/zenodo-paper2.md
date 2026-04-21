# Zenodo deposit: Paper 2

Upload at https://zenodo.org/uploads/new. File to attach: `paper2-csi-entropy-puek.pdf`.

## Form fields (copy-paste)

**Upload type:** Publication
**Publication type:** Preprint
**Publication date:** 2026-04-13
**Title:** Unilateral WiFi CSI as a NIST-Validated Entropy Source: From Bilateral Key Agreement to Single-Device Randomness

**Authors:**
- Family name: Houshmand
- Given names: Daniel Mo
- Affiliation: QDaria AS, Oslo, Norway
- ORCID: 0009-0008-2270-5454

**Description:**

> All prior cryptographic use of WiFi Channel State Information (CSI) requires two cooperating endpoints exploiting channel reciprocity for bilateral key agreement. We present the first system, measurement, and NIST SP 800-90B validation of WiFi CSI as a unilateral entropy source: a single device passively measuring ambient CSI can harvest genuine physical randomness with no cooperating partner. Using a phase-LSB + Von Neumann debiasing pipeline over the public Gi-z/CSI-Data corpus (343 Nexmon frames, Broadcom BCM4339), we extract 2,690 bytes of entropy at 24.5% extraction ratio and achieve a final min-entropy of 5.50 bits/byte (ea_non_iid MCV estimator, 99% confidence), benchmarked against IBM Quantum (6.35) and os.urandom (6.36). We introduce the Physical Unclonable Environment Key (PUEK), which derives location-locked cryptographic keys from the SVD eigenstructure of CSI measurements, with security profiles parameterized by a decorrelation threshold tau in [0.75, 0.98]. A hardware-agnostic reference implementation on a 5 USD ESP32-S3 produces 45 to 90 MB of entropy per month at zero marginal cost.

**Additional notes:**

> Norwegian patent application filed with Patentstyret on 2026-04-04. Priority date secured under the Paris Convention. Open-source extraction pipeline available on GitHub.

**Keywords:**
WiFi CSI; entropy source; NIST SP 800-90B; unilateral randomness; Physical Unclonable Environment Key; PUEK; post-quantum cryptography; IoT security; Nexmon; Von Neumann debiasing

**Language:** English
**License:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
**Access right:** Open Access

**Related identifiers:**
- `https://github.com/MoHoushmand/zipminator-pqc`, Software, `isSupplementedBy`
- `https://github.com/seemoo-lab/nexmon_csi`, Software, `references` (tooling used)
- `https://orcid.org/0009-0008-2270-5454`, Other, `isIdentifiedBy`

**Communities (optional):** open-science

## Optional supplementary files

If you want to bundle the reproducibility pack:
- `extraction_pipeline.py` (from `crates/zipminator-mesh/` or equivalent)
- README with the exact Gi-z commit hash and the 343-frame slice used
- `ea_non_iid_report.txt` (NIST tool output)

Zenodo allows multiple files per deposit. All count toward one DOI.
