/**
 * Coverage skeleton for web/lib/pitch-data.ts (audit v20 G2).
 *
 * 935 LOC of pitch deck data. Earlier audits flagged that exact KPI
 * numbers belong in shape tests (don't pin), but the *structure* and
 * *referential integrity* of the data layer is fair game and currently
 * unguarded. A typo like "Kyber786" instead of "Kyber768" or a swap of
 * MessageSquare and Phone icons will render the deck without any test
 * complaining.
 *
 * This skeleton focuses on three properties:
 *
 *   1) Cardinality and uniqueness of top-level arrays.
 *   2) Required-key shape on each entry (exists, non-empty, correct type).
 *   3) Whitelisted vocabularies for security-sensitive strings (the
 *      `tech` field of SUPER_APP_MODULES references PQC algorithm names;
 *      a typo there is a security claim drift, not a UI typo).
 *
 * Design call (TODO user): the algorithm whitelist below is a
 * release-engineering contract — what algorithms are we willing to
 * publicly claim in the deck? Kyber768/ML-KEM/ML-DSA/SLH-DSA are NIST
 * FIPS 203/204/205 finalists. Anything outside this set is either an
 * implementation we have shipped (add to whitelist) or a typo (fix
 * pitch-data.ts). Curate the whitelist to taste.
 */
import { describe, it, expect } from "vitest";
import {
  SLIDE_TITLES,
  THREAT_DATA,
  SUPER_APP_MODULES,
} from "../pitch-data";

const REQUIRED_THREAT_KEYS = ["title", "detail", "source", "icon"] as const;
const REQUIRED_MODULE_KEYS = ["name", "icon", "description", "tech"] as const;

// TODO(user): curate. These are the PQC primitives we're willing to claim
// publicly. Anything outside this set in `tech` strings is a finding.
const ALLOWED_PQC_TOKENS = [
  "Kyber768",
  "ML-KEM",
  "ML-KEM-768",
  "ML-DSA",
  "SLH-DSA",
  "X3DH",
  "SRTP",
  "WireGuard",
  "TLS 1.3",
  "DoD 5220.22-M",
  "IBM Marrakesh",
  "IBM Fez",
  "IBM Marrakesh/Fez",
];

describe("SLIDE_TITLES: cardinality contract", () => {
  it("has exactly 22 slides (sb1-pitch-types.ts comment line range)", () => {
    expect(SLIDE_TITLES).toHaveLength(22);
  });

  it("every title is a non-empty trimmed string", () => {
    for (const t of SLIDE_TITLES) {
      expect(typeof t).toBe("string");
      expect(t.trim().length).toBeGreaterThan(0);
    }
  });

  it("no duplicate titles", () => {
    expect(new Set(SLIDE_TITLES).size).toBe(SLIDE_TITLES.length);
  });
});

describe("THREAT_DATA: required-key shape", () => {
  it.each(REQUIRED_THREAT_KEYS)("every entry has a non-empty %s", (key) => {
    for (const t of THREAT_DATA) {
      const v = (t as Record<string, unknown>)[key];
      expect(typeof v).toBe("string");
      expect((v as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("titles are unique (no duplicate threat names on slide)", () => {
    const titles = THREAT_DATA.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("SUPER_APP_MODULES: required-key shape", () => {
  it.each(REQUIRED_MODULE_KEYS)("every module has a non-empty %s", (key) => {
    for (const m of SUPER_APP_MODULES) {
      const v = (m as Record<string, unknown>)[key];
      expect(typeof v).toBe("string");
      expect((v as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("module names are unique", () => {
    const names = SUPER_APP_MODULES.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("SUPER_APP_MODULES: PQC algorithm whitelist (security claim contract)", () => {
  it("every `tech` string only references whitelisted PQC primitives", () => {
    const violations: Array<{ module: string; offending: string[] }> = [];
    for (const m of SUPER_APP_MODULES) {
      // tokenize on common separators: ' + ', ' / ', ', '
      const tokens = m.tech.split(/\s*[+/,]\s*/);
      const offending = tokens.filter(
        (t) => !ALLOWED_PQC_TOKENS.includes(t.trim()),
      );
      if (offending.length > 0) violations.push({ module: m.name, offending });
    }
    expect(
      violations,
      `tech tokens not in ALLOWED_PQC_TOKENS: ${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });
});
