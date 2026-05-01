# Zipminator

Global behavior lives in `~/.Codex/AGENTS.md` and `~/.Codex/rules/`. Karpathy guidelines apply (think before coding, simplicity, surgical changes, verifiable goals). This file holds only Zipminator-specific rules that don't exist elsewhere.

## Product (one line)

World's first PQC super-app: 9 pillars of post-quantum encryption (Vault, Messenger, VoIP, Q-VPN, Anonymization, Q-AI, Email, ZipBrowser, Q-Mesh). Canonical status in `docs/guides/FEATURES.md`.

## Python Environment (MANDATORY)

Every Python/pip command runs after:

```bash
micromamba activate zip-pqc
```

Use `uv pip install`, never bare `pip install`. A `PreToolUse` hook (`.Codex/hooks/python-env-guard.sh`) enforces this automatically on Bash.

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

Stack conventions (Next.js 16, shadcn v4, Tailwind v4, QDaria tokens) live in `.Codex/rules/01-stack.md`. PQC + DORA rules live in `.Codex/rules/02-security-pqc.md`. Read these when touching web or crypto.

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

Protocol in `.Codex/rules/tdd-ralph.md`. Quality gates that must pass before "done":

- `cargo test --workspace`
- `cargo clippy --workspace -- -D warnings`
- `cd web && pnpm build` (if web touched)
- `cd app && flutter test` (if mobile touched)
- Playwright screenshot for any UI change

12-iteration cap. Orchestrator: `bash scripts/marathon.sh` (shim into `~/.Codex/scripts/marathon.sh`).

## Session Ownership (multi-session repos)

Check `ps -eo pid,etime,args | grep Codex` before editing. If another session edits this repo:

- One session per branch. Create a worktree if you need to edit in parallel: `git worktree add ../zipminator-<purpose> -b feature/<purpose>`
- Detect collisions: `find ~/.Codex/projects -name "*.jsonl" -mmin -15 -exec grep -l "$(basename $(pwd))" {} \;`
- `pnpm dev` on 3099 is a singleton. If bound (`lsof -nP -iTCP:3099 -sTCP:LISTEN`), reuse it.
- Playwright tests run against a production build (`next build && next start -p 3099`), never against live HMR.
- Never `kill -9` a Codex session; `/exit` so JSONL flushes.

## Session Defaults

- Auto-commit after any code change on the current branch (not main/master). Conventional commits, stage specific files only.
- After every response that changes code: update `docs/guides/FEATURES.md` pillar status and `docs/guides/implementation_plan.md` phase checkboxes.
- PRs are explicit-only (solo dev on main).
- Progress format: `[Pillar N] X% -> Y% | tests: pass/fail | gap: description`.

## IP & Research References

- `docs/ip/` three patents + USPTO + DMCA notes
- `docs/research/` three papers + `eprint/` + supporting briefs

Link by path; never inline into this file.
