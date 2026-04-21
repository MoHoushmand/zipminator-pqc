# Zenodo deposit: Paper 3

Upload at https://zenodo.org/uploads/new. File to attach: `paper3-che-are-provenance.pdf`.

## Form fields (copy-paste)

**Upload type:** Publication
**Publication type:** Preprint
**Publication date:** 2026-04-13
**Title:** Certified Heterogeneous Entropy with Algebraic Randomness Extraction

**Authors:**
- Family name: Houshmand
- Given names: Daniel Mo
- Affiliation: QDaria AS, Oslo, Norway
- ORCID: 0009-0008-2270-5454

**Description:**

> We introduce Algebraic Randomness Extraction (ARE), a new family of seeded extractors parameterized by algebraic programs over bounded number domains with six arithmetic operations, generated deterministically from SHAKE-256. The core construction operates over five classical domains (N_n, Z_n, Q_n, R_n, C_n) and extends to quaternions (non-commutative), octonions (non-associative), finite fields GF(p^n) with provable per-step uniformity, and p-adic numbers. We build the Certified Heterogeneous Entropy (CHE) framework: a composition protocol that XOR-fuses entropy from independent sources (quantum hardware, WiFi CSI, OS RNG) while producing Merkle-tree provenance certificates that prove per-source contribution, with graceful degradation that adjusts the min-entropy estimate without silent fallback. We prove that GF-domain steps preserve min-entropy exactly via bijection on the multiplicative group, and demonstrate empirically that the two-layer architecture (algebraic fold + SHA-256 expansion) provides defense-in-depth extraction distinct from hash-only approaches. The end-to-end pipeline processes 6.8 MB of IBM Quantum entropy (ibm_kingston, 156 qubits), WiFi CSI from ESP32-S3 hardware, and OS entropy. Provenance certificates provide an audit trail satisfying DORA Art. 7 requirements for cryptographic key lifecycle management in EU-regulated financial institutions.

**Additional notes:**

> Norwegian patent application filed with Patentstyret on 2026-04-05. Priority date secured under the Paris Convention. Related Norwegian application No. 20260384 (filed 2026-03-24) covers the quantum anonymization layer that consumes entropy from this framework.

**Keywords:**
randomness extraction; certified randomness; Merkle tree provenance; heterogeneous entropy; algebraic extractor; finite field GF(p^n); quaternions; octonions; p-adic; min-entropy; NIST SP 800-90B; DORA Article 7; post-quantum cryptography

**Language:** English
**License:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
**Access right:** Open Access

**Related identifiers:**
- `https://github.com/MoHoushmand/zipminator-pqc`, Software, `isSupplementedBy`
- `https://orcid.org/0009-0008-2270-5454`, Other, `isIdentifiedBy`

**Communities (optional):** open-science
