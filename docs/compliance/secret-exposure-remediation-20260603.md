# Secret-Exposure Remediation Plan — 2026-06-03

Track Sec, marathon program. **Plans only — nothing executed.** No secrets were
read, printed, or committed. No git history was rewritten. The user performs all
rotations and any human-gated history operations.

---

## 1. `web/.env -> ../.env` symlink (operational over-exposure)

### What was found
```
web/.env  ->  ../.env        (relative symlink to the repo-root .env)
```
- The symlink resolves to `/Users/mos/dev/qdaria/zipminator/.env` (the root env).
- It is **gitignored** (`web/.gitignore:27 .env`, root `.gitignore` covers
  `.env`, `.env.*`, `*.env`) and **was never committed** — confirmed
  `git log --all -- web/.env .env` is empty. **No git-history leak.**
- The risk is **operational**: Next.js auto-loads `.env`, so building/running the
  web app loads the **entire root `.env`**. Per `.env.template`, the root env
  holds non-web secrets — `IBM_QUANTUM_TOKEN`, `QBRAID_API_KEY`,
  `OPENROUTER_API_KEY`, Flask config — which the web app never needs. Any of
  those in process env during a Next build widens blast radius (e.g. accidental
  inlining, log capture, leaking into a server bundle).

### Vars the web app actually needs
From `grep process.env.*` in `web/` plus `web/.env.example`:

Server-only:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`, `GEMINI_MODEL`, `VEO_MODEL`, `VIDEO_QUALITY`, `VIDEO_FPS`, `VIDEO_MODEL`
- `RESEND_API_KEY`, `SALES_EMAIL`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`
- `WEB_URL`, `AUTH_COOKIE_DOMAIN`, `AUTH_APPLE_ENABLED`, `MARATHON_TARGET_URL`

