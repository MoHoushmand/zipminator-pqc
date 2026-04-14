# AESR v6.0 -- Universal Prompt Engineer with Visual + Design-Token Gates

> **Version**: 6.0 (draft) | **Date**: 2026-04-14
> **Claude Code**: v2.1.70+ | **Supersedes**: AESR v5.1 (`../v5/AESR_v5.md`)
> **Purpose**: Extends v5 with landing-page/marketing orchestration, visual-regression quality gates, and design-token drift detection. Eliminates design inconsistency as a failure mode, the same way v5 eliminated infinite question loops.

---

## What Changed from v5

| Area | v5 | v6 | Why |
|------|----|----|-----|
| Infrastructure Auto-Discovery | 5 task categories | **6 task categories** (adds Landing / Marketing / Visual Design) | Landing redesigns were silently routed through "Full-Stack Development", which picks TDD tooling and ignores visual regression. |
| Quality Gates | Test + review + security + consensus | **Adds Visual row + Design-Token Drift row** | Composite 0.97 targets on UI work were false positives when only code tests ran. Visual regression + token-drift are now gated, not suggested. |
| Structural Limits | 8 conditions | **11 conditions** (adds design-token drift, out-of-scope route breakage, framework version mismatch) | These three caused 3 of the last 5 megatask stalls; promoting them to blocking stops the loop earlier. |
| Copy-Paste Starters | Research / Product Launch / Quick Fix | **Adds Landing / Marketing Redesign** | Codifies the orchestration pattern that shipped the 2026-04-14 zipminator landing redesign. |
| Motion + Perf | Not surfaced | **`prefers-reduced-motion` gate + dynamic-import heavy clients** | One-line global gate beat 7 component rewrites; too valuable to leave out. |

Everything else from v5 is preserved verbatim. Use v5 for Research / Full-Stack / Crypto / Multi-Day / Quick Fix unchanged.

---

## How to Use (unchanged from v5)

Paste the task after this prompt. The system runs 3 rounds of self-answer Q&A, then produces a production-ready brief with infrastructure refs, quality gates, and structural limits. `/improve` for one-push output polish. `/improve --meta` for this file.

---

## Self-Answer Protocol (unchanged from v5)

Three rounds max, `Y` to approve, single-word override. After Round 3, no more questions — redirect follow-ups to `/improve`.

```
QUESTION 1: What is the target quality threshold?
SUGGESTED: 0.97 (landing + marketing) | 0.995 (research + crypto)
[Y / override]

QUESTION 2: Sequential or parallel execution?
SUGGESTED: Parallel agent teams with worktree isolation (N workstreams detected)
[Y / override]

QUESTION 3: Which reasoning depth?
SUGGESTED: --effort max (design-token migration + palette unification detected)
[Y / override]
```

---

## Infrastructure Auto-Discovery

Six task categories. The new one is first because landing/marketing work was the biggest blind spot in v5.

### **NEW in v6** — Landing / Marketing / Visual Design

Trigger keywords: `landing`, `marketing page`, `hero`, `bento`, `design tokens`, `palette`, `redesign`, `narrative arc`, `above the fold`, `visual regression`.

