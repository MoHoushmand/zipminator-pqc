# DMCA Escalation Runbook: CYBERELLUM/zipminator-pqc

Procedure for getting the unauthorized copy at
`https://github.com/CYBERELLUM/zipminator-pqc` taken down, and what to do if GitHub does not
act. Prior informal email requests to GitHub were ignored; this runbook uses the formal DMCA
webform, which GitHub is legally obligated to process.

The notice text to submit is in `dmca-takedown-github.md`. The provenance backing every
factual claim is in `DMCA_DEFENSE.md`.

---

## Stage 0: Pre-flight (do once, before filing)

- [ ] Confirm the infringing repo is still live: open `https://github.com/CYBERELLUM/zipminator-pqc`.
- [ ] Capture evidence now, in case it disappears mid-process:
  - [ ] Full-page PDF/screenshot of the repo landing page (shows "Other" license + your code).
  - [ ] Screenshot of the LICENSE / license badge showing the stripped Apache-2.0.
  - [ ] `git clone https://github.com/CYBERELLUM/zipminator-pqc /tmp/infringer-evidence` then
        `git -C /tmp/infringer-evidence log --format='%H %an <%ae> %ai %s' > infringer-commit-log.txt`
        (this captures your name/email in their commit history; store the file outside the repo).
  - [ ] Re-check for forks: `gh api repos/CYBERELLUM/zipminator-pqc/forks --jq '.[].full_name'`
        (each fork is a separate repo and must be listed separately in the notice).
- [ ] Fill the two remaining bracketed fields in `dmca-takedown-github.md`:
      QDaria AS org. number and a phone number.
- [ ] Decide the signing identity: you may sign as the copyright holder yourself, or have
      counsel sign on your behalf (Stage 3). Either is valid for a first notice.

## Stage 1: File the formal DMCA notice (webform, NOT email)

1. Go to **https://github.com/contact/dmca-takedown** while logged in to your GitHub account.
   (Do not email `copyright@github.com` or `support@github.com`; the webform is the channel
   GitHub processes and the one that starts the statutory clock. Prior email requests being
   ignored does not change your rights; it just means email was the wrong channel.)
2. Answer the form questions in order, pasting the matching answers from
   `dmca-takedown-github.md`. The form sections map one-to-one to the headings in that file.
3. For "What files should be taken down," give the repository URL
   `https://github.com/CYBERELLUM/zipminator-pqc` (entire repo).
4. List any forks found in Stage 0 separately.
5. Paste the two required sworn statements verbatim (good-faith belief; accuracy under penalty
   of perjury). The notice is invalid without both.
6. Sign with your full legal name: `Daniel Mo Houshmand`.
7. Submit. **Record the date and time of submission.** Save the confirmation page/email as
   `dmca-submission-receipt-YYYY-MM-DD.pdf`.

### What GitHub does next (their stated process)

- GitHub publishes valid notices to https://github.com/github/dmca and assigns a notice ID.
- GitHub contacts the repository owner and gives them an opportunity to make changes.
- GitHub typically disables the content if the owner does not respond within **~1 business day**
  of being contacted, OR processes the change/removal per their notice handling.
- If the owner files a **counter-notice**, GitHub forwards it to you. The repo is then restored
  after **10 to 14 business days** unless you file a court action and notify GitHub. This is the
  point at which counsel involvement (Stage 3) becomes important.

## Stage 2: If GitHub has not acted within its stated window

Trigger: no removal, no acknowledgement, and no counter-notice forwarded to you after GitHub's
stated handling window (allow **10 business days** from submission to be safe).

1. **Re-file via the same webform**, this time answering "Yes" only if GitHub explicitly asked
   for changes; otherwise answer "No" to the revised-notice question and add a short preface in
   the ownership-description field:

   > This is a follow-up to DMCA notice [original notice ID / submission date], submitted via
   > this form on [date], which has not been acted upon. The infringing repository
   > https://github.com/CYBERELLUM/zipminator-pqc remains live. I am re-filing under GitHub's
   > published DMCA Takedown Policy
   > (https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy) and
   > request processing consistent with that policy and 17 U.S.C. § 512.

2. Reference GitHub's own policy and the original notice ID. Keep the same evidence attachments.
3. If still no action after the follow-up, escalate to a **counsel-letterhead notice** (Stage 3).

## Stage 3: Counsel-letterhead escalation

A notice on a lawyer's letterhead signals you will litigate and is processed with more urgency.
This is also the right vehicle if CYBERELLUM files a counter-notice (you then have ~10 to 14
business days to file suit and notify GitHub, or the content is restored).

1. Engage counsel (US copyright counsel, or your Norwegian IP counsel coordinating with US
   co-counsel, since GitHub Inc. is US-based and the DMCA is US law).
2. Provide counsel with: this runbook, `dmca-takedown-github.md`, `DMCA_DEFENSE.md`, the
   Stage 0 evidence files, and the original submission receipt + notice ID.
