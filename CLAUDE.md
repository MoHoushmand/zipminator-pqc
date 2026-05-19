# Zipminator

Global behavior lives in `~/.claude/CLAUDE.md` and `~/.claude/rules/`. Karpathy guidelines apply (think before coding, simplicity, surgical changes, verifiable goals). This file holds only Zipminator-specific rules that don't exist elsewhere.

## Product (one line)

World's first PQC super-app: 9 pillars of post-quantum encryption (Vault, Messenger, VoIP, Q-VPN, Anonymization, Q-AI, Email, ZipBrowser, Q-Mesh). Canonical status in `docs/guides/FEATURES.md`.

## Python Environment (MANDATORY)

Every Python/pip command runs after:

```bash
micromamba activate zip-pqc
```

Use `uv pip install`, never bare `pip install`. A `PreToolUse` hook (`.claude/hooks/python-env-guard.sh`) enforces this automatically on Bash.

## Project Layout

- `crates/` Rust workspace (Kyber768 core + PyO3 bindings via maturin)
- `web/` Next.js 16 dashboard on port 3099 (auth: next-auth v5 beta)
- `app/` Flutter mobile (canonical; iOS/Android/macOS/Linux)
- `browser/` Tauri 2.x PQC browser
- `api/` FastAPI REST backend
- `tests/` Python + integration
- `docs/guides/FEATURES.md` single source of truth for pillar status
- `_archive/` archived docs (don't delete; archive)

Legacy folders kept for reference only, do not extend: `mobile/` (old Expo), `browser/app/` (old Flutter).

## Stack & Security Rules

Stack conventions (Next.js 16, shadcn v4, Tailwind v4, QDaria tokens) live in `.claude/rules/01-stack.md`. PQC + DORA rules live in `.claude/rules/02-security-pqc.md`. Read these when touching web or crypto.

## Authentication & Onboarding (load-bearing invariant)

This is a hard rule. Future sessions, linters, and auto-formatters keep trying to undo it. **Do not.**

**Default @handle = OAuth email prefix. Never the user's legal name.** When a user signs in for the first time via OAuth (Google, Apple, GitHub, LinkedIn) or email, `_ensureUsernameFromEmail` in `app/lib/core/providers/auth_provider.dart` sets `user_metadata.username` to the email prefix (lowercased, sanitized to `a-z 0-9 . _ -`). Examples:

- `mo@qdaria.com` → `@mo`
- `dmo.houshmand@gmail.com` → `@dmo.houshmand`
- `alice+spam@example.org` → `@alice.spam`

The user can rename their @handle at any time via Profile → Username card → **Change** (`app/lib/features/auth/profile_screen.dart:152-157`). `/onboarding` is still wired and the router still falls back to it if for any reason the auto-default fails, but in practice users land on `/home` straight after OAuth.

**Forbidden code path:** any function that derives `user_metadata.username` from `user_metadata.full_name` (or `name`, `given_name`, `family_name`). `full_name` is the user's **legal name** from the OAuth profile. Slugifying it produces `@daniel.mo.houshmand` for users named "Daniel Mo Houshmand" who would expect `@mo` from their email. This was the f099ff5 regression on 2026-05-01. Source is constrained to `user.email`. Test `app/test/auth_invariant_test.dart` enforces this in CI.

**The three identity layers in Supabase, kept distinct:**

| Layer | Source | Mutable by user? | Used for |
|---|---|---|---|
| `user.email` | OAuth provider, immutable | No | Account identity, login |
| `user_metadata.full_name` | OAuth profile | Yes (Profile screen) | Display name (real-name field) |
| `user_metadata.username` | Auto-defaulted to email prefix on first sign-in | Yes (Profile → Change) | Public @handle |

**If you find yourself adding back any of:** `deriveUsername`, `slugFromName`, or any code that reads `full_name` and writes `username` — **stop and re-read this section.** Only `_ensureUsernameFromEmail` is authorized to set the initial `username`, and only from `user.email`.

## Build & Test

```bash
cargo test --workspace                # Rust (438+ tests)
micromamba activate zip-pqc && pytest tests/
cd web && pnpm dev                    # port 3099
cd web && pnpm build                  # verify after any web change
cd app && flutter test                # 60 tests
cd browser/src-tauri && cargo test    # 179 tests
```

## RALPH Loop

Protocol in `.claude/rules/tdd-ralph.md`. Quality gates that must pass before "done":

- `cargo test --workspace`
- `cargo clippy --workspace -- -D warnings`
- `cd web && pnpm build` (if web touched)
- `cd app && flutter test` (if mobile touched)
- Playwright screenshot for any UI change

12-iteration cap. Orchestrator: `bash scripts/marathon.sh` (shim into `~/.claude/scripts/marathon.sh`).

## Session Ownership (multi-session repos)

Check `ps -eo pid,etime,args | grep claude` before editing. If another session edits this repo:

- One session per branch. Create a worktree if you need to edit in parallel: `git worktree add ../zipminator-<purpose> -b feature/<purpose>`
- Detect collisions: `find ~/.claude/projects -name "*.jsonl" -mmin -15 -exec grep -l "$(basename $(pwd))" {} \;`
- `pnpm dev` on 3099 is a singleton. If bound (`lsof -nP -iTCP:3099 -sTCP:LISTEN`), reuse it.
- Playwright tests run against a production build (`next build && next start -p 3099`), never against live HMR.
- Never `kill -9` a Claude session; `/exit` so JSONL flushes.

## Session Defaults

- Auto-commit after any code change on the current branch (not main/master). Conventional commits, stage specific files only.
- After every response that changes code: update `docs/guides/FEATURES.md` pillar status and `docs/guides/implementation_plan.md` phase checkboxes.
- PRs are explicit-only (solo dev on main).
- Progress format: `[Pillar N] X% -> Y% | tests: pass/fail | gap: description`.

## IP & Research References

- `docs/ip/` three patents + USPTO + DMCA notes
- `docs/research/` three papers + `eprint/` + supporting briefs

Link by path; never inline into this file.