Client-exposed (`NEXT_PUBLIC_*`, ship in the browser bundle — keep minimal):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA_ID`

Nothing from the IBM/qBraid/OpenRouter/Flask set is referenced by `web/`.

### Fix (user executes — do NOT run as part of this audit)
1. Remove the symlink: `rm web/.env`
2. Create a real, web-scoped, gitignored file from the existing example:
   `cp web/.env.example web/.env.local` then fill values.
   - `web/.gitignore` already ignores `.env*.local` (line 26) and `.env`
     (line 27), so `.env.local` will not be committed — verified with
     `git check-ignore web/.env.local`.
3. Populate `web/.env.local` from Vercel (the documented source of truth — see
   `web/.env.example` header "Production values live in Vercel"):
   `vercel env pull web/.env.local` (or `vercel env add <NAME> development` per
   var). Only the ~17 vars listed above; do not copy the root-env quantum/LLM
   tokens.
4. Confirm Next picks up `.env.local` over `.env`: with no `web/.env` present,
   Next loads `.env.local` automatically; verify `cd web && pnpm build` succeeds
   and that no IBM/qBraid/OpenRouter var is referenced.

### Rotation note
Because the symlink has exposed the root secrets to the web build/runtime
environment historically, treat the root-env credentials
(`IBM_QUANTUM_TOKEN`, `QBRAID_API_KEY`, `OPENROUTER_API_KEY`) as candidates for
rotation if the web build context was ever shipped to a third party (e.g. a CI
log, a Vercel build that pulled the root env). **User decision; this audit does
not rotate keys.**

---

## 2. Auto-commit secret-scan backstop + unstage globs

Confirmed in the working-tree `.claude/helpers/auto-commit.sh`:

- **Unstage globs present** (`UNSTAGE_PATTERNS`): includes `.env`, `*.key`,
  `*.pem`, `.env.local`, `*/.env.local`, `*.env.local`, `web/.env`, `*.p12`,
  `*.p8`, `*.keystore`, `*/e2e/.auth/*`, plus binaries/caches. These are
  `git reset HEAD`-unstaged after the broad `git add`, so env/key files cannot be
  auto-committed.
- **Secret-scan backstop present** (lines 56–66): after staging+filtering, it
  greps the staged diff (`git diff --cached -U0`, added lines only) for live-secret
  signatures — PEM `PRIVATE KEY` blocks, AWS `AKIA…`, OpenAI `sk-…`, SendGrid
  `SG.…`, Resend `re_…`, JWT `eyJ….….`. On a match it aborts the commit and runs
  `git reset HEAD -- .`. Names/patterns only; safe.

### Gap to close (user)
The improved version **lives in the main working tree but is not committed.** The
version committed at this branch's base (the tracked `.claude/helpers/auto-commit.sh`)
**lacks the secret-scan backstop and the expanded globs**. Until the working-tree
version is committed, a fresh checkout / another worktree / CI runs the weaker
script. Recommendation: commit the working-tree `auto-commit.sh` so the backstop
is the version of record. (Not done here — this branch is reports-only and the
file is outside the report scope.)

Optional hardening: add `ghp_…`/`github_pat_…` and high-entropy base64 detection
to the backstop regex; consider `gitleaks`/`trufflehog` as a pre-commit hook for
defense in depth.

---

## 3. Session-transcript scrub plan (`docs/guides/session-transcripts/*.html`)

### What was found
- Main working tree: **~1,100 transcript HTML files, ~61 MB**, in
  `docs/guides/session-transcripts/`.
- They are now **gitignored** (`.gitignore:401 docs/guides/session-transcripts/`)
  — `git check-ignore` confirms current files are ignored.
- **Current `HEAD`, `origin/main`, and `public/main` trees contain ZERO transcript
  HTML files** — they were removed before those branch tips. The public default
  branch (`QDaria/zipminator`) is clean.
- **But 78 transcript HTML files exist in git HISTORY** (added by auto-commit
  before the gitignore rule, e.g. commit `0d165e6` "auto-commit 76 files"). Those
  history commits are reachable from non-default branches, primarily
  `origin/claude/clarify-requirements-VWpqG` (a feature branch on the private
  origin). They are NOT on `origin/main`/`public/main`.

### Secret-signature scan of the history blobs (counts only, values masked)
Scanned the 78 historical transcript blobs for token signatures:
- 2 files matched a signature: `e3b92ebf.html` (AWS `AKIA…` regex) and
  `2fb0d8ff.html` (JWT-shaped string).
- On masked inspection, the `AKIA…` hit is on a line that is itself describing the
  detection regex inside a conversation summary ("Context: This summary will be
  shown…"), i.e. the **pattern is being discussed**, not a live key. The JWT hit
  did not resolve to a recoverable credential after masking. **Assessment:
  low-confidence / likely false positives, not confirmed live secrets.** This was
  a signature scan, not an exhaustive content review.

### Risk rating
**Medium-low.** Public default branch is clean; residual exposure is old commits
on a private feature branch, with no confirmed live secret. The principal issue
is repo bloat (61 MB of conversation logs that "may include secrets" per the
gitignore comment) and the latent possibility of an un-flagged secret in 78 HTML
files that were not exhaustively read.

### Recommendation (human-gated — do NOT run)
1. **Keep the gitignore** (already in place) so no new transcripts are committed.
   Verify the committed auto-commit.sh also excludes them (it stages only
   whitelisted source extensions; HTML is whitelisted, so add
   `docs/guides/session-transcripts/*` to its unstage globs as belt-and-suspenders).
2. **Do not rewrite `origin/main`/`public/main`** — they have no transcript files;
   a rewrite there is unnecessary and disruptive.
3. **For the private feature branch(es)** that still carry the 78 blobs
   (`claude/clarify-requirements-VWpqG` and any siblings): either delete the stale
   branch if it is no longer needed (simplest, removes reachability), or, if it
   must be preserved, run a history rewrite scoped to those refs:
   ```
   git filter-repo --path docs/guides/session-transcripts/ --invert-paths
   ```
   on a fresh clone, then force-push the rewritten branch and have collaborators
   re-clone. This is **human-gated**; coordinate before any force-push.
4. Before any rewrite, do a **full content review** of the 78 files (not just a
   signature scan) for SUPABASE_SERVICE_ROLE_KEY, bearer tokens, App Store keys,
   etc., and rotate anything real that is found.

No files were removed, no history was rewritten, no branches were deleted.