- **Playwright MCP** (`mcp__plugin_playwright_playwright__browser_take_screenshot`) — full-page screenshots at 390x844 / 768x1024 / 1440x900 minimum; save to `_screenshots/YYYY-MM-DD/<feature>/`.
- **Chrome DevTools MCP** (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__lighthouse_audit`, `performance_start_trace`) — Lighthouse Perf/A11y/SEO/Best Practices each `>= 90`; LCP `< 2.5s`, CLS `< 0.1`, INP `< 200ms` at 4G throttling.
- **Design-token source of truth**: `.claude/rules/01-stack.md` owns the OKLCH palette + font stack. Anything that conflicts (legacy `DESIGN_SPEC.md`, inline hex, Inter/Outfit) is drift and must be archived or reconciled before shipping.
- **`<Section>` primitive pattern** — build a shared `components/ui/Section.tsx` with `variant` (default / elevated / inverted) and `density` (compact / normal / loose) props BEFORE editing individual sections. Kills per-component padding/container/background drift at the root.
- **Global MotionConfig gate** — wrap the root provider (e.g., `ThemeProvider`) with `<MotionConfig reducedMotion="user">{children}</MotionConfig>`. Every Framer Motion descendant becomes `prefers-reduced-motion`-aware without per-component edits.
- **Dynamic-import heavy clients** — Three.js / React Three Fiber / Drei / GSAP / Recharts must be `next/dynamic({ ssr: false })` with a static CSS fallback. Never in the landing critical path.
- **Route scoping** — when editing shared design tokens, `grep` for off-palette references in ALL routes (`/features`, `/invest`, `/dashboard`, etc.) and decide per-route whether to fix or defer. RSC prefetch 500s for hover-prefetched links are a red flag — they show up as browser console errors even when the landing renders cleanly.
- **Narrative arc rubric** — 5 to 7 sections max. Each answers one of: who/what/why/how/proof/stakes/next. If a section answers none, it is filler; archive it.
- **Zero-hallucination metrics** — every number on a landing traces to a canonical source file (for zipminator, `docs/guides/FEATURES.md`). Hardcoded `10k users`, `99.9% uptime`, or fake testimonials are instant rejections.
- `/simplify` — run after the bento + architecture + proof sections land, before the waitlist wiring.

### Research / Paper / Publication (unchanged from v5)
`quantum-peer-reviewer`, `/hive-mind-advanced`, `/verification-quality`, `/quantum-scientific-writer`, `/research-paper-writer`, `/quantum-assurance-validator`, `/quantum-cryptanalysis-expert`, Context7 MCP, `/ralph-loop`, `/episodic-memory:search-conversations`. Dual-scoring rule still applies: `score = min(content, readiness)`.

### Full-Stack Development / Feature Work (unchanged from v5)
`/batch-tdd`, `/hive-tdd`, worktree isolation, model routing (Sonnet / Opus / Haiku), `/superpowers:test-driven-development`, `/simplify`.

### Cryptographic / Security-Critical (unchanged from v5)
`--effort max`, `/quantum-cryptanalysis-expert`, `/agentic-jujutsu`, `/hive-mind-advanced`, `cargo fuzz`, FIPS language rules.

### Multi-Day Campaign / Product Launch (unchanged from v5)
`/mega-task`, `/ralph-loop --max-iterations 50`, `/schedule`, `/loop 10m /batch-tdd`, `/compact` + ruflo memory + `/go`.

### Quick Fix / Small Change (unchanged from v5)
Direct edit + tests + `--effort low`. No agents, no RALPH.

---

## Effort Control (unchanged from v5)

| Tier | Tokens | When | Invocation |
|------|--------|------|------------|
| Low | ~4K | Typo, rename, config | `--effort low` |
| Medium | ~16K | API design, feature work | `--effort medium` |
| High | ~32K | Architecture, cross-file refactors | `--effort high` |
| Max | ~128K | Crypto, security audits, physics proofs, research, **design-token migrations** | `--effort max` |

Note v6 additions: design-token migrations and palette unification now default to `--effort max` because they touch every UI component and mistakes are expensive to roll back.

---

## Structural Limit Detection

v5's 8 conditions plus **3 new** (marked NEW):

| Condition | Action |
|-----------|--------|
| Task requires >128K context | Multi-session with `/compact` checkpoints |
| Manual steps needed (API keys, certs) | List manual vs automated |
| External dependencies (DB, API) | Mark as blocking; propose workarounds |
| Ambiguous after 3 rounds | Provide 2-3 interpretations, pick ONE |
| Quality plateaued after 12 iterations | Document max-achievable; stop |
| Paper score inflated (content only) | Run `quantum-peer-reviewer` dual scoring |
| Wrong venue template | BLOCKING - convert BEFORE content work |
| Over page limit | BLOCKING - compress BEFORE polishing |
| **NEW: Design-token drift detected** | BLOCKING - reconcile `.claude/rules/01-stack.md` vs inline hex vs legacy specs BEFORE any new section work. The drift multiplies with every new component. |
| **NEW: Out-of-scope route breakage** | If editing shared tokens, enumerate affected routes. Defer or fix each explicitly. Do NOT ship with broken hover-prefetch 500s even if they are "not in scope" — they damage the user-perceived quality. |
| **NEW: Framework version mismatch** | `.claude/rules/01-stack.md` assumes Next.js 16 + Tailwind v4, but repo is Next 15 + Tailwind v3. Pick ONE in Phase 0 (AskUserQuestion). Do NOT start a migration mid-megatask. |

---

## Output Template

Same structure as v5; the Quality Gates table gains two rows.

```markdown
# [Task Title]

## Objective
[1-sentence goal with measurable success criteria]

## Context
- **Current state**: [what exists now]
- **Target state**: [what success looks like]
- **Quality threshold**: 0.XXX
- **Effort tier**: --effort [low|medium|high|max]
- **Timeline**: [realistic estimate]

## Decomposition
### Workstream 1: [Name]
- **Owner**: [agent/skill/human]
- **Model tier**: [Opus/Sonnet/Haiku]
- **Dependencies**: [what must complete first]
- **Success criteria**: [measurable]
...

## Orchestration
- **Tier**: [Quick Fix | Sprint Task | Mega Task]
- **Primary tools**: [slash commands]
- **Supporting skills**: [on-demand skills]
- **MCP servers**: [playwright, chrome-devtools, context7, ...]
- **Parallelization**: [agent teams | sequential | subagents]

## Quality Gates
| Phase | Check | Threshold | Rollback |
|-------|-------|-----------|----------|
| Code | cargo test + pytest + npm build | 100% pass | Any failure |
| Types | tsc --noEmit | 0 errors | Any error |
| Review | /simplify + /verification-quality | >= 0.95 | < 0.90 |
| Security | /agentic-jujutsu | No critical findings | Critical vuln |
| **NEW Visual** | **Playwright screenshots at 3 viewports + diff vs baseline** | **Diff within tolerance, 0 console errors on landing routes** | **Any regression > 2% pixel diff on golden path; any unexpected console error** |
| **NEW Design-token drift** | **grep for off-palette hex, legacy font names, conflicting specs** | **0 hits in in-scope routes** | **Any token drift blocks commit** |
| Perf | Lighthouse (landing + marketing) | Perf/A11y/SEO/Best >= 90; LCP < 2.5s | Any category < 85 |
| Final | Byzantine consensus 3/3 | >= threshold | < threshold after N iter |

## Structural Limits
- **Blocked by**: [manual steps, external deps]
- **Max achievable this session**: [scope]
- **Continuity**: ruflo memory checkpoint + /compact + /go resume

## Persistent Iteration
/ralph-loop "[task]" --completion-promise "QUALITY_TARGET_MET" --max-iterations 20

## Zero-Hallucination
- Every claim verified or marked [unverified]
- Every landing-page number traces to canonical source (e.g., FEATURES.md)
- Citations via DOI/arXiv lookup
- 0% tolerance for mock/placeholder data
- FIPS: "implements FIPS 203" never "FIPS compliant"
```

---

## Copy-Paste Starters

### **NEW: Landing / Marketing Redesign** (paste into Claude Code)
```
/effort max

Redesign [path/to/landing] to world-class SaaS quality, composite 0.97.
Read @.claude/rules/01-stack.md (palette + fonts), @docs/guides/FEATURES.md (numbers),
@~/.claude/plans/<this-plan>.md (narrative arc).

PHASE 0 (BLOCKING - before any section work):
  AskUserQuestion: palette + framework version lock (Next+Tailwind).
  Reconcile design-token drift: archive legacy specs under web/_archive/.

PHASE 1 (design system unification):
  - Rewrite globals.css / tailwind.config.js with canonical OKLCH tokens
  - Swap fonts via next/font (no CDN links)
  - Build Section primitive with variant + density props
  - Global MotionConfig reducedMotion="user" in the root provider

PHASE 2 (7-section narrative arc, 4 parallel teams):
  Team A: Hero + Navigation typography
  Team B: Problem + PillarsGrid (bento)
  Team C: Architecture scroll + Proof strip
  Team D: TrustAndUse + FinalCTA + Footer

PHASE 3 (motion + perf):
  Dynamic-import all Three.js / GSAP / heavy-client deps with static fallback.
  Verify prefers-reduced-motion gate via Chrome emulation.

PHASE 4 (verification):
  Playwright screenshots at 390x844, 768x1024, 1440x900 into _screenshots/YYYY-MM-DD/.
  Chrome DevTools Lighthouse: Perf/A11y/SEO/Best >= 90.
  Browser console errors: 0 on landing (out-of-scope prefetch 500s documented, deferred).

PHASE 5 (commit):
  Stage specific files (not -A). Conventional commit.
  No Co-Authored-By. No push to main.

Quality gate: composite 0.97 = min(visual, code, perf, a11y).
Iteration cap: RALPH N=12 per section; escalate at N=12.
```

### Research Paper (unchanged from v5)
See `../v5/AESR_v5.md#copy-paste-starters`.

### Product Launch (unchanged from v5)
See `../v5/AESR_v5.md#copy-paste-starters`.

### Quick Fix (unchanged from v5)
```
Fix [ISSUE] in [FILE]. Run cargo test / npm test after.
```

---

## Lessons Learned (v6 additions)

1. **Global motion gate beats per-component edits.** One 3-line edit to `ThemeProvider` that wraps children in `<MotionConfig reducedMotion="user">` strips every `motion.*` descendant's animations for OS-level reduce-motion users. Do not rewrite 7 components when one provider will do.
2. **Archive, don't delete, on palette migrations.** Legacy design specs like `web/DESIGN_SPEC.md` get archived to `web/_archive/design-spec-v1/YYYY-MM-DD/`, not deleted. Git history is authoritative; `_archive/` is for quick human access.
3. **RSC prefetch 500s on hover are real console errors.** Even when the landing route renders cleanly, Next.js App Router prefetches linked routes on hover/viewport. Broken out-of-scope routes surface as 500s in the browser console on the landing page. Document and defer, do not ignore.
4. **Dynamic-import is per-route, not per-component.** Code-splitting Three.js via `next/dynamic({ ssr: false })` only helps the route where the dynamic import lives. If `/invest` still imports Recharts statically, landing bundle gets no benefit — the shared chunk grows. Inspect the Next.js build output's "First Load JS by page" column.
5. **Framework version mismatch is a planning failure, not a coding failure.** `.claude/rules/01-stack.md` assumed Next 16 + Tailwind v4 CSS-first. Repo was Next 15 + Tailwind v3. Picking one in Phase 0 via AskUserQuestion saved hours; attempting the v4 migration mid-megatask would have blown the session budget.
6. **FIPS language is a landing-page issue, not just a docs issue.** Marketing copy tends to say "FIPS compliant" or "FIPS 140-3 certified" because it sounds stronger. It is wrong and blocks federal procurement. Safe: "Implements NIST FIPS 203 (ML-KEM-768)". The `zero-hallucination.md` rule applies to hero subheads and proof strips, not just whitepapers.

---

## Meta-Improvement

Type `/improve --meta` to improve this prompt engineer itself.
Type `/improve` at any point to improve the most recent output.
Draft v7 candidates from v6 lessons in `../v7/AESR_v7.md` (do not overwrite v6 until a megatask validates the draft).

---

## Integration Map (unchanged structure, v6 deltas marked)

```
AESR v6 Prompt Engineer
  |
  +-- Self-Answer Protocol (3 rounds max)
  |     |-- Auto-discover skills from keywords (6 categories, was 5)
  |     |-- Suggest effort tier (max for crypto + design-token migrations)
  |     +-- Detect structural limits early (11 conditions, was 8)
  |
  +-- Infrastructure Layer
  |     |-- Plugins: playwright, chrome-devtools, context7, superpowers, ecc, ...
  |     |-- User skills (.claude/skills/), commands (.claude/commands/), agents (.claude/agents/)
  |     |-- Design-token source of truth: .claude/rules/01-stack.md     [v6]
  |     +-- Section primitive pattern: components/ui/Section.tsx         [v6]
  |
  +-- Execution Layer
  |     |-- /mega-task, /sprint-task, /ralph-loop, /loop, /schedule
  |     |-- /hive-mind-advanced, agent teams with worktree isolation
  |     +-- Global MotionConfig gate in root provider                    [v6]
  |
  +-- Quality Layer
  |     |-- /verification-quality, /simplify, /agentic-jujutsu, /improve
  |     |-- Playwright visual regression (3 viewports)                   [v6]
  |     |-- Chrome DevTools Lighthouse                                   [v6]
  |     +-- Design-token drift grep gate                                 [v6]
  |
  +-- Memory Layer
        |-- CLAUDE.md (always in context)
        |-- AgentDB (HNSW vector search)
        |-- ReasoningBank (RL policy)
        |-- Episodic Memory (cross-session)
        +-- Auto-memory (user, feedback, project, reference types)
```
