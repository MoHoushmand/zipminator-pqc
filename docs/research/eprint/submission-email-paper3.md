**To:** eprint-editor@iacr.org
**Subject:** IACR ePrint submission: Certified Heterogeneous Entropy with Algebraic Randomness Extraction

Dear Editors,

I am submitting the attached paper for publication in the IACR Cryptology ePrint Archive.

**Title:** Certified Heterogeneous Entropy with Algebraic Randomness Extraction

**Author:** Daniel Mo Houshmand, QDaria Quantum Research, Oslo, Norway (ORCID: 0009-0008-2270-5454)

**Category:** Foundations

**Summary of contributions:**

1. **Algebraic Randomness Extraction (ARE):** a new family of seeded extractors parameterized by algebraic programs over bounded number domains with six arithmetic operations, generated deterministically from SHAKE-256. The core construction operates over five classical domains (N_n, Z_n, Q_n, R_n, C_n) and extends to quaternions (H, non-commutative), octonions (O, non-associative), finite fields GF(p^n) with provable per-step uniformity, and p-adic numbers.

2. **Certified Heterogeneous Entropy (CHE) framework:** a composition protocol that XOR-fuses entropy from independent sources (quantum hardware, WiFi CSI, OS RNG) while building Merkle-tree provenance certificates that prove per-source contribution. The framework degrades gracefully when individual sources fail, maintaining accurate min-entropy bounds without silent fallback.

3. **Formal results:** proof that GF-domain steps preserve min-entropy exactly (bijection on the multiplicative group), and empirical demonstration that the two-layer architecture (algebraic fold + SHA-256 expansion) provides defense-in-depth extraction distinct from hash-only approaches.

4. **Implementation and validation:** end-to-end pipeline processing 6.8 MB of IBM Quantum entropy (ibm_kingston, 156 qubits), WiFi CSI entropy from ESP32-S3 hardware, and OS entropy. NIST SP 800-90B testing validates output quality. Provenance certificates provide an audit trail that satisfies DORA Art. 7 requirements for cryptographic key lifecycle management in EU-regulated financial institutions.

**Prior IP:** Norwegian patent application filed with Patentstyret on 2026-04-05 (priority date secured under Paris Convention). Related Norwegian application No. 20260384 (filed 2026-03-24) covers the quantum anonymization layer that consumes entropy from this framework.

**Open source:** https://github.com/QDaria/certified-heterogeneous-entropy

**License:** CC-BY

Metadata for the submission form is in `docs/research/eprint/submission-fields.txt` (section "PAPER 3"). The PDF is `docs/research/eprint/paper3-che-are-provenance.pdf`.

Please let me know if any additional information is required.

Best regards,
Daniel Mo Houshmand
QDaria Quantum Research, Oslo, Norway
mo@qdaria.com
ORCID: 0009-0008-2270-5454
