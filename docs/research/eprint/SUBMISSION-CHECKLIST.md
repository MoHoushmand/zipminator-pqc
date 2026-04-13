# IACR ePrint Submission Checklist

**Goal:** get all three papers onto https://eprint.iacr.org with priority dates preserved and the rejected Paper 1 resubmitted with the strengthened cryptographic content.

## Patent status (all filed, safe to publish)

| Paper | Patent | Filed | Priority date |
|---|---|---|---|
| 1 | Quantum Anonymization, Patentstyret No. 20260384 | 2026-03-24 | 2026-03-24 |
| 2 | CSI-Entropy-PUEK, Patentstyret | 2026-04-04 | 2026-04-04 |
| 3 | CHE-ARE-Provenance, Patentstyret | 2026-04-05 | 2026-04-05 |

Publication to IACR ePrint does not jeopardize any of these priority dates. Paris Convention gives 12 months to extend to USPTO/EPO/PCT.

## Submission method

IACR ePrint accepts submissions via a web form. Email is used for correspondence and resubmissions.

- **Web submission:** https://eprint.iacr.org/submit/ (requires creating or signing into an account, ORCID recommended)
- **Email correspondence:** eprint-editor@iacr.org

All three papers use the metadata in `submission-fields.txt`. Submit via web form first, paste the fields into the corresponding inputs, upload the PDF.

## Paper 1 (Quantum Anonymization) — RESUBMISSION

**Status:** first submission was rejected with "insufficient contribution" feedback. Revised PDF adds three new cryptographic contributions (IND-ANON game + theorem, composition theorem with differential privacy, ideal functionality F_ANON in the UC paradigm).

**Before sending:**

- [ ] Open `resubmission-email-draft.md`
- [ ] Find the original rejection email from eprint-editor@iacr.org (on the other Mac)
- [ ] Replace `YYYY/NNN` placeholders with the actual ePrint submission ID from that email (two occurrences)
- [ ] Confirm the editor names (Bos, Celi, Kannwischer) match who signed the rejection. If different, update.
- [ ] Confirm the attached PDF `paper1-quantum-anonymization.pdf` has the three new sections referenced in the email
- [ ] Attach `paper1-quantum-anonymization.pdf`
- [ ] Send to `eprint-editor@iacr.org`

**PDF path:** `docs/research/eprint/paper1-quantum-anonymization.pdf`
**Metadata:** `submission-fields.txt` -> "IACR ePrint -- PAPER 1"
**Email draft:** `resubmission-email-draft.md`

## Paper 2 (CSI-Entropy-PUEK) — FIRST SUBMISSION

**Status:** never submitted. Patent priority secured 2026-04-04.

**Steps:**

- [ ] Sign in at https://eprint.iacr.org/submit/ (ORCID: 0009-0008-2270-5454)
- [ ] Paste fields from `submission-fields.txt` section "PAPER 2" into the web form
- [ ] Upload `paper2-csi-entropy-puek.pdf`
- [ ] Category: Implementation
- [ ] License: CC-BY
- [ ] Patent note in "Additional notes" field is already in `submission-fields.txt`
- [ ] Optionally send the courtesy email in `submission-email-paper2.md` to `eprint-editor@iacr.org`

**PDF path:** `docs/research/eprint/paper2-csi-entropy-puek.pdf`
**Metadata:** `submission-fields.txt` -> "IACR ePrint -- PAPER 2"
**Courtesy email:** `submission-email-paper2.md`

## Paper 3 (CHE-ARE-Provenance) — FIRST SUBMISSION

**Status:** never submitted. Patent priority secured 2026-04-05.

**Steps:**

- [ ] Sign in at https://eprint.iacr.org/submit/
- [ ] Paste fields from `submission-fields.txt` section "PAPER 3" into the web form
- [ ] Upload `paper3-che-are-provenance.pdf`
- [ ] Category: Foundations
- [ ] License: CC-BY
- [ ] Patent note is already in `submission-fields.txt`
- [ ] Optionally send the courtesy email in `submission-email-paper3.md`

**PDF path:** `docs/research/eprint/paper3-che-are-provenance.pdf`
**Metadata:** `submission-fields.txt` -> "IACR ePrint -- PAPER 3"
**Courtesy email:** `submission-email-paper3.md`

## After acceptance on ePrint

- Each paper gets an ID `YYYY/NNN` and a permanent URL: `https://eprint.iacr.org/YYYY/NNN`
- Record the final IDs back in this checklist and in `submission-fields.txt` for citation
- Cross-post to arXiv (optional, broadens reach): https://arxiv.org/submit (same PDFs)
- Target venues after ePrint acceptance:
  - Paper 1: PoPETs (see `paper-1-quantum-anonymization/popets/main.tex`)
  - Paper 2: IEEE conference track (see `paper-2-csi-entropy-puek/main-ieee.tex`)
  - Paper 3: IEEE S&P (see `paper-3-che-are-provenance/ieee-sp/main.tex`)

## Watchouts

- **Do not** edit the filed patent text when revising papers. Paper content can go beyond the patent, but the patent text is locked.
- **Do not** add co-author names to ePrint submissions without written consent and an ORCID for each co-author. Currently single-author across all three.
- **Do not** include the Patentstyret receipts in the ePrint PDF. The "Patent pending, Patentstyret App No. YYYYMMDD" note in the additional-notes field is sufficient and standard.
- **Priority-date calendar:** 2027-03-24 is the Paris Convention deadline to extend Patent 1 to USPTO/EPO/PCT. Budget and file decisions need to happen by 2027-02-24 (30-day buffer).

## Files created or edited today

- `docs/ip/patent-1-quantum-anonymization/filing-2026-03-24/` (new folder, PDFs copied, README with pending-files list)
- `docs/research/eprint/submission-email-paper2.md` (new)
- `docs/research/eprint/submission-email-paper3.md` (new)
- `docs/research/eprint/resubmission-email-draft.md` (placeholders flagged with `YYYY/NNN` and TODO comment)
- `docs/research/eprint/SUBMISSION-CHECKLIST.md` (this file)
