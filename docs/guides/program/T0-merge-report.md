# Track T0 — Branch Triage & Repo Hygiene Report

Generated: 2026-05-30 (Track T0, full-program push).
Author: automated (Track T0 agent). **This is a report for the human to act on.**
No merges, branch deletions, or stash drops were performed.

Base: `main` @ `0aa6515` (root commit `a8e6812`, 2025-06-22).
Remotes: `origin` = MoHoushmand/zipminator-pqc (private), `public` = QDaria/zipminator, `qdaria-qrng-old` = legacy.

---

## 1. Local branch classification

`git branch -a` ahead/behind vs `main`, last commit, and disposition:

| Branch | Ahead | Behind | Last commit | Shares history with main? | Disposition |
|--------|------:|-------:|-------------|---------------------------|-------------|
| `main` | 0 | 0 | 2026-05-28 `0aa6515` | — | keep (base) |
| `feature/program-orchestration` | 2 | 0 | 2026-05-30 `d5d1d05` | yes | **merge** — current program work, 2 commits ahead, 0 behind. Clean fast-forward candidate. |
| `marathon/20260530/waitlist` | 0 | 1 | 2026-05-24 `50cf4fb` | yes | **close** — 0 ahead, fully contained in main. Active worktree branch; delete after the worktree is removed. |
| `antigravity-ux-review` | 183 | 424 | 2026-04-02 `f052efd` | **NO (orphan root `9f1b925`)** | **do NOT merge.** Unrelated history. Cherry-pick any wanted UX commits onto a fresh branch off main, then close. |
| `archive/old-structure` | 4 | 424 | 2025-11-17 `57b681e` | **NO (orphan root `9f1b925`)** | **archive/close.** Unrelated history, name says archive. Keep as a tag if historically valuable, otherwise delete. Never merge. |
| `worktree-agent-a17332f2` | 102 | 424 | 2026-03-23 `fc90faf` | NO (orphan) | **close.** Stale agent worktree branch on the orphan history (ARE spec work). Active worktree — remove worktree first, cherry-pick if `feat(are)` work is still wanted. |
| `worktree-agent-aa7a288a` | 186 | 424 | 2026-04-02 `97c397a` | NO (orphan) | **close.** Stale agent worktree on orphan history. Remove worktree, then delete. |
| `worktree-agent-a1ecd1d6259bf923e` | 0 | 1 | 2026-05-24 `50cf4fb` | yes | **close.** 0 ahead. Active worktree (locked). Remove worktree, then delete. |
| `worktree-agent-ab5a67c38b6f5aa6f` | 0 | 1 | 2026-05-24 `50cf4fb` | yes | **close.** 0 ahead. Active worktree (locked). Remove worktree, then delete. |
| `worktree-agent-aed78e040d8a1037e` | 0 | 1 | 2026-05-24 `50cf4fb` | yes | this Track T0 worktree. T0 edits live on `marathon/20260530/setup` (created from this HEAD). Merge that branch, then close + remove worktree. |

### Critical finding: two unrelated histories
`main` roots at commit `a8e6812`; `antigravity-ux-review`, `archive/old-structure`,
`worktree-agent-a17332f2`, and `worktree-agent-aa7a288a` root at a **different**
commit `9f1b925`. Both are "Add files via upload" on 2025-06-22, i.e. the repo was
re-uploaded/re-initialized. `git merge-base main <branch>` returns empty for these.

Consequence: a normal merge is impossible without `--allow-unrelated-histories`,
which would generate enormous conflicts and pollute history. Treat all four as
**cherry-pick-only**: extract specific wanted commits onto a branch cut from
`main`. Do not attempt a direct merge.

### Active worktrees (must remove before deleting their branches)
```
.claude/worktrees/agent-a17332f2           -> worktree-agent-a17332f2
.claude/worktrees/agent-a1ecd1d6259bf923e  -> marathon/20260530/waitlist (locked)
.claude/worktrees/agent-aa7a288a           -> worktree-agent-aa7a288a
.claude/worktrees/agent-ab5a67c38b6f5aa6f  -> worktree-agent-ab5a67c38b6f5aa6f (locked)
.claude/worktrees/agent-aed78e040d8a1037e  -> worktree-agent-aed78e040d8a1037e (locked, this Track)
```
Use `git worktree remove <path>` (unlock first if locked) before `git branch -d/-D`.

