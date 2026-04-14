# Zipminator Development Guide

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

- `crates/` -- Rust workspace (Kyber768 core, fuzz, NIST-KAT, benchmarks)
- `src/zipminator/` -- Python package with PyO3 bindings
- `api/` -- FastAPI REST backend
- `web/` -- Next.js dashboard (port 3099)
- `tests/` -- All tests (Python, Rust, integration)
- `mobile/` -- Expo React Native app
- `browser/` -- Tauri 2.x PQC browser (DMG at target/release/bundle/dmg/)
- `docs/guides/` -- Documentation
- `docs/guides/FEATURES.md` -- **Canonical product spec** (single source of truth for pillar status)
- `docs/guides/claude-flow-v3/` -- Orchestration guide (RALPH, agent teams, skills, recipes)
- `grants/` -- Grant templates (10 institutions)
- `_archive/` -- Archived docs (old FEATURES.md versions, etc.)

## Build Commands

```bash
# Rust
cargo test --workspace
cargo build --release

# Python (with Rust bindings) -- ALWAYS activate env first
micromamba activate zip-pqc
uv pip install maturin
maturin develop

# API
micromamba activate zip-pqc
cd api && uv pip install -r requirements.txt && uvicorn src.main:app

# Web
cd web && npm install --legacy-peer-deps && npm run dev

# Mobile
cd mobile && npm install && npx expo start

# Full stack
docker-compose up
```

## Testing (TDD-First -- Red/Green/Refactor)

```bash
cargo test --workspace          # Rust tests (268 passed, includes browser/src-tauri)
micromamba activate zip-pqc && pytest tests/  # Python tests
cargo fuzz run fuzz_keygen      # Fuzzing
cd web && npm run build         # Next.js build check
cd mobile && npm test           # Expo tests (11/11 suites)
```

## Web Dev Server

```bash
cd web && npm run dev    # runs on port 3099
```

- OAuth: AUTH_URL=<http://localhost:3099> in web/.env.local (production: <https://www.zipminator.zip>)
- Providers: GitHub, Google, LinkedIn (credentials in .env.local, all callback URLs registered)
- Auth config: web/lib/auth.ts (next-auth v5 beta)

## Key Architecture Decisions

- Rust Kyber768 is the crypto engine, exposed to Python via PyO3/maturin
- Entropy pool aggregates from Rigetti, IBM Quantum, QBraid with OS fallback
- PII scanning runs automatically before encryption (configurable)
- Self-destruct uses DoD 5220.22-M 3-pass overwrite

## Code Conventions

- Rust: clippy clean, no unsafe, constant-time crypto ops
- Python: ruff + black, type hints, pytest, uv pip only
- TypeScript: strict mode, no any
- Max file length: 500 lines

## Data Integrity Rules (MANDATORY)

- NEVER add mock data, fake metrics, or unverified claims (e.g., "1000 downloads", "500 users")
- All numbers in UI, pitch deck, and docs must be verifiable or clearly labeled as projections/targets
- If a metric doesn't exist yet, use "N/A", "Coming soon", or omit it entirely
- Traction slides: only include metrics that can be proven (git commits, test counts, lines of code, npm downloads)
- Financial projections must be labeled "Projected" or "Target" -- never stated as fact
- 0% hallucination tolerance: every claim must have a verifiable source or be removable on challenge

## FIPS Compliance Language

- SAFE: "Implements NIST FIPS 203 (ML-KEM-768)" -- factual algorithm claim
- SAFE: "Verified against NIST KAT test vectors"
- NEVER: "FIPS 140-3 certified/validated" -- requires CMVP certificate ($80-150K)
- NEVER: "FIPS compliant" -- ambiguous, triggers red flags in federal procurement
- See grants/README.md for certification cost ladder

---

## Orchestration (actually installed)

No MCP servers are currently registered (`claude mcp list` confirms empty at user, project, and local scopes). Orchestration comes from Claude Code native features plus installed plugins.

### What's actually running

