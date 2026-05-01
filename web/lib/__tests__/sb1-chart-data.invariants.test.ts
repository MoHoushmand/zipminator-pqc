/**
 * Coverage skeleton for web/lib/sb1-chart-data.ts (audit v19 G5).
 *
 * 446 LOC of investor-facing chart data. A typo in a 2027 revenue projection
 * or a swapped CAGR will render silently wrong on the deck and never trip a
 * test. These invariants pin the shape of the data, not the exact numbers,
 * so they survive (intentional) value updates but catch (unintentional)
 * shape regressions like:
 *   - off-by-one year ranges
 *   - swapped scenario columns (oppside < base < konservativ)
 *   - %s that drift outside [0, 100]
 *   - non-monotonic harvested/migrated curves
 */
import { describe, it, expect } from "vitest";
import {
  SCENARIO_LABELS,
  hndlExposureData,
  type Scenario,
} from "../sb1-chart-data";

const SCENARIOS = ["konservativ", "base", "oppside"] as const satisfies readonly Scenario[];

describe("sb1-chart-data: scenario contract", () => {
  it("exposes exactly three scenarios", () => {
    expect(Object.keys(SCENARIO_LABELS).sort()).toEqual(
      [...SCENARIOS].sort(),
    );
  });
});

describe("hndlExposureData: shape invariants", () => {
  it.each(SCENARIOS)(
    "scenario %s spans 2024..2035 inclusive (12 points)",
    (scenario) => {
      const series = hndlExposureData[scenario];
      expect(series).toHaveLength(12);
      const years = series.map((p) => p.year);
      expect(years[0]).toBe(2024);
      expect(years[years.length - 1]).toBe(2035);
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBe(years[i - 1] + 1);
      }
    },
  );

  it.each(SCENARIOS)("scenario %s percentages stay in [0, 100]", (scenario) => {
    for (const point of hndlExposureData[scenario]) {
      expect(point.harvested).toBeGreaterThanOrEqual(0);
      expect(point.harvested).toBeLessThanOrEqual(100);
      expect(point.vulnerable).toBeGreaterThanOrEqual(0);
      expect(point.vulnerable).toBeLessThanOrEqual(100);
      expect(point.migrated).toBeGreaterThanOrEqual(0);
      expect(point.migrated).toBeLessThanOrEqual(100);
    }
  });

  it.each(SCENARIOS)(
    "scenario %s: harvested is monotonically non-decreasing",
    (scenario) => {
      const series = hndlExposureData[scenario];
      for (let i = 1; i < series.length; i++) {
        expect(series[i].harvested).toBeGreaterThanOrEqual(
          series[i - 1].harvested,
        );
      }
    },
  );

  it.each(SCENARIOS)(
    "scenario %s: migrated is monotonically non-decreasing",
    (scenario) => {
      const series = hndlExposureData[scenario];
      for (let i = 1; i < series.length; i++) {
        expect(series[i].migrated).toBeGreaterThanOrEqual(
          series[i - 1].migrated,
        );
      }
    },
  );

  it.each(SCENARIOS)(
    "scenario %s: vulnerable is monotonically non-increasing",
    (scenario) => {
      const series = hndlExposureData[scenario];
      for (let i = 1; i < series.length; i++) {
        expect(series[i].vulnerable).toBeLessThanOrEqual(
          series[i - 1].vulnerable,
        );
      }
    },
  );
});

describe("hndlExposureData: scenario ordering (PQC adoption thesis)", () => {
  it("by 2035, every scenario reaches >90% migrated", () => {
    for (const s of SCENARIOS) {
      const last = hndlExposureData[s][hndlExposureData[s].length - 1];
      expect(last.year).toBe(2035);
      expect(last.migrated).toBeGreaterThan(90);
    }
  });

  it("oppside migrates faster than konservativ at every year", () => {
    const opp = hndlExposureData.oppside;
    const cons = hndlExposureData.konservativ;
    for (let i = 0; i < opp.length; i++) {
      expect(opp[i].year).toBe(cons[i].year);
      expect(opp[i].migrated).toBeGreaterThanOrEqual(cons[i].migrated);
    }
  });

  it("base sits between konservativ and oppside on migrated", () => {
    const base = hndlExposureData.base;
    const cons = hndlExposureData.konservativ;
    const opp = hndlExposureData.oppside;
    for (let i = 0; i < base.length; i++) {
      expect(base[i].migrated).toBeGreaterThanOrEqual(cons[i].migrated);
      expect(base[i].migrated).toBeLessThanOrEqual(opp[i].migrated);
    }
  });
});
