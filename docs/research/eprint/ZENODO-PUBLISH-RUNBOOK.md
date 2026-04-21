# Zenodo Publish Runbook: 3-Paper Patent Family

Single source of truth for depositing the three QDaria preprints to Zenodo. Every path, URL, click, and post-publish command lives in this file. Follow top-to-bottom; do not freelance.

- Repository: `/Users/mom5/dev/qdaria/products/zipminator`
- Depositor: Daniel Mo Houshmand, QDaria AS, Oslo
- ORCID: `0009-0008-2270-5454`
- GitHub (software supplement): `https://github.com/MoHoushmand/zipminator-pqc`
- License for all three deposits: CC-BY-4.0
- Publication date to enter: `2026-04-13`

## Assets on disk

| Slug   | PDF path (relative to repo root)                                 | Size    | Deposit doc (copy-paste fields)                          | Patent filing                           |
|--------|------------------------------------------------------------------|---------|----------------------------------------------------------|-----------------------------------------|
| paper1 | `docs/research/eprint/paper1-quantum-anonymization.pdf`          | 658 KB  | `docs/research/eprint/zenodo-paper1.md`                  | Patentstyret No. 20260384, 2026-03-24   |
| paper2 | `docs/research/eprint/paper2-csi-entropy-puek.pdf`               | 471 KB  | `docs/research/eprint/zenodo-paper2.md`                  | Patentstyret (filed 2026-04-04)         |
| paper3 | `docs/research/eprint/paper3-che-are-provenance.pdf`             | 574 KB  | `docs/research/eprint/zenodo-paper3.md`                  | Patentstyret (filed 2026-04-05)         |

Supporting files:
- `/Users/mom5/dev/qdaria/products/zipminator/CITATION.cff` (DOIs get injected here post-publish)
- `/Users/mom5/dev/qdaria/products/zipminator/.zenodo.json` (software-deposit metadata, separate track)
- `/Users/mom5/dev/qdaria/products/zipminator/docs/research/eprint/zenodo-upload-checklist.md` (older checklist, superseded by this file)

## Pre-flight gate

Run from `/Users/mom5/dev/qdaria/products/zipminator`:

```bash
# 1. PDFs present and non-empty
ls -l docs/research/eprint/paper1-quantum-anonymization.pdf \
      docs/research/eprint/paper2-csi-entropy-puek.pdf \
      docs/research/eprint/paper3-che-are-provenance.pdf

# 2. Banned words + em dashes sweep across deposit docs
grep -nE '(\b(honest|honestly|robust|leverage|delve|cutting-edge|game-changer|paradigm shift|it.s worth noting|importantly)\b|—)' \
  docs/research/eprint/zenodo-paper*.md && echo 'FIX BEFORE UPLOAD' || echo 'clean'

# 3. CITATION.cff has an identifiers: block to patch later
grep -n '^identifiers:' CITATION.cff || echo 'CITATION.cff missing identifiers: key'

# 4. Confirm ORCID resolves (network check)
curl -sI https://orcid.org/0009-0008-2270-5454 | head -n 1
```

All four must be clean before opening Zenodo.

## URLs

- Production upload form: `https://zenodo.org/uploads/new`
- Sandbox (dry run, optional, separate account): `https://sandbox.zenodo.org/uploads/new`
- ORCID profile page: `https://orcid.org/0009-0008-2270-5454`
- Login via ORCID: `https://zenodo.org/login/?next=%2Fuploads%2Fnew` then pick "Log in with ORCID"
- Open Science community (submit deposit to): `https://zenodo.org/communities/open-science`

Do not create a Zenodo username/password account. Log in with ORCID so the deposits are attributed to the same ORCID iD as the papers themselves.

## Upload sequence (atomic DOI reservation)