3. Counsel sends the letter below (a) to GitHub's DGC / Copyright Agent and (b) optionally to
   CYBERELLUM directly (`laz@goodfellas.agency`) as a cease-and-desist.
4. GitHub's designated DMCA/Copyright Agent of record is listed in GitHub's DMCA policy and on
   the US Copyright Office DMCA Designated Agent Directory
   (https://dmca.copyright.gov/osp/) under "GitHub, Inc." Address the letter there.

### Counsel-letter template

Replace every `[BRACKET]`. This is a template for licensed counsel; it is not legal advice.

```
[LAW FIRM LETTERHEAD]

[Date]

VIA EMAIL AND DMCA WEBFORM
GitHub, Inc.
Attn: Copyright Agent / Designated DMCA Agent
88 Colin P. Kelly Jr. Street
San Francisco, CA 94107, USA
copyright@github.com

Re:  Repeat DMCA Takedown Demand: Infringing Repository
     github.com/CYBERELLUM/zipminator-pqc
     Original notice: [GitHub notice ID], submitted [date]
     Copyright owner: Daniel Mo Houshmand / QDaria AS

Dear Copyright Agent:

This firm represents Daniel Mo Houshmand and QDaria AS ("Rights Holder"), the author and
copyright owner of the software work "Zipminator-PQC" (the "Work"). We write to demand the
removal of an unauthorized, infringing copy of the Work and to follow up on a prior DMCA
notice that has not been actioned.

1. THE WORK. The Work is an original post-quantum cryptography software platform authored by
   the Rights Holder beginning in 2023 and developed continuously thereafter. It is published
   under the Apache License 2.0 at github.com/QDaria/zipminator (created 2023-01-08) and
   github.com/MoHoushmand/zipminator-pqc (created 2025-11-04, public 2026-04-12). The Rights
   Holder's authorship is established by (i) the git commit history, which carries the Rights
   Holder's name and email on every commit; (ii) OpenTimestamps Bitcoin-blockchain proofs of
   commit hashes; and (iii) three patent applications on file with the Norwegian Industrial
   Property Office (Patentstyret), the earliest being application no. 20260384 with priority
   date 2026-03-24.

2. THE INFRINGEMENT. The repository at github.com/CYBERELLUM/zipminator-pqc is a verbatim,
   unauthorized copy of the Work. It was created as a new repository (not a GitHub fork) on or
   about 2026-01-17 and contains the Rights Holder's commits, including the Rights Holder's
   name and email in the commit metadata, republished as the infringer's own. The infringer
   stripped the Apache-2.0 license (replacing it with "Other"), removed all attribution and
   NOTICE material, and added no modification notices, in violation of Section 4 of the Apache
   License 2.0 and of 17 U.S.C. § 106. No license or authorization was granted for this use.

3. PRIOR NOTICE. A DMCA takedown notice ([notice ID]) was submitted through GitHub's webform
   on [date] and remains unactioned as of the date of this letter. The infringing repository
   is still live.

4. DEMAND. Pursuant to 17 U.S.C. § 512(c) and GitHub's published DMCA Takedown Policy, we
   demand that GitHub expeditiously disable access to and remove the infringing repository and
   any forks thereof. We have a good-faith belief that the use of the material is not
   authorized by the copyright owner, its agent, or the law, and we have considered fair use.
   The information in this notice is accurate, and under penalty of perjury, the undersigned is
   authorized to act on behalf of the owner of the exclusive rights infringed.

5. PRESERVATION. We further request that GitHub preserve all logs, account, and access records
   associated with the infringing repository and the user "CYBERELLUM," as they may be relevant
   to anticipated litigation.

Please confirm removal in writing within [5] business days. If a counter-notification is
received, kindly forward it to the undersigned without delay so that the Rights Holder may
exercise its rights under § 512(g), including the filing of a court action.

Respectfully,

[Counsel name]
[Bar no. / jurisdiction]
[Firm], counsel for Daniel Mo Houshmand and QDaria AS
[Email] · [Phone]
```

## Stage 4: After takedown

- [ ] Save GitHub's removal confirmation and the public notice record
      (https://github.com/github/dmca) URL into `docs/ip/`.
- [ ] Re-run the fork check; file separate notices for any forks that appear later.
- [ ] If the infringer re-uploads, file a fresh notice and cite the repeat-infringer provision;
      ask GitHub to apply its repeat-infringer policy to the account.
- [ ] Keep all evidence and receipts; they support the patent record (unauthorized disclosure /
      "evident abuse" under EPC Art. 55) and any later civil claim.

## Notes on tone and channel

- Always use the webform, never plain email, for the statutory notice. Email is only for
  counsel's follow-up letter and for any cease-and-desist sent directly to the infringer.
- Do not negotiate license compliance with CYBERELLUM directly before the takedown is
  processed; their conduct (new repo, stripped license, no attribution) shows bad faith, and
  the requested remedy is full removal, not retroactive attribution.
- Keep statements factual and verifiable. Every claim in the notice traces to `DMCA_DEFENSE.md`.