- **Native Claude Code**: agent teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), worktree isolation, extended thinking (128K via `MAX_THINKING_TOKENS`), parallel `Agent` dispatch, `TaskCreate`/`TaskUpdate`, plan mode.
- **Plugins enabled** (52 total, see `~/.claude/settings.json`): `ecc` (everything-claude-code), `superpowers` (claude-plugins-official), `andrej-karpathy-skills`, `agent-sdk-dev`, `plugin-dev`, `hookify`, `pr-review-toolkit`, `mcp-server-dev`, `vercel`, 12 language LSPs.
- **User skills** (`~/.claude/skills/`): `quantum-peer-reviewer`, `research-paper-writer`, `skill-artisan`.
- **RALPH loop**: documented in `docs/guides/claude-flow-v3/`; `scripts/ralph-loop.sh` is the active iteration driver. Ruflo CLI commands in that guide are historical reference only.

### If ruflo is ever needed later

One command re-enables it:

```bash
claude mcp add ruflo -- npx ruflo@latest mcp start
```

Do not run until a concrete task needs hive-mind consensus (paper review, parallel security audit). For normal coding work, native parallel `Agent` + worktree isolation matches what ruflo's queen-worker pattern delivers with fewer moving parts.

---

## Claude Code Superpowers (v2.1.70)

### Agent Teams (always enabled)

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

- Shared task list with dependency tracking
- Direct inter-agent messaging
- Plan approval gates
- TeammateIdle and TaskCompleted hooks

### Worktree Isolation

Subagents with `isolation: "worktree"` get their own git branch. Safe parallel editing.

### Extended Thinking (Three Tiers)

- **think** (~4K tokens): routine debugging, quick fixes
- **megathink** (~10K tokens): API design, performance optimization, architecture review
- **ultrathink** (up to 128K tokens on this machine): system architecture, critical production bugs, crypto code, security audits
- Trigger via keywords in prompt. Toggle with `Tab` key.
- Global shell default (see `~/.zshrc`): `claude` launches with `--effort max` + `MAX_THINKING_TOKENS=128000`, so the full 128K budget is available every session without needing to type `ccmax`. The stock API ultrathink tier is ~32K; the 128K here is a per-shell override.

### Plan Mode

- `Shift+Tab` cycles: normal -> auto-accept -> plan mode
- In plan mode: reads files, answers questions, no changes made
- `Ctrl+G` opens plan in text editor for direct editing
- Workflow: Explore (plan) -> Plan (plan) -> Implement (normal) -> Commit

### 1M Context Window

Available on Max plan with Opus 4.6. Disable with `CLAUDE_CODE_DISABLE_1M_CONTEXT`.

### Key Slash Commands

- `/pair-programming` -- Navigator/Driver TDD mode
- `/hive-mind-advanced` -- Queen-led multi-agent coordination
- `/sparc-methodology` -- SPARC TDD (Specification, Pseudocode, Architecture, Refinement, Completion)
- `/verification-quality` -- Truth scoring with automatic rollback
- `/simplify` -- Code review for reuse, quality, efficiency
- `/go` -- Session startup routine (reads state, runs tests, browser check)
- `/compact <instructions>` -- Proactively compact context at ~70% usage
- `/clear` -- Fresh context between unrelated tasks
- `/rewind` -- Undo conversation steps, restore code

### Keyboard Shortcuts

- `Esc` -- stop mid-action (context preserved)
- `Esc+Esc` -- rewind menu (restore conversation, code, or both)
- `Shift+Tab` -- cycle modes (normal/auto-accept/plan)
- `Tab` -- toggle extended thinking
- `Ctrl+T` -- task list
- `Shift+Down` -- cycle agent team teammates

### Prompt Notation

- `@<filename>` -- reference files
- `#<content>` -- add to CLAUDE.md
- `!<command>` -- execute shell command
- `& <task>` -- background task

### MCP Servers (not currently registered)

`claude mcp list` returns empty. Playwright and context7 are available as plugin-provided tools (`plugin:ecc:playwright`, `plugin:ecc:context7`), not as separately registered MCP servers. Register ruflo/ruv-swarm only when a concrete task needs them.

---

## RALPH Loop (Mandatory Iteration Protocol)

Every non-trivial task follows RALPH. Max 12 iterations, then escalate.

```
R - Research    Read specs, existing code, spawn researcher subagents
A - Architecture   Design solution, get user approval if non-trivial
L - Logic       TDD: write failing test first, implement, verify green
P - Polish      /simplify, remove dead code, clean naming
H - Harden      Security audit, cargo test, pytest, Playwright screenshot
```

### Quality Gates (must ALL pass before "done")

