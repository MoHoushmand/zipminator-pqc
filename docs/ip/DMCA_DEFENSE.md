# Provenance and Authorship Record: Zipminator-PQC

This document is a public, trade-secret-free record of the origin and authorship of the
Zipminator-PQC project. It exists so that anyone (GitHub Trust & Safety, a court, a
downstream user, or a journalist) can independently verify that Daniel Mo Houshmand /
QDaria AS is the original author of this software, and that any third-party republication
which strips the Apache-2.0 license or attribution is an unauthorized copy.

It contains no private keys, no cryptographic seeds, no QRNG entropy values, no patent
specification text, and no financial figures. Everything below is verifiable from public
artifacts (the git history, the committed OpenTimestamps proofs, the public Patentstyret
register, and the Zenodo records once published).

---

## 1. Authorship

- **Author / copyright holder:** Daniel Mo Houshmand, CEO and sole founder of QDaria AS (Oslo, Norway).
- **Commit identities used by the author** (visible in every commit of the canonical history):
  - Names: `mos`, `D. Mo Houshmand`
  - Emails: `dmo.houshmand@gmail.com`, `mos@example.com`
- **License of the original work:** Apache License 2.0 (attribution, license preservation, and NOTICE preservation required on any redistribution per Section 4).

## 2. Canonical repositories

| Repository | URL | Created | Public since |
|---|---|---|---|
| QDaria org (original public home) | https://github.com/QDaria/zipminator | 2023-01-08 | 2023-01-08 |
| Canonical development repo | https://github.com/MoHoushmand/zipminator-pqc | 2025-11-04 | 2026-04-12 |

The commit history in both repositories carries the author identities above. A third-party
repository that contains these same commits, by these same author identities, was therefore
copied from this work and not independently authored.

## 3. Commit-history timeline (public)

These dates come from the project's own git history and are reproducible with
`git log --reverse`.

| Date | Milestone |
|---|---|
| 2025-06-22 | Earliest uploaded files in history (`D. Mo Houshmand`) |
| 2025-11-04 | Initial commit: "Zipminator-PQC - Quantum-Secure Encryption Platform" (`mos`) |
| 2025-11-04 | Dual-licensing and business-strategy commit |
| 2025-11-17 | Marketing/contact documentation |
| 2026-03-01 onward | Continuous active development (crypto core, SDK, API, apps, CI) |
| 2026-04-12 | Canonical development repository made public |

Every commit predating any third-party republication is attributable to the author by name
and email in the commit metadata.

## 4. OpenTimestamps (Bitcoin blockchain) proofs

The repository commits Bitcoin-blockchain timestamp proofs for selected commit hashes in the
`.ots/` directory. Each `<commit-hash>.txt` file contains a commit SHA, and the matching
`<commit-hash>.txt.ots` file is its OpenTimestamps proof anchored to the Bitcoin blockchain
via the public OpenTimestamps calendar servers
(`alice.btc.calendar.opentimestamps.org`, `bob.btc.calendar.opentimestamps.org`,
`btc.calendar.catallaxy.com`, `finney.calendar.eternitywall.com`).

- **Proofs committed:** 25 commit hashes timestamped.
- **Earliest timestamped commit:** 2026-04-13.
- **Most recent timestamped commit:** 2026-05-24.

These proofs let any third party verify, without trusting QDaria or GitHub, that the named
commits existed on or before the Bitcoin block they are anchored to.

### How to verify a proof yourself

```bash
# Install the OpenTimestamps client
pip install opentimestamps-client

# Verify a committed proof against its commit hash
ots verify .ots/<commit-hash>.txt.ots

# Confirm the hash in the .txt file is a real commit in this repository
git cat-file -t <commit-hash>
```

A successful `ots verify` reports the Bitcoin block height and timestamp that the proof is
anchored to. That block time is a cryptographic upper bound on when the commit existed.

## 5. Independent academic provenance (Zenodo)

Three peer-reviewed papers describe the methods underlying this software. Their Zenodo DOIs
are reserved and will be published after the corresponding PCT filings are complete (the
European Patent Convention provides no grace period for the author's own disclosures, so the
academic publication is deliberately sequenced after patent priority is secured).

| Paper | Subject | Zenodo DOI | Status |
|---|---|---|---|
| Paper 1 | Quantum-certified anonymization | `10.5281/zenodo.<TBD>` | DOI reserved, publication pending PCT |
| Paper 2 | Unilateral CSI entropy harvesting | `10.5281/zenodo.<TBD>` | DOI reserved, publication pending PCT |
| Paper 3 | Certified heterogeneous entropy / ARE provenance | `10.5281/zenodo.<TBD>` | DOI reserved, publication pending PCT |

The DOI strings will be filled in here, and into `CITATION.cff`, once the records are public.

## 6. Patent filings (Patentstyret, Norway)

Three patent applications covering the underlying methods are on file with Patentstyret (the
Norwegian Industrial Property Office). These are public filing facts; no specification text,
claims, or financial details are reproduced here.

| Patent | Subject | Application no. | Filing date | Paris-Convention priority deadline |
|---|---|---|---|---|
| 1 | Irreversible data anonymization using QRNG | 20260384 | 2026-03-24 | 2027-03-24 |
| 2 | Unilateral CSI entropy harvesting | (assigned by Patentstyret) | 2026-04-04 | 2027-04-04 |
| 3 | Certified heterogeneous entropy / ARE provenance | (assigned by Patentstyret) | 2026-04-05 | 2027-04-05 |

Application numbers for patents 2 and 3 will be inserted once confirmed from the Patentstyret
register. The filings establish a documented invention date that predates any third-party
republication of this code.

## 7. What an unauthorized copy looks like

A third party that re-publishes this code while doing any of the following is in violation of
the Apache License 2.0 and is distributing an unauthorized copy:

- removing or replacing the Apache-2.0 LICENSE file,
- removing copyright, patent, trademark, or attribution notices,
- omitting the NOTICE file,
- failing to mark modified files as changed,
- or presenting the work as their own without attribution to Daniel Mo Houshmand / QDaria AS.

The author's commit identities (Section 1) appearing in such a copy's history are themselves
proof that the code was taken from this project.

## 8. Contact

- Daniel Mo Houshmand, QDaria AS, Oslo, Norway
- mo@qdaria.com

For the takedown procedure used against unauthorized copies, see
`docs/ip/dmca-takedown-github.md` and `docs/ip/dmca-escalation-runbook.md` in the
development repository.
