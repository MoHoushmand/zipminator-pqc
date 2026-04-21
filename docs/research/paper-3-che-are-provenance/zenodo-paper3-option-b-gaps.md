# Paper 3 Option B: Substance-Add Gap Checklist

Purpose: list what must happen for the current abstract's "we prove"
framing (and the full title "Certified Heterogeneous Entropy with
Algebraic Randomness Extraction") to be earned honestly, without a
scope-down.

Source of truth: `main-draft.tex` lines 802-806 (comparison table),
1298-1316 (Claim 1 + Remark: "A complete security reduction remains
open"), 1391-1430 (proven GF theorem), 1547-1572
(`tab:proven-vs-conjectured`).

If Mo chooses this path, the manuscript is NOT uploaded to Zenodo
until every item below is closed. Estimates are working-hour ranges
for a single researcher with existing access to the codebase,
Python env (`zip-pqc`), and IBM Quantum / ESP32-S3 hardware. Ranges
reflect real uncertainty; the longer end assumes a genuine proof
writeup, the shorter end assumes the argument is already sketched
and just needs formalizing.

---

## Theory gaps (proofs that must be written)

### T1. Mixed-domain ARE extraction reduction

- Current status: `\begin{claim}[ARE Pre-Conditioning, Informal]`,
  Remark says "A complete security reduction remains open."
- Required: a theorem of the form "for a random ARE program of `k`
  steps drawn from seed `s`, applied to source `X` with min-entropy
  `H_inf(X) >= alpha * n`, output is `epsilon`-close to uniform,"
  with a concrete reduction to a standard assumption (e.g., the
  leftover hash lemma composed with a bound on non-GF step loss,
  or a direct extractor argument).
- Blocker: non-GF steps (addition, subtraction, multiplication,
  division, modulo, power) over `N, Z, Q, R, C` do not have the
  GF bijection property. Zero-avoidance perturbation must be
  shown to not introduce exploitable structure.
- Effort: **40 to 200 h**. This is a research program, not a task.
  Lower bound assumes a "fraction rho of GF steps absorbs non-GF
  loss" argument works cleanly; upper bound assumes several false
  starts before the right invariant is found. If no one on the
  extractor theory side is collaborating, default to the upper
  end or longer.

### T2. Quaternion (H) formal adversary model

- Current status: "non-commutative mixing doubles evaluation
  orders" is combinatorial prose, not a cryptographic reduction.
- Required: state a concrete adversarial query model (what the
  adversary sees, what they output, success probability in the
  adversary model), then prove the H domain adds bits of work
  over the commutative baseline. Alternative: soften to
  "structural diversity" language everywhere.
- Effort: **16 to 40 h** for a formal argument, **2 h** for the
  softening rewrite if T1 is deferred.

### T3. Octonion (O) Catalan inversion argument

- Current status: `C_8 = 1430` parenthesizations asserted as
  work for adversary; no reduction.
- Required: same shape as T2. Tie Catalan count to a concrete
  adversary cost, not just enumeration.
- Effort: **16 to 40 h** formal, **1 h** softening.

### T4. p-adic (Q_p) orthogonal mixing

- Current status: one-line claim in extended security section.
- Required: either prove an extraction property distinct from R
  that follows from the ultrametric structure, or drop the claim.
- Effort: **20 to 80 h** if pursuing the proof; the p-adic
  extractor literature is thin and this may be genuinely novel
  work. **1 h** to drop.

### T5. 27% fold collision vs. XOR-composed min-entropy floor

- Current status: noted in passing in evaluation section, not
  reconciled with the security argument.
- Required: short lemma showing XOR composition absorbs fold
  collisions up to the weaker source's min-entropy bound, or a
  concrete counterexample driving a scope clarification.
- Effort: **4 to 12 h**. This is probably the smallest theory item.

---

## Measurement gaps (experiments that must be run)

### M1. NIST SP 800-90B `ea_non_iid` installation and run

- Current status: discussion admits the official NIST tool is
  "not installed" and uses MCV estimator proxy instead.
- Required:
  1. Clone NIST SP 800-90B reference implementation
     (https://github.com/usnistgov/SP800-90B_EntropyAssessment).
  2. Build (C++14, make).
  3. Run `ea_non_iid` on:
     - IBM Quantum 6.8 MB trace
     - CSI trace (see M2 for pool expansion)
     - `os.urandom` baseline
  4. Report official min-entropy estimates.
  5. Reconcile with MCV proxy; if divergence > 0.1 bits/byte,
     write a paragraph explaining the proxy's bias direction.
- Effort: **4 to 8 h** end-to-end on macOS. The tool compiles
  cleanly; the runtime on a few MB is minutes, not hours.

### M2. CSI pool expansion from 9 KB to certification scale

- Current status: 9 KB from ESP32-S3, below NIST
  recommended >= 1 M sample floor.
- Required: either
  - (a) Reuse Paper 2's BCM4339 Nexmon trace
    (`walk_1597159475.pcap`, already on disk), re-run the ARE
    pre-conditioner over it, and report metrics at the larger
    scale; or
  - (b) Run a longer ESP32-S3 capture targeting >= 1 M samples
    (roughly 10 to 30 minutes of capture with current
    firmware, plus post-processing).
- Effort: **(a) 3 to 6 h** (trace already exists; integration
  work); **(b) 8 to 16 h** (capture + post-processing +
  validation).

### M3. Cross-source mutual-information test

- Current status: XOR composition assumes source independence;
  no empirical validation.
- Required: pairwise mutual information between IBM Quantum,
  CSI, and OS streams over the collected traces. Simple
  histogram-based estimator is sufficient; report MI in bits.
  If MI > 0.01 bits, discuss whether the composition proof still
  holds or needs qualification.
- Effort: **3 to 6 h**.

---

## Editorial gaps (already flagged, small)

### E1. Filename `main-draft.tex` with header "Venue-neutral draft"

- Rename to `main.tex` and pick a venue (ieee-sp/ or usenix-sec/
  subfolders already exist) before any DOI deposit. Depositing a
  file the author himself labels "draft" creates a
  citation-integrity issue.
- Effort: **0.5 h** (rename, update Makefile, rebuild).

### E2. PDF on disk dated Apr 15, source edited Apr 20

- After all theory and measurement work lands, rebuild:
  `pdflatex main.tex; bibtex main; pdflatex main.tex; pdflatex main.tex`
- Verify `grep "undefined" main.log | wc -l` is 0.
- Effort: **0.5 h**.

### E3. Abstract and title alignment

- Once T1 closes, the abstract's "we prove" framing becomes
  accurate. Verify every theorem referenced in the abstract
  exists in the body with the claimed strength.
- Effort: **1 to 2 h**.

---

## Summary estimate

| Category        | Optimistic | Pessimistic |
|-----------------|-----------:|------------:|
| Theory (T1-T5)  | 96 h       | 372 h       |
| Measurement (M1-M3) | 10 h   | 30 h        |
| Editorial (E1-E3)   | 2 h    | 3.5 h       |
| **Total**       | **108 h**  | **405 h**   |

Reality check: T1 alone dominates. If T1 is not pursued, Option A
(scope-down) is the only Zenodo-viable path today. Options T2/T3/T4
softening and T5 short lemma can land in under 2 weeks of focused
work; T1 is a publishable result in its own right and should not
be rushed to meet a DOI deposit deadline.

---

## Decision hinge

- If Mo wants Zenodo deposit this quarter: Option A.
- If Mo wants the full "we prove" framing honest: Option B, with
  T1 as the critical path, no deposit until T1 closes.
- If Mo wants a middle path: deposit Option A now, work T1-T5 and
  M1-M3 in parallel, deposit a revised version (Paper 3 v2) when
  T1 closes. Zenodo supports versioned deposits.
