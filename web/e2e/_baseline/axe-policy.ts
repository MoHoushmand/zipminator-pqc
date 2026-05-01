/**
 * a11y-assertion-policy
 *
 * v14 coverage audit G1 fix. Where: web/e2e/axe-scan.spec.ts:69-78.
 *
 * The current axe-scan spec runs axe-core against 22 URLs, builds a
 * `summary` with `violationCount` / `criticalCount` / `seriousCount`, and
 * THEN logs them. It never calls `expect(...)`, so it always passes. Wave5
 * commit 66923c4 ("remediate 7 of 8 zipminator-scope WCAG-AA violations")
 * fixed 7; the 8th can regress silently and this spec wouldn't fail.
 *
 * The fix is to assert. The policy choice — what to assert against — is
 * a release-engineering tradeoff that the codebase owner has to make.
 *
 * THREE VALID POLICIES (you pick):
 *
 *   1. "STRICT_ZERO" — fail if ANY violation at any impact tier exists.
 *      Best when: you've already remediated all violations, and you want
 *      a hard CI gate against regressions.
 *      Risk: blocks CI immediately if a third-party dep (next-auth UI,
 *      shadcn Field component) ships an a11y bug. You eat the failure
 *      until the dep updates.
 *
 *   2. "BASELINE_DELTA" — store a baseline JSON of known violations per
 *      page; fail if NEW violations appear or counts go up. Pre-existing
 *      violations are tolerated.
 *      Best when: gradual remediation. You ship now, tighten later.
 *      Risk: easy to forget to ratchet down the baseline as fixes land,
 *      so the "covered" count silently drops.
 *
 *   3. "TIERED" — fail on critical, warn on serious, ignore moderate/minor.
 *      Best when: you want to keep shipping but ensure WCAG-A and the
 *      worst WCAG-AA never regress.
 *      Risk: serious-tier violations accumulate unnoticed; over time
 *      your baseline drifts even though "tests pass".
 *
 * Implement ONE of these by filling in `assertA11y(summary)` below.
 *
 * Constraints:
 *   - Must be deterministic (no Date.now-based logic).
 *   - Must produce a useful failure message (which page, which violations).
 *   - For BASELINE_DELTA, baseline lives in this folder as `axe-baseline.json`.
 *
 * Reference values from current state (verified 2026-05-01):
 *   - axe-scan covers 11 zipminator routes + 11 qdaria-astro routes = 22
 *   - wave5 commit claims 7 of 8 violations remediated (so >=1 still exists)
 *   - We do NOT have a baseline file yet; you'll generate one if you pick #2
 */

export interface AxeSummary {
  app: 'web' | 'astro';
  name: string;
  url: string;
  status: number;
  ms: number;
  violations: Array<{
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
    help: string;
    tags: string[];
    nodes: number;
    targets: string[][];
  }>;
  incomplete: Array<{ id: string; impact: string | null; nodes: number }>;
  violationCount: number;
  criticalCount: number;
  seriousCount: number;
}

/**
 * TODO(user): implement one of STRICT_ZERO / BASELINE_DELTA / TIERED.
 *
 * Throw on failure (Playwright's `expect` will catch); return void on pass.
 *
 * Hint for BASELINE_DELTA:
 *   import { readFileSync, writeFileSync, existsSync } from 'node:fs';
 *   const baselinePath = path.join(import.meta.dirname, 'axe-baseline.json');
 *   if (!existsSync(baselinePath)) writeFileSync(baselinePath, '{}');  // first run captures
 *   const baseline: Record<string, AxeSummary> = JSON.parse(readFileSync(baselinePath, 'utf8'));
 *   const prev = baseline[`${summary.app}/${summary.name}`];
 *   // compare prev.violations.map(v => v.id) vs summary.violations.map(v => v.id)
 *   // any NEW id in summary that's not in prev → fail
 */
export function assertA11y(summary: AxeSummary): void {
  // ─── Your 5-10 lines go here ───
  throw new Error(
    'assertA11y not implemented. Pick STRICT_ZERO / BASELINE_DELTA / TIERED.'
  );
  // ────────────────────────────────
}
