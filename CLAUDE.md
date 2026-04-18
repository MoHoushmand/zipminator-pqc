# Zipminator Development Guide

Global rules in `~/.claude/CLAUDE.md` and `~/.claude/rules/` apply. This file documents project-specific overrides only; do not restate global rules (FIPS language, banned words, zero-hallucination, data integrity, collaboration style, git workflow, completion discipline, file/dir discipline, autonomy) here.

## Python Environment (MANDATORY)

Every Python/pip command MUST be preceded by environment activation:

```bash
micromamba activate zip-pqc
```

All pip installs use `uv pip`:

```bash
uv pip install <package>        # NOT pip install
uv pip install -r requirements.txt
uv pip install maturin
```

A `PreToolUse` hook (`.claude/hooks/python-env-guard.sh`) auto-prepends `micromamba activate zip-pqc &&` to Python tooling Bash commands and rewrites bare `pip install` to `uv pip install`. The prose rule above still applies for humans reading this file.

## Product Identity

Zipminator is the world's first PQC super-app, a QCaaS/QCaaP cybersecurity platform with 9 pillars of military-grade encryption infrastructure. It shields device network traffic, stored credentials, and data at rest from both classical and quantum adversaries. It is encryption infrastructure, NOT antivirus/EDR.

The 9 pillars (canonical list in `docs/guides/FEATURES.md`): Quantum Vault & Self-Destruct Storage; PQC Messenger; Quantum VoIP & Video; Q-VPN (PQ-WireGuard); 10-Level Anonymization Suite; Q-AI PQC AI Assistant; Quantum-Secure Email; ZipBrowser (PQC AI Browser); Q-Mesh (Quantum-Secured WiFi Sensing).

## Mandatory Session-Start Reads (EVERY session)

Before answering ANY prompt, read these files to understand the product:

1. `docs/guides/FEATURES.md`, Product spec (9 pillars, code-verified status, pricing)
2. `docs/guides/architecture.md`, System architecture (crypto core, layers)
3. `docs/guides/implementation_plan.md`, Roadmap (9 phases, completion %)
4. `MEMORY.md` (auto-loaded), Cross-session state

## IP and Research References

- `@docs/ip/`: 3 patents (patent-1-quantum-anonymization, patent-2-csi-entropy-puek, patent-3-che-are-provenance), USPTO provisional filing guide, DMCA takedown notes
- `@docs/research/`: 3 matching research papers (paper-1/2/3), `eprint/`, `quantum-anonymization-paper.md`, `quantum-safe-banking-sb1-intelligence-brief.md`
- Do not inline the contents of these folders into this CLAUDE.md; link by path when referencing them

After EVERY response that changes code or status:

- Update the relevant pillar status in `docs/guides/FEATURES.md`
- Update `docs/guides/implementation_plan.md` phase checkboxes
- Note progress in commit message or session summary

## Progress Tracking Protocol

After completing any task, record:

1. Which pillar(s) affected and new % complete
2. Which tests pass/fail (with counts)
3. Any new gaps discovered
4. Files modified

Format: `[Pillar N] X% -> Y% | tests: pass/fail | gap: description`

## Project Structure

- `crates/`, Rust workspace (Kyber768 core, fuzz, NIST-KAT, benchmarks)
- `src/zipminator/`, Python package with PyO3 bindings
- `api/`, FastAPI REST backend
- `web/`, Next.js 16 dashboard (port 3099)
- `tests/`, All tests (Python, Rust, integration)
- `app/`, Flutter mobile app (canonical, v0.5.0+44, iOS + Android + macOS + Linux; 46+ TestFlight builds)
- `mobile/`, legacy Expo React Native starter (not canonical, kept for reference; do not extend)
- `browser/`, Tauri 2.x PQC browser (DMG at `target/release/bundle/dmg/`)
- `browser/app/`, legacy nested Flutter starter (not canonical, kept for reference; do not extend)
- `docs/guides/`, Documentation
- `docs/guides/FEATURES.md`, canonical product spec (single source of truth for pillar status)
- `grants/`, Grant templates (10 institutions)
- `_archive/`, Archived docs (old FEATURES.md versions, etc.)

## Build Commands

```bash
# Rust
cargo test --workspace
cargo build --release

# Python (with Rust bindings); ALWAYS activate env first
micromamba activate zip-pqc
uv pip install maturin
maturin develop

# API
micromamba activate zip-pqc
cd api && uv pip install -r requirements.txt && uvicorn src.main:app

# Web
cd web && pnpm install && pnpm dev

# Mobile (Flutter canonical)
cd app && flutter pub get && flutter run

# Legacy Expo (not canonical; kept for reference only)
# cd mobile && pnpm install && npx expo start

# Full stack
docker-compose up
```

