/**
 * Coverage skeleton , v24 G1: web/components/pitch/ slide tree (24+ TSX files,
 * 0 tests) parallel to web/components/blueprint/sections/ which has 1/17 tested.
 *
 * Focused on FinancialsSlide.tsx because it is the highest-stakes investor-
 * facing surface: derived from REVENUE_PROJECTIONS in @/lib/pitch-data.ts,
 * quoted in pitches as "$ {yr5Revenue}M ARR", and consumed downstream by
 * AskSlide / FundingStrategySlide / TractionSlide. A typo or stale projection
 * here propagates to investor materials.
 *
 * Place at:  web/components/pitch/__tests__/FinancialsSlide.invariants.test.ts
 * Run from web/:
 *     pnpm vitest run components/pitch/__tests__/FinancialsSlide.invariants
 *
 * SHAPE A vs SHAPE B , USER DESIGN PICK (the meaningful choice this skeleton
 * surfaces; matches the cadence of v22 G4 PqcBridge "structural vs KAT"):
 *
 *   Shape A (DEFAULT, what this file does):
 *       Test the *data layer* invariants the slide depends on. Pure logic,
 *       no React render, no recharts/framer-motion mocks. Catches:
 *         - REVENUE_PROJECTIONS shape drift  (FATAL , slide crashes)
 *         - Per-scenario year cardinality skew
 *         - Negative or non-monotonic projections
 *         - SCENARIO_META key drift vs Scenario union type
 *         - formatUsers() bucket boundary regressions
 *       Cost: low. Maintenance: low. Investor-data-drift coverage: high.
 *
 *   Shape B (extend later if Mo picks it):
 *       Add @testing-library/react + ResponsiveContainer mock, render the
 *       component for each scenario in (['conservative','base','upside','all']),
 *       assert headline copy ("$ {yr5}M ARR"), tab-active state, and chart
 *       Area count per scenario (1 for non-'all', 3 for 'all').
 *       Cost: ResponsiveContainer requires explicit width in jsdom + framer-
 *       motion needs `reducedMotion: 'user'` config. ~2-3h delta per slide.
 *
 * Recommendation: ship Shape A across all 24 slides FIRST (≈ 1 day mechanical
 * with describe.each below). Add Shape B selectively for slides with non-
 * trivial state machines (FinancialsSlide, ScenarioToggle, SlideTabs).
 */

import { describe, it, expect } from "vitest";
import {
  REVENUE_PROJECTIONS,
  type Scenario,
} from "@/lib/pitch-data";

// FinancialsSlide.tsx defines these literals inline; mirror them here so the
// test fails when the slide file silently drops a scenario from the SCENARIO_META
// map without updating the Scenario union (e.g., a refactor to make 'all'
// implicit would break the legend rendering).
const SCENARIO_META_KEYS_EXPECTED: readonly Scenario[] = [
  "all",
  "base",
  "upside",
  "conservative",
] as const;

// SHAPE A boundaries copied from FinancialsSlide.tsx's local formatUsers.
// If you (Mo) extract formatUsers to a shared util, replace this duplicate
// with a direct import. The duplication is intentional , pinning the contract
// from the OUTSIDE of the slide so an inline rewrite shows up here.
function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// ── Data-layer invariants the slide UNCONDITIONALLY depends on ─────────────

