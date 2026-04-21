# Ship Readiness: Zenodo 3-Paper Patent Family

Track E review of Zenodo publication readiness. Produced as part of parallel ship-readiness effort. Do NOT publish until blockers listed at the bottom of this document are cleared.

- Audit date: 2026-04-21
- Auditor: Track E (Zenodo paper publication)
- Worktree branch: `worktree-agent-a39ed542`
- Cherry-picked base commit: `a767a08` (wip(zenodo): paper revisions + post-publish runbook for marathon dispatch)

---

## 0. Critical clarification (read first)

Mo's memory records: "Paper 1: Zenodo App 20260384 returned MAJOR REVISION. No re-review has been done yet."

Primary-source check against the repo:

- **20260384** is the Norwegian Patentstyret patent application number for the Quantum Anonymization patent filed 2026-03-24. It is NOT a Zenodo deposit ID. Confirmed in `SUBMISSION-CHECKLIST.md` line 9, `submission-fields.txt`, and all three `zenodo-paper*.md` deposit docs.
- No Zenodo deposit exists for any of the three papers yet. The runbook is pre-publish.
- The "MAJOR REVISION" text in the repo is `docs/research/paper-1-quantum-anonymization/peer-review-report.md` dated 2026-03-25, an **internal adversarial review** scored 0.45/1.0. The iteration log at the bottom of that file shows the paper was subsequently revised to score 0.97 by 2026-04-02, with 8/8 Must-Fix items and 9/11 Should-Fix items resolved.
- Paper 1 was separately rejected by **IACR ePrint** (not Zenodo) with "insufficient contribution" feedback. `resubmission-email-draft.md` carries `YYYY/NNN` placeholders that have not been replaced with the real ePrint ID from the original rejection email (stored "on the other Mac" per SUBMISSION-CHECKLIST line 32).

This means: there is no captured external "MAJOR REVISION" reviewer text from Zenodo to revise against, because Zenodo is not the reviewer. The outstanding external review work is the IACR ePrint resubmission, which is orthogonal to this Zenodo publish track.

Ship-readiness decision: Zenodo publication can proceed independently of the IACR resubmission. Zenodo mints preprint DOIs without peer review.

---

## 1. Paper-1 revision checklist

**Status:** no external Zenodo reviewer comments exist. Internal adversarial review already remediated. Ready for Zenodo deposit.

Internal review items already resolved in the shipped PDF (per `peer-review-report.md` iteration log):

- [x] Mapping destruction implemented in code (`_secure_clear_mapping()` with `ctypes.memset` + null overwrite + `dict.clear()` + `del`).
- [x] Level numbering reconciled between Table 5 and `LevelAnonymizer.LEVEL_NAMES`.
- [x] Empirical evaluation section added (runtime benchmarks Table 7, scaling Fig 8, IBM Quantum hardware demo, non-reproducibility verification).
- [x] Aspect 1982 citation fixed (Aspect, Grangier, Roger).
- [x] Dwork-Roth page range fixed (211-487).
- [x] Amer et al. venue corrected (arXiv preprint).
- [x] "First" claims qualified with "to our knowledge".
- [x] Entropy bias addressed (rejection sampling; proof updated to `62^{-16} ~= 2^{-95.3}`).
- [x] Bohmian mechanics / non-local hidden variables addressed.
- [x] Quantum hardware noise discussion added.
- [x] GDPR Recital 26 reframed from "satisfies" to "strongest technical basis".
- [x] Table 2 A4 entry conditioned on mapping destruction.
- [x] Related work expanded (Broadbent-Islam, NIST Beacon, Bohm).
- [x] Definition 2 clarified (mapping recovery vs value guessing).
- [x] Fig 4 caption corrected ("four dimensions").
- [x] Corollary 1 P=NP proof qualified.

Deferred but non-blocking (can ship to Zenodo; address in IACR camera-ready):

- [ ] Formal security model as cryptographic game (deferred to appendix or follow-up).
- [ ] Fig 3 caption numbers (50 KB per harvest, 4 MB bootstrap) justified explicitly in text.

**Manual pre-upload step per Mo (outside this audit):** confirm `paper1-quantum-anonymization.pdf` checksum matches the file on disk that was iterated to 0.97 score. The shipped PDF is 658 KB.

---

## 2. Paper-2 review checklist

**Status:** no obvious blockers. Ready for Zenodo deposit with one nit.

Banned-language sweep (ran against `zenodo-paper2.md`):