## Testing (TDD-First, Red/Green/Refactor)

```bash
cargo test --workspace          # Rust tests (268 passed, includes browser/src-tauri)
micromamba activate zip-pqc && pytest tests/
cargo fuzz run fuzz_keygen      # Fuzzing
cd web && pnpm build            # Next.js build check
cd app && flutter test          # Flutter unit + widget tests (canonical mobile)
```

## Web Dev Server

```bash
cd web && pnpm dev    # runs on port 3099
```

- OAuth: `AUTH_URL=http://localhost:3099` in `web/.env.local` (production: `https://www.zipminator.zip`)
- Providers: GitHub, Google, LinkedIn (credentials in `.env.local`, all callback URLs registered)
- Auth config: `web/lib/auth.ts` (next-auth v5 beta)

## Key Architecture Decisions

- Rust Kyber768 is the crypto engine, exposed to Python via PyO3/maturin
- Entropy pool aggregates from Rigetti, IBM Quantum, QBraid with OS fallback
- PII scanning runs automatically before encryption (configurable)
- Self-destruct uses DoD 5220.22-M 3-pass overwrite

## Code Conventions

- Rust: clippy clean, no unsafe, constant-time crypto ops
- Python: ruff + black, type hints, pytest, `uv pip` only
- TypeScript: strict mode, no `any`
- Max file length: 500 lines

## RALPH Loop (Mandatory Iteration Protocol)

Core protocol in `.claude/rules/tdd-ralph.md`. Project-specific quality gates that must ALL pass before "done":

- `cargo test --workspace` (Rust, 268 tests)
- `cd web && pnpm build` (web, if touched)
- `cd app && flutter test` (mobile Flutter, if touched)
- `cd browser/src-tauri && cargo test` (browser, if touched)
- `cargo clippy --workspace -- -D warnings`
- Playwright screenshot for any UI change
- No private keys in code; constant-time crypto ops verified

Iteration cap: 12 per task, then escalate. Script: `bash scripts/marathon.sh --prompt-version v6.1` (shim into `~/.claude/scripts/marathon.sh`).

## Session Defaults

- After any task that modifies code, auto-commit without asking. Conventional commits `type(scope): description`. Stage only relevant files. Do NOT push unless explicitly asked.
- Session-start: `git status`, then `micromamba activate zip-pqc` before any Python command.
- PRs are NOT default for this project (solo dev on main). Create PRs only when explicitly asked or when CI gates are needed.
- Local git identity: `QDaria` / `mo@qdaria.com` (set per-repo in `~/dev/qdaria/*`). See global git identities section for rationale.

## Progress Tracking Files

- Completed task history: `docs/guides/TASK_HISTORY.md`
- Auto-memory: `.claude/projects/.../memory/MEMORY.md` (cross-session state, loaded automatically)
- Pillar status: `docs/guides/FEATURES.md` (code-verified percentages, single source of truth)
- Roadmap: `docs/guides/implementation_plan.md` (10 phases with completion %)

Read on demand, not every session. `MEMORY.md` is auto-loaded and has the summary.

## Session Ownership (multi-session coordination)

If `ps -eo pid,etime,args | grep claude | grep -v grep` shows more than one live session touching this repo, apply these rules BEFORE editing any file.

- One session per branch. If another session's JSONL is also editing the same active branch, do NOT edit the same files. Either `/exit` if your task overlaps, or `git worktree add ../zipminator-<purpose> -b feature/<purpose>` and switch edits to the new worktree.
- Detect collisions: `find /Users/mom5/.claude/projects -name "*.jsonl" -mmin -15 -exec grep -l "$(basename $(pwd))" {} \;` shows sessions active in this repo within the last 15 minutes.
- Dev server is singleton. Only one session runs `pnpm dev` on port 3099. Other sessions read from the running server. If port 3099 is already bound (`lsof -nP -iTCP:3099 -sTCP:LISTEN`), do not respawn; use it.
- Playwright + HMR is read-only. Automated browser tests run against a production build (`next build && next start -p 3099`) or a frozen branch, never against the live HMR dev server being edited by another session. Screenshots during HMR can capture transient half-render states (e.g., Framer Motion `opacity:0` initial state before hydration) and mislead debugging.
- Auto-commit only on the branch you own. `wip:` commits are allowed, but only on the branch this session is the sole editor of. If another session has uncommitted edits to the same branch, coordinate via the user; do not stack commits blindly.
- Exit cleanly; never `kill -9`. `/exit` from the TUI so JSONL flushes and memory writes complete. SIGKILL can corrupt the session log and auto-memory file.