### Remote branches
- **dependabot/**: **13** open dependabot branches (11 github_actions, 2 npm_and_yarn on `demo/`). Disposition: batch-review and merge the green ones via PR; close stale duplicates (e.g. two `react-dom-19.2.x`). Low risk, no source-code impact.
- `add-claude-github-actions-1763293671255`, `...-1779148605315`: CI bot branches — close after confirming workflow is on main.
- `claude/clarify-requirements-VWpqG`, `claude/zipminator-status-review-AQBUb`: ephemeral agent branches — close.
- `chore/claude-root-consolidation`, `chore/testflight-path-b`, `chore/type-recovery-609`: review and merge or close per relevance.
- `feat/9-pillars-production-2026-04-26`, `feature/test-green`, `fix/landing-truthing-2026-05-07`, `refactor/landing-editorial`, `security-fixes-2026-04-14`, `worktree-papers-and-patents`, `worktree-spike+ml-kem-migration-2026-05-07`: feature/fix branches — evaluate each against current main; merge if still relevant, else close.

---

## 2. Proposed merge order

1. **`marathon/20260530/setup`** (this Track T0: version reconcile + VERSIONING.md + this report). Fast-forward / no-conflict — merge first to lock the version baseline.
2. **`feature/program-orchestration`** (2 ahead, 0 behind) — clean fast-forward.
3. **dependabot/** green batch — low-risk dependency bumps, via PR.
4. Per-feature review of the remaining `origin/*` feature/fix branches (test-green, security-fixes, landing-truthing, 9-pillars) in date order, rebasing each onto the updated main.
5. **Cherry-pick only** from the orphan-history branches (antigravity-ux-review, the two stale worktree-agent branches) if any of their work is still wanted; never a direct merge.

---

## 3. Working-tree / untracked disposition proposal

Observed on the shared `main` checkout (this isolated worktree is clean):

| Item | State | Proposed disposition |
|------|-------|----------------------|
| `docs/ip/dmca-takedown-github.md` | modified | **Review & commit** to a `docs/ip` branch. IP doc; confirm the DMCA notice update (MoHoushmand/zipminator-pqc now public) is intended, then commit with `docs(ip):` message. Out of Track T0 scope. |
| `quantum_entropy/harvest_log.jsonl` | modified | **Do not commit blindly.** This is an append-only entropy harvest log. Confirm it contains no raw seed/key material (per security rules QRNG seeds must never be in git). If it's just metadata, commit; if it grows unbounded, consider gitignoring and keeping locally. |
| `git stash@{0}` (`WIP on main`) | 8 files, `web/components/blueprint/sections/*.tsx`, +23/-15 | **Review & apply or drop.** Small UI edits to blueprint sections. Either `git stash pop` onto a `fix/blueprint-sections` branch and commit, or drop if superseded by `refactor/landing-editorial`. Decide before any rebase, since stash is tied to the old `main` base `6fb3fd3`. |
| Untracked `demo/.claude/skills/**` assets (templates, Dockerfiles, schemas, transactions.csv, research-paper-writer assets) | untracked | **Gitignore.** These are skill scaffolding/sample assets generated under `demo/.claude/skills/`. They are not product source. Add `demo/.claude/skills/**/assets/` and generated data (`*/finance-manager/transactions.csv`) to `.gitignore`. Do not commit `transactions.csv` (sample/PII-shaped data). |
| Untracked `.swarm/hnsw.index`, `waitlist-section-state.png` | untracked | **Gitignore.** Build/agent scratch artifacts. Add `.swarm/` and stray root `*.png` screenshots to `.gitignore`. |

### Security note
Per `.claude/rules/02-security-pqc.md`, before committing `harvest_log.jsonl` or any
entropy artifact, verify no QRNG seed values, private keys, or `.env` content are
present. No `.env*`, `*.key`, or `*.pem` files were read or staged by Track T0.

---

## 4. Version reconcile summary (Track T0 action taken)

| File | Before | After |
|------|--------|-------|
| `pyproject.toml` (`zipminator`) | `1.0.0` | `0.5.1` |
| `CITATION.cff` | `1.0.0-beta.1` | `0.5.1` |
| `src/zipminator/__init__.py` | `0.5.1` (already) | unchanged |
| `app/pubspec.yaml` | `0.5.1+45` | unchanged (independent artifact) |
| `browser/src-tauri/tauri.conf.json` | `0.2.0` | unchanged (independent artifact) |

Left intentionally on their own tracks (NOT SDK, not changed): `Cargo.toml`
workspace `1.0.0`, `config/pyproject.toml` (`zipminator-pqc`), `config/Cargo-cli.toml`
+ `config/npm-package.json` (`@qdaria/zipminator` CLI), `api/pyproject.toml`
(`zipminator-api`). See `VERSIONING.md`.

Build verification: `maturin build --sdist` produced
`zipminator-0.5.1.tar.gz` and `zipminator-0.5.1-cp38-abi3-macosx_11_0_arm64.whl`,
and `python -c "import zipminator; print(zipminator.__version__)"` reported `0.5.1`.