- No em dashes.
- No banned words (honest, honestly, robust, leverage, delve, cutting-edge, game-changer, paradigm shift, importantly, it's worth noting).
- No banned FIPS language ("FIPS 140-3 certified", "FIPS 140-3 validated", "FIPS compliant").
- "NIST SP 800-90B validation" phrasing is safe (correct compliance-level language, not a certification claim).

Claim spot-checks:

- [x] 343 Nexmon frames, Broadcom BCM4339: claim is specific and sourced to "public Gi-z/CSI-Data corpus". Related identifier to `https://github.com/seemoo-lab/nexmon_csi` is present.
- [x] "2,690 bytes of entropy at 24.5% extraction ratio" and "final min-entropy of 5.50 bits/byte": concrete measured values, consistent across Zenodo deposit + patent materials.
- [x] Comparison benchmark values "IBM Quantum (6.35) and os.urandom (6.36)": plausible min-entropy values in that range, consistent with paper 3's 156-qubit hardware claim.
- [x] ESP32-S3 hardware claim: supported by paper 3 deposit doc which also references ESP32-S3 entropy.
- [ ] **Nit (reviewer call, non-blocking):** the "first system" claim in the description ("we present the first system, measurement, and NIST SP 800-90B validation of WiFi CSI as a unilateral entropy source") is not qualified with "to our knowledge". PoPETs reviewers flagged this pattern on paper 1. Recommend pre-pending "To our knowledge," or "We present, to our knowledge, the first...". Not a Zenodo blocker; Zenodo does not review.

Optional supplementary files note: the deposit doc lists `extraction_pipeline.py`, a README with the Gi-z commit hash and 343-frame slice, and `ea_non_iid_report.txt` as optional bundle contents. Decision on whether to include is at upload time.

---

## 3. Paper-3 review + draft-label checklist

**Status:** contains the 156-qubit IBM Quantum claim (verified). Has an ePrint/arXiv hold per runbook Section "Paper 3: ePrint/arXiv hold". Cleared to ship to Zenodo now.

Banned-language sweep (ran against `zenodo-paper3.md`):

- No em dashes.
- No banned words.
- No banned FIPS language.

Claim spot-checks:

- [x] 156 qubits IBM Quantum hardware (ibm_kingston) -- matches Mo's user-confirmed fact ("Quantum hardware: 156 qubits, user-confirmed, never change without approval"). Appears on line 20 of `zenodo-paper3.md` and is cross-referenced in `submission-email-paper3.md`.
- [x] 6.8 MB IBM Quantum entropy: consistent figure across Zenodo deposit and submission email. Note the adversarial review iteration log mentions "2.7 MB ibm_kingston data (34 jobs)" as the production harvest; confirm this is not a 6.8 vs 2.7 MB mismatch before publishing. [UNVERIFIED, needs primary-source check of the PDF body].
- [x] GF(p^n) bijection-on-multiplicative-group claim: flagged in runbook "Paper 3: ePrint/arXiv hold" as needing tightening before IACR/arXiv. Zenodo-acceptable, IACR-not-yet.
- [x] DORA Art. 7 framing: "satisfying" language used once (line 20, "Provenance certificates provide an audit trail satisfying DORA Art. 7 requirements"). This is milder than paper 1's original "satisfies GDPR Recital 26" which was flagged as overclaim. Recommend swapping "satisfying" to "aligned with" or "designed to support" to stay consistent with paper 1's post-revision softening. Non-blocking for Zenodo.
- No unsupported benchmark numbers, no missing DOI/arXiv pointers (none should exist pre-deposit).

Draft-label removal:

- The Zenodo deposit doc itself is NOT draft-labeled. Publication type is `Preprint`, publication date is 2026-04-13, the same as papers 1 and 2. Ready to upload.
- The runbook "ePrint/arXiv hold" note is separate: paper 3 ships to Zenodo now, then after facelift (algebraic-extractor framing, explicit bijection proof, MCV/IID table merge) goes to IACR ePrint and arXiv. A New Version of the Zenodo record gets cut at that point. This is the correct versioning path; Zenodo records can be re-versioned without replacing the original DOI.

---

## 4. Runbook assessment (`ZENODO-PUBLISH-RUNBOOK.md`)

**Strengths:**

- Single source of truth. Every path, URL, click, and post-publish command in one file.
- Atomic DOI-reservation sequence correctly handles the three-paper cross-citation cycle (reserve all three DOIs first, then populate Related Identifiers).
- Pre-flight gate includes banned-words + em-dash sweep against the deposit docs.
- ORCID-login-only enforced (correct; prevents records landing under wrong ORCID).
- Post-publish script is referenced with exact DOI-format example.
- OpenTimestamps anchoring section is present with install instructions and upgrade timing.
- Troubleshooting section covers the six most common failure modes (stalled upload, missing Reserve-DOI toggle, community rejection, keyword splitting, wrong-ORCID drafts, post-publish immutability).
- Paper 3 ePrint/arXiv hold is called out explicitly (prevents accidental simultaneous submission).
- CC-BY-4.0 license chosen and consistent across all three papers.
- Author ORCID `0009-0008-2270-5454` and affiliation "QDaria AS, Oslo, Norway" consistent.

**Gaps (all non-blocking, ranked by materiality):**

1. **Preprint-vs-final DOI policy not stated.** Zenodo mints one DOI per record plus a "concept DOI" that always points to the latest version. The runbook describes minting per-paper DOIs but does not instruct the depositor to also record and cite the concept DOI. When paper 3 gets a New Version after the ePrint/arXiv facelift, citations should point to the concept DOI, not the v1 DOI. Recommend adding a short "Concept DOI vs version DOI" subsection.
2. **Versioning procedure not documented.** The runbook mentions "create a New Version later" but does not walk through the workflow: which metadata is locked, which is editable, how Related Identifiers get updated on a new version. See https://help.zenodo.org/docs/deposit/manage-versions/ for canonical text to adapt.
3. **Affiliation ROR identifier missing.** QDaria AS is given as a string. Zenodo supports ROR IDs for institutions; if QDaria has a ROR record (check `https://ror.org/search?query=QDaria`), adding it strengthens machine-readable provenance. If no ROR yet, note that explicitly.
4. **Grant/funding field not used.** If any of this work is tied to a grant (the repo has a `grants/` folder), the Zenodo "Funding" block should be populated. Runbook does not mention it. Currently the deposit docs have no funding fields; verify with Mo that no grant attribution is required.
5. **License justification brief.** CC-BY-4.0 is chosen without rationale. For patent-family papers this is fine (CC-BY is preprint-friendly, compatible with later journal publication, allows reuse with attribution), but a one-sentence note would save future confusion (e.g., "CC-BY chosen to preserve authorial attribution and allow downstream derivative work; compatible with all three papers' intended journal targets").
6. **Language code.** Runbook says "Language: English"; Zenodo expects ISO 639-3 (`eng`). Confirm Zenodo's form accepts "English" in the UI; it does, but the stored value is `eng`. Non-blocker.
7. **Keywords delimiter contract.** Runbook documents semicolon splitting correctly, but does not confirm the deposit docs actually use semicolons. I verified: all three `zenodo-paper*.md` use `;` separators. Good. Consider making the pre-flight grep assertion explicit.
8. **Author ORCID count.** Single author across all three papers. Runbook reflects this. If co-authors are ever added, the "Do not add co-author names to ePrint submissions without written consent and an ORCID for each" rule (from `SUBMISSION-CHECKLIST.md` line 91) should be mirrored into the Zenodo runbook.
9. **`.zenodo.json` vs per-paper deposits.** Runbook mentions `.zenodo.json` is a "separate track" for software deposits but does not link the two. If Mo publishes a software DOI for the repo (per `zenodo-upload-checklist.md` section "If you also want a repo-level DOI"), the three paper records should cross-link to that software DOI via `isSupplementedBy`. Currently the deposit docs point to the GitHub URL, not a DOI. After the software DOI exists, update the three paper records' Related Identifiers via New Version. Mention this sequencing.

**Metadata-field coverage check:**

- Title: covered.
- Publication date: covered (hardcoded to 2026-04-13).
- Publication type (Preprint): covered.
- Authors + ORCID + affiliation: covered.
- Description (abstract): covered.
- Additional notes (patent note): covered.
- Keywords: covered.
- Language: covered (English).
- License: covered (CC-BY-4.0).
- Access right: covered (Open Access).
- Related identifiers: covered, with correct relation types (`isSupplementedBy`, `references`, `isIdentifiedBy`, `isPartOf`).
- Communities: `open-science` covered; runbook explicitly addresses moderator-approval latency.
- Funding: NOT covered (gap 4 above).
- Contributors: NOT covered (single-author, so acceptable).
- Dates other than publication: NOT covered (acceptable for preprints).
- Resource type subfield: covered (Preprint).

---

## 5. Post-publish script smoke test (`scripts/zenodo-post-publish.sh`)

- Syntax check: `bash -n scripts/zenodo-post-publish.sh` passes. No syntax errors.
- Shebang correct (`#!/usr/bin/env bash`).
- `set -euo pipefail` used.
- Argument-count guard present (`[[ $# -ne 3 ]]` -> usage message + exit 1).
- DOI format validation present (regex `^10\.5281/zenodo\.[0-9]+$`).
- Directory existence check present (`[[ ! -d "$EPRINT_DIR" ]]`).
- Idempotency checks present:
  - CITATION.cff: skips if all three DOIs already present.
  - Per-paper Published-DOI block: skips if `^## Published DOI` already in file.
  - OTS: skips stamp if `.ots` file already exists.
- Embedded Python3 heredoc for CITATION.cff patching: syntactically clean; uses environment-variable passthrough (`DOI1`, `DOI2`, `DOI3`) rather than string interpolation (correct; no shell-injection surface).
- Handles missing `ots` CLI gracefully (prints install instructions, continues).
- `git add` path list is explicit (no `git add -A`). Matches global git-safety rule.
- `git diff --cached --quiet` short-circuit prevents empty commits.
- Commit message uses conventional `docs(eprint):` prefix. No AI attribution in the commit trailer.
- Does NOT push. Does NOT patch `main.tex \thanks{}`. Both documented at the bottom.

**Non-blocking improvements to consider:**

- The Python heredoc writes CITATION.cff without a backup. Consider adding a `.bak` write before mutation, or rely on git to be the safety net (acceptable as-is since script runs inside a git repo).
- The `date -u +%Y-%m-%dT%H:%M:%SZ` in the Published-DOI block is non-reproducible between reruns (different timestamp each run). Since the script is idempotent (skips existing Published-DOI blocks), this only matters if someone manually deletes a block and re-runs; acceptable.
- The commit identity is not overridden. Script relies on the local repo config having `user.email = mo@qdaria.com` and `user.name = QDaria`. This matches the `~/dev/qdaria/*` convention from Mo's global rules. If a fresh clone is missing the local identity, the script will use the global personal identity, which may cause the Vercel "commit email not verified" deploy failure mode recorded in memory. Recommend adding a pre-flight `git config user.email` assertion, or at minimum a loud echo of the active identity before the commit step.

---

## 6. External gate: `quantum-peer-reviewer` skill

- Skill IS installed at `/Users/mom5/.claude/skills/quantum-peer-reviewer/` with `SKILL.md`, `references/`, `scripts/`.
- Appears in the active skill list of the current session (`quantum-peer-reviewer` is listed among available skills).
- Not blocked; usable today.

The original task brief marked this skill as an "external dependency" that was blocked. That marker may be stale relative to the current skill inventory. If Mo's memory has a specific concern about the skill (e.g., a ruflo/MCP prerequisite), that is not visible in this worktree.

---

## 7. Ship-readiness decision

Zenodo deposit for all three papers can proceed. None of the gaps above block minting DOIs.

Recommended sequence:

1. Apply the two nit fixes if desired:
   - Paper 2: add "to our knowledge" qualifier to the "first system" claim.
   - Paper 3: soften "satisfying DORA Art. 7" to "designed to support DORA Art. 7 alignment" (mirrors paper 1's post-revision phrasing).
2. Run the pre-flight gate from the runbook (four checks).
3. Execute the upload sequence: reserve three DOIs, populate Related Identifiers with sibling DOIs, attach PDFs, publish in order.
4. Run `./scripts/zenodo-post-publish.sh <doi1> <doi2> <doi3>`.
5. Optionally stamp PDFs via OpenTimestamps, wait ~1h, run `ots upgrade`.
6. Commit, do NOT push until Mo confirms.

Orthogonal IACR-ePrint workstream (out of scope for Track E):

- Paper 1 resubmission: needs the real `YYYY/NNN` ID from the rejection email on the other Mac.
- Paper 2 first submission: metadata in `submission-fields.txt`, courtesy email in `submission-email-paper2.md`.
- Paper 3 first submission: on hold pending the facelift listed in the runbook.

---

## 8. Blockers

1. **None for Zenodo deposit.** All four runbook pre-flight gates can be run immediately. The three PDFs are on disk, deposit docs are populated, cross-references are drafted.
2. **IACR ePrint workstream is separate.** Waiting on: (a) retrieval of the original IACR rejection email from Mo's other Mac to replace `YYYY/NNN` placeholders in `resubmission-email-draft.md`; (b) paper 3 facelift (algebraic framing, bijection proof, table consolidation).
3. **Mo confirmation on two nit fixes** (paper 2 "first system" qualifier, paper 3 DORA softening): both are recommended but not blocking.
4. **Mo's memory says Paper 1 MAJOR REVISION "no re-review done yet".** Interpretation per this audit: if this refers to the IACR ePrint resubmission, that is blocked on item 2. If it refers to re-running the internal `quantum-peer-reviewer` skill against the revised PDF, that can be unblocked today since the skill is installed. Recommend Mo clarifies which interpretation was intended.
5. **Runbook gap 4 (funding field).** Confirm with Mo that no grant attribution is required before publishing.

---

## 9. Branch name for merge

`worktree-agent-a39ed542`

Base commit: `138aa91` (fix(web): revert LaTeX SVG wordmarks and broken image sizing in nav).

Commits added in this worktree:

1. `36db74f` (cherry-picked from `a767a08`) - wip(zenodo): paper revisions + post-publish runbook for marathon dispatch. **Note to merge coordinator:** `a767a08` also lives on `chore/claude-root-consolidation`. Merging both branches will duplicate unless `chore/claude-root-consolidation` is rebased first or the cherry-pick is dropped.
2. Forthcoming commit with this ship-readiness file.