The three papers cite each other. To avoid a chicken-and-egg (paper 1 cannot reference paper 2's DOI before paper 2 has one), reserve all three DOIs up front, then fill metadata and cross-link.

### Step 1: Reserve three DOIs

For each paper, in order (paper1, paper2, paper3):

1. Open `https://zenodo.org/uploads/new`
2. Upload type: **Publication**
3. Publication type: **Preprint**
4. Under "Digital Object Identifier", click **"Reserve DOI"**. Copy the reserved string; it has shape `10.5281/zenodo.XXXXXXX`.
5. Click **Save** (not Publish). A draft is now persisted.
6. Leave the rest of the form empty for now; the draft survives logout.

Record the three reserved DOIs in the table at the end of this file before you touch anything else. If you lose them, they are visible under "My dashboard" -> "Uploads" -> "Drafts".

### Step 2: Fill metadata per draft

Open each draft and paste every field from its deposit doc. Mapping:

| Zenodo field            | Source in deposit doc               |
|-------------------------|-------------------------------------|
| Title                   | `**Title:**`                        |
| Publication date        | `2026-04-13`                        |
| Authors                 | Houshmand, Daniel Mo + ORCID + QDaria AS, Oslo, Norway |
| Description             | `**Description:**` block            |
| Additional notes        | `**Additional notes:**` block       |
| Keywords                | `**Keywords:**` (semicolon-separated; paste as-is, Zenodo splits) |
| Language                | English                             |
| License                 | Creative Commons Attribution 4.0 International (CC-BY-4.0) |
| Access right            | Open Access                         |

Every field is already drafted in:
- `docs/research/eprint/zenodo-paper1.md`
- `docs/research/eprint/zenodo-paper2.md`
- `docs/research/eprint/zenodo-paper3.md`

Do not retype abstracts. Copy verbatim.

### Step 3: Attach PDFs

Drop the matching PDF into the file upload widget:
- Paper 1 draft gets `paper1-quantum-anonymization.pdf`
- Paper 2 draft gets `paper2-csi-entropy-puek.pdf`
- Paper 3 draft gets `paper3-che-are-provenance.pdf`

Wait for Zenodo to finish its virus scan before clicking Save. A stalled "100%" progress bar means scan is running; give it 60 seconds.

### Step 4: Cross-link via Related Identifiers

With all three DOIs reserved, populate each draft's Related Identifiers block:

**Paper 1 (`zenodo-paper1.md`):**
- `10.5281/zenodo.<paper2-doi>` , Publication / Preprint, `isSupplementedBy`
- `10.5281/zenodo.<paper3-doi>` , Publication / Preprint, `isSupplementedBy`
- `https://github.com/MoHoushmand/zipminator-pqc` , Software, `isSupplementedBy`
- `https://orcid.org/0009-0008-2270-5454` , Other, `isIdentifiedBy`

**Paper 2 (`zenodo-paper2.md`):**
- `10.5281/zenodo.<paper1-doi>` , Publication / Preprint, `references`
- `10.5281/zenodo.<paper3-doi>` , Publication / Preprint, `isSupplementedBy`
- `https://github.com/MoHoushmand/zipminator-pqc` , Software, `isSupplementedBy`
- `https://github.com/seemoo-lab/nexmon_csi` , Software, `references`
- `https://orcid.org/0009-0008-2270-5454` , Other, `isIdentifiedBy`

**Paper 3 (`zenodo-paper3.md`):**
- `10.5281/zenodo.<paper1-doi>` , Publication / Preprint, `isPartOf`
- `10.5281/zenodo.<paper2-doi>` , Publication / Preprint, `references`
- `https://github.com/MoHoushmand/zipminator-pqc` , Software, `isSupplementedBy`
- `https://orcid.org/0009-0008-2270-5454` , Other, `isIdentifiedBy`

### Step 5: Publish

Publish in order: Paper 1, Paper 2, Paper 3. Each "Publish" click is irreversible (you can create a New Version later, but you cannot unpublish the record). Final DOIs equal the reserved ones.

### Step 6: Submit to community

For each published record:
1. Open its record page (`https://zenodo.org/records/XXXXXXX`).
2. Click "Submit to community".
3. Search `open-science`, submit. Wait for moderator approval (usually <1 day).

## Final DOI table

Fill this in as you go. The post-publish helper reads these three strings.

| Paper | Reserved DOI             | Published DOI             | Record URL                              |
|-------|--------------------------|---------------------------|-----------------------------------------|
| 1     | `10.5281/zenodo.________` | `10.5281/zenodo.________` | `https://zenodo.org/records/________`   |
| 2     | `10.5281/zenodo.________` | `10.5281/zenodo.________` | `https://zenodo.org/records/________`   |
| 3     | `10.5281/zenodo.________` | `10.5281/zenodo.________` | `https://zenodo.org/records/________`   |

## Post-publish patch

Once all three DOIs are live, run:

```bash
cd /Users/mom5/dev/qdaria/products/zipminator
./scripts/zenodo-post-publish.sh \
  10.5281/zenodo.AAAAAAA \
  10.5281/zenodo.BBBBBBB \
  10.5281/zenodo.CCCCCCC
```

The helper does:
1. Injects the three DOIs into `CITATION.cff` under `identifiers:`.
2. Appends a `## Published DOI` block to each sibling deposit doc so the markdown mirrors the live record.
3. Stamps each PDF with OpenTimestamps (writes `.ots` files), if `ots` CLI is installed.
4. Stages the diff and commits under the QDaria identity (local repo config already set).

The helper does **not**:
- Edit `main.tex` `\thanks{}` footnotes. LaTeX sources live under `docs/research/eprint/paper{1,2,3}/` (or wherever each paper's `main.tex` sits). Patch by hand so you can review the footnote text.
- Push. Run `git push` when ready.
- Submit to IACR ePrint or arXiv. Those are separate platforms with separate runbooks.

## OpenTimestamps (optional, strongly recommended for patent defense)

If you want timestamp proofs that predate the Zenodo upload, stamp the PDFs before Step 5:

```bash
cd /Users/mom5/dev/qdaria/products/zipminator/docs/research/eprint
ots stamp paper1-quantum-anonymization.pdf
ots stamp paper2-csi-entropy-puek.pdf
ots stamp paper3-che-are-provenance.pdf
# Wait ~1 hour for Bitcoin confirmation, then:
ots upgrade paper1-quantum-anonymization.pdf.ots
ots upgrade paper2-csi-entropy-puek.pdf.ots
ots upgrade paper3-che-are-provenance.pdf.ots
# Verify:
ots verify paper1-quantum-anonymization.pdf.ots
```

Each `.ots` file is ~2 KB. Commit alongside the PDFs.

Install if missing:
```bash
micromamba activate zip-pqc
uv pip install opentimestamps-client
```

## Paper 3: ePrint/arXiv hold

Paper 3 (Certified Heterogeneous Entropy with ARE) ships to Zenodo now, but does **not** go to IACR ePrint or arXiv yet. It needs a facelift first:
- Tighten the algebraic-extractor framing in the intro.
- Add the explicit bijection-on-multiplicative-group proof for GF(p^n) steps.
- Clean up the empirical table (merge MCV / IID columns).

After the facelift, open a new task to:
1. Submit paper3 revision to IACR ePrint.
2. Cross-post to arXiv.
3. Create a New Version of the Zenodo paper3 record that adds the ePrint ID under Related Identifiers as `isIdenticalTo` and the arXiv ID as `isVersionOf`.

Papers 1 and 2 are ePrint/arXiv-ready after this Zenodo mint; handle those in a follow-up runbook.

## Troubleshooting

- **ORCID login returns to a broken page**: clear `zenodo.org` cookies, retry. Sometimes the OAuth dance breaks on SameSite cookie changes.
- **Upload stalls at 100%**: virus scan is running; wait 60 seconds then refresh the draft.
- **"Reserve DOI" button missing**: the "No DOI" toggle is on by default for some upload types. Untoggle it.
- **Cannot edit metadata after publish**: correct. Use "New Version" to patch; the new version gets a fresh DOI, the old one stays.
- **Deposit appears under wrong ORCID**: you logged in via email rather than ORCID. Delete the draft (drafts only; published records cannot move owners), log out, log back in via ORCID, redo.
- **Keywords got split oddly**: Zenodo splits on semicolons. The deposit docs use `;` separators on purpose. Do not paste with commas.
- **Community submission rejected**: re-read the community's rules on the community page; `open-science` is permissive but checks license and open access.
