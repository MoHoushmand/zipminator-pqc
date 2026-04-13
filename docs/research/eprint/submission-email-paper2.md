**To:** eprint-editor@iacr.org
**Subject:** IACR ePrint submission: Unilateral WiFi CSI as a NIST-Validated Entropy Source

Dear Editors,

I am submitting the attached paper for publication in the IACR Cryptology ePrint Archive.

**Title:** Unilateral WiFi CSI as a NIST-Validated Entropy Source: From Bilateral Key Agreement to Single-Device Randomness

**Author:** Daniel Mo Houshmand, QDaria Quantum Research, Oslo, Norway (ORCID: 0009-0008-2270-5454)

**Category:** Implementation

**Summary of contributions:**

1. First system, measurement, and NIST SP 800-90B validation of WiFi Channel State Information (CSI) as a *unilateral* entropy source. All prior CSI-based cryptographic work requires two cooperating endpoints exploiting channel reciprocity for bilateral key agreement. This paper shows that a single device passively measuring ambient CSI can harvest genuine physical randomness with no cooperating partner.

2. Empirical extraction pipeline (phase LSB + Von Neumann debiasing) over the public Gi-z/CSI-Data corpus (TU Darmstadt Nexmon captures, Broadcom BCM4339), producing 2,690 bytes of entropy at 24.5% extraction ratio. NIST SP 800-90B ea_non_iid assessment yields a final min-entropy of 5.50 bits/byte (MCV estimator, 99% confidence), benchmarked against IBM Quantum (6.35) and os.urandom (6.36).

3. Introduction of the **Physical Unclonable Environment Key (PUEK)**: a construction that derives location-locked cryptographic keys from the SVD eigenstructure of CSI measurements, with security profiles parameterized by a decorrelation threshold tau in [0.75, 0.98]. Formal indistinguishability game and proof sketch under a spatial decorrelation assumption are included.

4. Hardware-agnostic reference implementation on a \$5 ESP32-S3, producing 45 to 90 MB of entropy per month at zero marginal cost.

**Prior IP:** Norwegian patent application filed with Patentstyret on 2026-04-04 (priority date secured under Paris Convention).

**Open source:** https://github.com/QDaria/unilateral-csi-entropy

**License:** CC-BY

Metadata for the submission form is in `docs/research/eprint/submission-fields.txt` (section "PAPER 2"). The PDF is `docs/research/eprint/paper2-csi-entropy-puek.pdf`.

Please let me know if any additional information is required.

Best regards,
Daniel Mo Houshmand
QDaria Quantum Research, Oslo, Norway
mo@qdaria.com
ORCID: 0009-0008-2270-5454