- [ ] cargo test --workspace passes
- [ ] pytest tests/ passes (if Python touched)
- [ ] npm run build passes (if web touched)
- [ ] Playwright screenshot verifies visual output
- [ ] No console errors in browser
- [ ] No private key leaks in code
- [ ] Constant-time crypto ops verified

### Automating RALPH

```bash
bash docs/guides/claude-flow-v3/scripts/ralph-loop.sh
```

---

## Zero-Hallucination Protocol

### Claim Verification (MANDATORY)

- NEVER state unverified facts about external systems, libraries, or APIs
- ALWAYS verify claims with: WebFetch, WebSearch, context7 docs lookup, or source code reading
- If uncertain: state "I cannot verify this" and ask user for source
- Use AskUserQuestion as DEFAULT when multiple valid approaches exist

### Citation Protocol

- Verify DOI resolves before citing: `WebFetch https://doi.org/[DOI]`
- Verify arXiv exists: `WebFetch https://arxiv.org/abs/[ID]`
- Cross-check: title, authors, year, journal must match
- NEVER invent citation keys or guess DOIs

### Critical Claim Critique

Before delivering ANY result:

1. Re-read your output for unsupported claims
2. Flag speculative statements with "[unverified]"
3. Run code to prove it works -- NEVER say "it should work"
4. Take Playwright screenshots as proof of visual output

---

## Context Engineering Protocol

### Session Startup (auto via /go)

1. Read CLAUDE.md + MEMORY.md
2. Check git status for uncommitted work
3. Load relevant task tracker state
4. Run quick verification sweep (cargo test, npm build)

### AskUserQuestion (DEFAULT behavior)

Use AskUserQuestion tool proactively when:

- Multiple valid implementation approaches exist
- Architecture decisions have trade-offs
- User intent is ambiguous
- Destructive or irreversible actions are about to happen
- Business logic choices need domain knowledge

### Interview Pattern (for large features)

For complex tasks, start with: "Interview me about [feature] using AskUserQuestion. Ask about technical implementation, edge cases, concerns, and tradeoffs. Keep interviewing until we've covered everything, then write a spec." Then start a fresh session to execute with clean context.

### Writer/Reviewer Pattern

For quality-critical code: Session A implements, Session B reviews (fresh context prevents bias). Alternative: Session A writes tests, Session B writes code to pass them.

### Context Window Management

- Start fresh sessions per task; `/clear` between unrelated tasks
- `/compact <instructions>` proactively at ~70% context usage
- Delegate research to subagents (they explore in separate windows, return summaries)
- After two failed corrections: `/clear` and rewrite the prompt
- `/rewind` > "Summarize from here" to compact partial conversation

### Prompt Enhancement Stack

When launching `claude` or `claude --dangerously-skip-permissions`:

1. Source activate-all.sh for env vars
2. Agent teams enabled
3. Ultrathink available via keyword (128K default budget)
4. RALPH loop active for all tasks
5. AskUserQuestion enabled as default interaction pattern

---

## Session Activation Script

```bash
# Full activation (source before claude launch)
source docs/guides/claude-flow-v3/scripts/activate-all.sh
```

This exports:

- CLAUDE_AGENT_TEAMS=true
- CLAUDE_REASONING_EFFORT=high
- ZIPMINATOR_ROOT, ZIPMINATOR_WEB, ENTROPY_POOL paths

---

## Session Defaults

### Auto-commit protocol
- After completing any task that modifies code, **auto-commit** without asking
- Use conventional commit format: `type(scope): description`
- Stage only relevant files (not screenshots, caches, or binaries)
- Do NOT push unless explicitly asked

### Session-start checklist
1. MEMORY.md, auto-loaded (no action needed)
2. CLAUDE.md + `.claude/rules/*.md`, auto-loaded
3. `micromamba activate zip-pqc` before any Python command
4. `git status`, check for uncommitted work

### PR policy
- PRs are NOT default for this project (solo dev on main)
- Only create PRs when explicitly asked or when CI gates are needed

---

## Progress Tracking

**Completed task history**: `docs/guides/TASK_HISTORY.md` (moved out of CLAUDE.md to save context tokens)
**Auto-memory**: `.claude/projects/.../memory/MEMORY.md` (cross-session state, loaded automatically)
**Pillar status**: `docs/guides/FEATURES.md` (code-verified percentages, single source of truth)
**Roadmap**: `docs/guides/implementation_plan.md` (10 phases with completion %)

Read these on demand, not every session. MEMORY.md is auto-loaded and has the summary.
