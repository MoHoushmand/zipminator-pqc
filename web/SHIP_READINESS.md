# web/ Ship Readiness

Track B of the parallel ship-readiness effort for zipminator.com.
Scope: `web/` only (Next.js landing + dashboard). Does not cover root-level Next.js app, `app/` Flutter, `browser/` Tauri, or `api/` FastAPI.

## 1. Local Build Status

Verified 2026-04-21 from branch `worktree-agent-a4e5db20`.

- Installed: `pnpm install --no-frozen-lockfile --ignore-workspace` in `web/`.
  - `--ignore-workspace` required because this worktree lives at `.claude/worktrees/agent-a4e5db20/web`, which is not matched by the parent `/Users/mom5/dev/qdaria/pnpm-workspace.yaml` glob (`products/zipminator/web`). Without the flag, pnpm installs against siblings (qdaria-astro-new, etc.) and leaves this web/ without `node_modules`.
  - `--no-frozen-lockfile` mirrors `web/vercel.json`; frozen fails at the parent-workspace level because `qdaria-astro-new/package.json` dropped 3 deps (`@auth/core@^0.37.4`, `astro-auto-import`, `auth-astro`) that are still pinned in the shared lockfile.
- Built: `pnpm build` succeeds (`next build`, Next 15.5.15).
  - 33 routes compiled (app/): 27 static, 6 dynamic.
  - Middleware compiled (87.7 kB) wiring `/dashboard/:path*` and `/mail/:path*` through next-auth.
  - Warnings (non-fatal): `jose` uses `DecompressionStream` in Edge Runtime; ESLint skipped per `next.config.js` (`eslint.ignoreDuringBuilds: true`).
- Dev server: `pnpm dev` runs on port 3099 (unchanged from prior).

Status: green. Matches recent Vercel Ready deploys (see section 4).

## 2. Required Environment Variables

Values are held in Vercel (project: `qdarias-projects/zipminator-pqc`). They are NOT in this repo's tracked files.

### Runtime (used by Next.js server + edge)

Referenced in web/ source:

- `NEXT_PUBLIC_SUPABASE_URL` - used in `web/lib/supabase.ts`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - used in `web/lib/supabase.ts`.
- `NEXT_PUBLIC_GA_ID` - used in `web/lib/analytics.ts`.

### next-auth v5 (auto-discovered by provider factories)

`web/lib/auth.ts` calls `GitHub`, `Google`, `LinkedIn` with no args; next-auth reads these from `process.env` at request time. They are required for OAuth to work in production but do NOT gate the build:

- `AUTH_SECRET` - JWT signing secret.
- `AUTH_URL` - `https://www.zipminator.zip` in prod; `http://localhost:3099` for local dev.
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- `AUTH_LINKEDIN_ID`, `AUTH_LINKEDIN_SECRET`.

OAuth callback URLs registered: `/api/auth/callback/github`, `/api/auth/callback/google`, `/api/auth/callback/linkedin` (all under `AUTH_URL`).

### Build-time (scripts only, not Next.js runtime)

- `GEMINI_API_KEY`, `VIDEO_QUALITY`, `VIDEO_FPS`, `VIDEO_MODEL` - used only by `web/scripts/*` video-generation helpers. Not required for `next build`.

### E2E (local test runner only)

- `WEB_URL` - used by `web/e2e/dashboard.spec.ts` and `web/e2e/oauth.spec.ts`.

### Note on .env.example drift

`web/.env.example` currently lists only the Gemini video keys. It omits the Supabase, GA, and AUTH_* keys documented above. This is a documentation gap, not a build blocker; Vercel env is the source of truth. Fix in a later pass if needed.

## 3. Commit-Email-Verification Procedure

Vercel's Git integration rejects production deploys with `Error (0ms)` when the HEAD commit's author email is not a verified email on the connected GitHub account. Symptom: recent failing deploys web-n32ftn935, web-7i7mx3m9x, web-hnmp9vhfe.

### Verify before pushing

```bash
# Check the commit email HEAD will deploy with
git -C /Users/mom5/dev/qdaria/products/zipminator/.claude/worktrees/agent-a4e5db20 log -1 --format='%ae'
# Expected for ~/dev/qdaria/*: mo@qdaria.com (set per-repo by local git config)
```

### Verify on GitHub

1. Open https://github.com/settings/emails while signed in as the account connected to Vercel.
2. Confirm `mo@qdaria.com` appears under "Primary email address" or "Backup email addresses" AND has the green "Verified" badge.
3. If not verified: use the "Resend verification email" control and complete the flow. Only after verification will Vercel accept commits authored by that email.

### Verify the Vercel-to-GitHub connection

1. https://vercel.com/qdarias-projects/zipminator-pqc/settings/git
2. "Connected Git Repository" should list a GitHub repo owned by the GitHub account whose emails were checked above.
3. If the connection is via a different GitHub user, either: switch the Vercel connection, or add the email `mo@qdaria.com` as verified on THAT GitHub account.

### Fallback if email cannot be verified short-term

Use the Vercel CLI directly from this machine (bypasses GitHub Git integration):

```bash
cd /Users/mom5/dev/qdaria/products/zipminator/.claude/worktrees/agent-a4e5db20/web
vercel --prod --scope qdarias-projects
```

CLI deploys are attributed to the Vercel user (`qdaria`), not the git commit author, and do not require GitHub email verification.

## 4. Vercel Project Owning the Domain

Canonical project: `qdarias-projects/zipminator-pqc`. Production URL: `https://zipminator.zip`.

Current Vercel project inventory under `qdarias-projects` (relevant entries):

| Project | Production URL | Status |
|---|---|---|
| zipminator-pqc | https://zipminator.zip | canonical; 3 Ready production deploys 5d old |
| web | https://web-qdarias-projects.vercel.app | legacy |
| zipminator | https://zipminator.vercel.app | legacy |

Recent zipminator-pqc deployments (per `vercel ls zipminator-pqc`): 5d-old production trio all Ready, plus 6 Ready preview deploys in the last 2d. No recent production failures visible at the CLI level in this scope.

### Domain rebinding (only if needed)

```bash
# Remove from a legacy project
vercel domains rm zipminator.zip --scope qdarias-projects
# Attach to canonical
vercel domains add zipminator.zip zipminator-pqc --scope qdarias-projects
```

Do not run unless the domain is confirmed bound to the wrong project.

## 5. Rollback Procedure

If a new production deploy on `zipminator-pqc` regresses:

### UI path (fastest)

1. https://vercel.com/qdarias-projects/zipminator-pqc/deployments
2. Filter by Environment = Production, find the last known-good Ready deploy (5d-old trio is the current anchor).
3. Click the "..." menu on that deployment, then "Promote to Production".
4. Confirm in modal. The alias at `zipminator.zip` repoints within seconds; no rebuild.

### CLI path

```bash
# List recent production deploys and pick the target URL
vercel ls zipminator-pqc --scope qdarias-projects | grep Production

# Promote chosen deployment to zipminator.zip
vercel promote <deployment-url> --scope qdarias-projects
```

### Post-rollback

- Verify: `curl -I https://zipminator.zip` returns 200 and the expected build ID header.
- Confirm the promoted deployment's commit SHA matches what was intended (check the deployment's "Source" metadata in the Vercel UI).
- Open a tracking note for the regression before resuming forward deploys.

## 6. Blockers

- `mo@qdaria.com` verified-on-GitHub status is not confirmable from CLI alone; manual check at https://github.com/settings/emails is required before the next Git-triggered production deploy can succeed. See section 3.
- `web/.env.example` drift (section 2) is a documentation gap. Not a ship blocker.
