# Zenodo upload checklist

Three paper-level DOIs, ~10 minutes total. Log in via ORCID (0009-0008-2270-5454) at https://zenodo.org.

## Steps

1. Go to https://zenodo.org/uploads/new
2. Open `zenodo-paper1.md` in another window, copy field-by-field into the Zenodo form
3. Attach `docs/research/eprint/paper1-quantum-anonymization.pdf`
4. Click "Publish" (DOI mints immediately, format `10.5281/zenodo.NNNNNNN`)
5. Record the DOI in the table below
6. Repeat for Paper 2 (use `zenodo-paper2.md`, attach `paper2-csi-entropy-puek.pdf`)
7. Repeat for Paper 3 (use `zenodo-paper3.md`, attach `paper3-che-are-provenance.pdf`)

## DOIs to record after minting

| Paper | Zenodo DOI | Minted |
|---|---|---|
| 1 Quantum-Certified Anonymization | `10.5281/zenodo.________` | [ ] |
| 2 Unilateral WiFi CSI Entropy | `10.5281/zenodo.________` | [ ] |
| 3 CHE + ARE Provenance | `10.5281/zenodo.________` | [ ] |

## After the three DOIs exist

- [ ] Add them back into `CITATION.cff` under `identifiers:` (I will do this in one commit once you paste the real DOIs here)
- [ ] Reference the preprint DOI in each IACR ePrint submission's "Additional notes" field ("Preprint available at `https://doi.org/10.5281/zenodo.NNNNNNN`")
- [ ] Optionally cross-post the same three PDFs to arXiv (cs.CR category) for broader reach; arXiv adds its own ID, both can coexist

## If you also want a repo-level DOI

Separate from the three paper DOIs. Steps:
1. Confirm the Zenodo-GitHub toggle is ON for `MoHoushmand/zipminator-pqc` at https://zenodo.org/account/settings/github/
2. Bump version in `CITATION.cff` if you want a new semver (e.g. `v1.0.0-beta.2`)
3. `gh release create v1.0.0-beta.2 --title "..." --notes "..."`
4. Zenodo auto-mints a software DOI within ~2 minutes; shows up on your Zenodo dashboard

Software DOI is for the code snapshot. It does not replace the per-paper DOIs.