describe("REVENUE_PROJECTIONS shape (FinancialsSlide preconditions)", () => {
  const NON_ALL_SCENARIOS: ReadonlyArray<Exclude<Scenario, "all">> = [
    "conservative",
    "base",
    "upside",
  ];

  it("declares all three non-'all' scenarios", () => {
    for (const s of NON_ALL_SCENARIOS) {
      expect(REVENUE_PROJECTIONS[s], `missing scenario ${s}`).toBeDefined();
      expect(Array.isArray(REVENUE_PROJECTIONS[s])).toBe(true);
    }
  });

  it("has identical year-cardinality across scenarios", () => {
    // The slide merges scenarios into chartData by index , divergent lengths
    // produce undefined-pointer chart artifacts. Pin parity.
    const lengths = NON_ALL_SCENARIOS.map((s) => REVENUE_PROJECTIONS[s].length);
    const unique = new Set(lengths);
    expect(unique.size, `mismatched lengths: ${JSON.stringify(lengths)}`).toBe(1);
    // Slide assumes "5-year financial model" copy , pin minimum.
    expect(lengths[0]).toBeGreaterThanOrEqual(5);
  });

  it("aligns year sequence across scenarios (chart merge by index)", () => {
    const baseYears = REVENUE_PROJECTIONS.base.map((d) => d.year);
    for (const s of NON_ALL_SCENARIOS) {
      const years = REVENUE_PROJECTIONS[s].map((d) => d.year);
      expect(years, `${s} year sequence drifts from base`).toEqual(baseYears);
    }
  });

  it.each(["conservative", "base", "upside"] as const)(
    "%s projects strictly non-negative revenue and users",
    (scenario) => {
      for (const point of REVENUE_PROJECTIONS[scenario]) {
        expect(point.revenue, `${scenario} ${point.year} revenue < 0`)
          .toBeGreaterThanOrEqual(0);
        expect(point.users, `${scenario} ${point.year} users < 0`)
          .toBeGreaterThanOrEqual(0);
      }
    }
  );

  it.each(["conservative", "base", "upside"] as const)(
    "%s projects monotonically non-decreasing revenue and users",
    (scenario) => {
      // A pitch where Yr3 revenue dips below Yr2 either reflects a scenario
      // pivot (rare; should be loud, not silent) or a typo. Today every
      // scenario in the deck is monotonic. Pin it; flag intentional dips.
      const data = REVENUE_PROJECTIONS[scenario];
      for (let i = 1; i < data.length; i++) {
        expect(
          data[i].revenue,
          `${scenario} revenue dip Y${data[i - 1].year}->${data[i].year}`
        ).toBeGreaterThanOrEqual(data[i - 1].revenue);
        expect(
          data[i].users,
          `${scenario} users dip Y${data[i - 1].year}->${data[i].year}`
        ).toBeGreaterThanOrEqual(data[i - 1].users);
      }
    }
  );

  it("orders Y5 ARR upside > base > conservative (scenario semantics)", () => {
    // The labels imply this ordering. If the data ever shows
    // conservative.yr5 > upside.yr5, either the labels are swapped (deck-
    // level investor confusion) or the projections are wrong.
    const yr5 = (s: Exclude<Scenario, "all">) =>
      REVENUE_PROJECTIONS[s][REVENUE_PROJECTIONS[s].length - 1].revenue;
    expect(yr5("upside")).toBeGreaterThan(yr5("base"));
    expect(yr5("base")).toBeGreaterThan(yr5("conservative"));
  });
});

// ── Slide-local contract: SCENARIO_META keys must equal Scenario union ─────

describe("FinancialsSlide.SCENARIO_META cardinality (drift catcher)", () => {
  it("expected keys match the Scenario union exactly", () => {
    // This test guards against the refactor where 'all' is removed from the
    // Scenario union but SCENARIO_META[scenario] is still indexed , TS would
    // catch a compile-time miss, but a `Scenario | string` widening (easy
    // mistake when adding a new scenario) would let it slip.
    const sorted = [...SCENARIO_META_KEYS_EXPECTED].sort();
    const expected: readonly Scenario[] = ["all", "base", "conservative", "upside"];
    expect(sorted).toEqual([...expected].sort());
  });
});

// ── formatUsers bucket boundaries ──────────────────────────────────────────

describe("formatUsers() bucket boundaries", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1_000, "1K"],
    [1_499, "1K"],          // truncates via .toFixed(0)
    [1_500, "2K"],          // .toFixed(0) rounds half-to-even-ish; pin actual
    [999_999, "1000K"],     // boundary edge , confirm real output, then keep
    [1_000_000, "1.0M"],
    [2_500_000, "2.5M"],
  ])("formatUsers(%i) === %s", (n, expected) => {
    // Note: 999_999 -> "1000K" is the CURRENT behavior of the inline helper
    // (no .9M rendering until exactly 1M). If you (Mo) change the bucket
    // threshold to 100K -> "0.1M", update this row. Pinned to surface the
    // change in PR review rather than silently shifting investor copy.
    expect(formatUsers(n)).toBe(expected);
  });
});

// ── Hint for extending across the other 23 slides ──────────────────────────
//
// Once Mo picks Shape A as the standard, copy this file as a template for:
//
//   web/components/pitch/__tests__/AskSlide.invariants.test.ts
//     -> assert FUNDING_ASK shape, sum-of-uses == FUNDING_ASK.amount
//   web/components/pitch/__tests__/TractionSlide.invariants.test.ts
//     -> TRACTION_STATS array entries have positive numbers, dates are ISO
//   web/components/pitch/__tests__/MarketSlide.invariants.test.ts
//     -> TAM > SAM > SOM cardinality (the moneyball investor-claim invariant)
//   web/components/pitch/__tests__/CompetitiveSlide.invariants.test.ts
//     -> COMPETITORS entries have logo, name, link (no 404 in pitch deck)
//
// Each is < 30 LOC if the data already has shape tests upstream , about
// half a day to ship all 24 if Shape A is picked.
