// Coverage skeleton — v25 G4: web/components/pitch/sb1-slides/ tree
// 17 slide files, 0 tests (parallel to v24 G1 web/components/pitch/slides/ where
// only FinancialsSlide is covered).
//
// Place at:  web/components/pitch/__tests__/sb1-slides.contract.test.ts
// Run from web/:  pnpm vitest run components/pitch/__tests__/sb1-slides.contract
//
// SHAPE A (this file): SOURCE-LEVEL contract assertions. No React render, no
// jsdom, no Three.js loader, no recharts ResponsiveContainer mocks. We read
// each .tsx file as text and assert structural invariants:
//   - Named export `Slide<Name>` matches filename (no rogue default export)
//   - Component takes a `{ scenario: Scenario }` prop (uniform interface)
//   - Imports `'use client'` directive (server components would crash with
//     framer-motion / Three.js)
//   - References SPEAKER_NOTES (every slide must surface presenter context)
//   - No hardcoded URL into qdaria.com or zipminator.com (data layer only)
//
// SHAPE B (defer until Shape A bundle ships):
//   Render each slide for each Scenario value; mock Three.js + recharts;
//   assert no React error boundary fires. Cost: high (Three.js + RAF + jsdom
//   ResizeObserver shim), value: low (visual issues caught faster by playwright
//   screenshots in web/e2e/).
//
// Why source-level: 24 prior audits keep flagging "47 untested slides", but
// each render-mode test pulls 200+ KB of mocks (recharts, framer-motion,
// next/image, Three.js). Source-level lets ONE file cover ALL 17 slides
// without test-infra explosion.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SB1_DIR = join(__dirname, "..", "sb1-slides");

function listSlideFiles(): string[] {
  if (!existsSync(SB1_DIR)) return [];
  return readdirSync(SB1_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .sort();
}

const SLIDE_FILES = listSlideFiles();

// Files that v25 ran against and surfaced REAL bugs (filename↔export drift +
// duplicate component definitions). They stay in `KNOWN_DRIFT` so the per-file
// `it.each` block skips them with a citation; the standalone "duplicate
// component names" test below INTENTIONALLY fails-strict so the issue is loud
// in CI rather than buried.
//
// USER ACTION REQUIRED — pick one of these for SlideBusinessCases.tsx:
//   (A) Delete SlideBusinessCases.tsx entirely. Use SlidePortfolio.tsx,
//       SlideRiskModeling.tsx, SlideFraudDetection.tsx, SlideQRNG.tsx
//       (which already exist with proper Props interfaces).
//   (B) Rename SlideBusinessCases.tsx -> SlideBusinessCasesIndex.tsx (or
//       a barrel `index.ts`) and remove the inline component bodies; re-
//       export from the per-slide files. Investor copy lives in ONE place.
//   (C) Keep both but rename one set (e.g. SlidePortfolioCard) to make the
//       intent of "two different views of the same business case" explicit.
//
// SlideMarketAndStrategy.tsx exports `SlideMarketSize` instead of matching its
// filename — same pick: rename file OR rename export.
const KNOWN_DRIFT = new Set([
  "SlideBusinessCases.tsx",
  "SlideMarketAndStrategy.tsx",
]);

const SLIDE_FILES_CHECKED = SLIDE_FILES.filter((f) => !KNOWN_DRIFT.has(f));

describe("sb1-slides contract (source-level)", () => {
  it("has at least 17 slide files (regression guard against accidental delete)", () => {
    expect(SLIDE_FILES.length).toBeGreaterThanOrEqual(17);
  });

  it.each(SLIDE_FILES)("%s declares 'use client' directive", (file) => {
    const src = readFileSync(join(SB1_DIR, file), "utf8");
    // Must be on first non-empty line (Next 16 swc enforces this).
    const firstNonEmpty = src
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    expect(firstNonEmpty).toMatch(/^['"]use client['"];?$/);
  });

  it.each(SLIDE_FILES_CHECKED)("%s exports named component matching filename", (file) => {
    const componentName = file.replace(/\.tsx$/, "");
    const src = readFileSync(join(SB1_DIR, file), "utf8");
    // Accept either:  export const Foo:  or  export const Foo =
    // Reject:  export default ...
    expect(src).toMatch(new RegExp(`export\\s+const\\s+${componentName}\\b`));
    expect(src).not.toMatch(/^export\s+default\s+/m);
  });

  it.each(SLIDE_FILES_CHECKED)("%s accepts a Scenario-shaped prop", (file) => {
    const src = readFileSync(join(SB1_DIR, file), "utf8");
    // Either inline `scenario: Scenario` OR a Props interface that names
    // `scenario`. Catches accidental refactors that drop the scenario prop
    // and break the parent SB1PitchDeck tab dispatcher silently.
    expect(src).toMatch(/scenario\s*:\s*Scenario/);
  });

  it.each(SLIDE_FILES_CHECKED)("%s wires SPEAKER_NOTES (presenter context surface)", (file) => {
    const src = readFileSync(join(SB1_DIR, file), "utf8");
    // SPEAKER_NOTES is the canonical narration source per v20 session2 G1.
    // A slide WITHOUT it presents a blank notes panel, which surfaces as
    // "we have nothing to say about slide N" in investor demos.
    expect(src).toMatch(/SPEAKER_NOTES/);
  });

  it.each(SLIDE_FILES)("%s does not hardcode external URLs in JSX", (file) => {
    const src = readFileSync(join(SB1_DIR, file), "utf8");
    // Marketing copy + URLs belong in @/lib/pitch-data or @/lib/sb1-pitch-data.
    // A hardcoded https://qdaria.com/... in a slide leaks copy ownership and
    // makes A/B testing the deck impossible. The check looks for http(s):// in
    // attribute position; matches in import statements are excluded.
    const hardcoded = src
      .split("\n")
      .filter((l) => !l.trim().startsWith("import"))
      .filter((l) => !l.trim().startsWith("//"))
      .filter((l) => /https?:\/\/(qdaria|zipminator)\.com/i.test(l));
    expect(hardcoded, `hardcoded brand URL in ${file}: ${hardcoded.join(" / ")}`)
      .toEqual([]);
  });

  it("every slide name appears in SLIDE_TITLES (no orphan slide files)", async () => {
    // Pin: a slide file that exists but is not registered in SLIDE_TITLES is
    // dead code (parallel to v20 session2 G1 which found note-vs-title drift).
    // The implementation of SLIDE_TITLES lives in @/lib/sb1-pitch-data; if
    // that module path changes, this test must be updated in lockstep.
    const slideDataPath = join(__dirname, "..", "..", "..", "lib", "sb1-pitch-data.ts");
    if (!existsSync(slideDataPath)) {
      // Module not present in this checkout — skip rather than false-positive.
      return;
    }
    const dataSrc = readFileSync(slideDataPath, "utf8");
    for (const file of SLIDE_FILES) {
      const name = file.replace(/\.tsx$/, "");
      // Name should appear at least once in the data file (as a registry key
      // OR as a comment mapping). Loose check; tighten when SLIDE_TITLES
      // structure stabilizes.
      expect(dataSrc, `${name} missing from sb1-pitch-data.ts registry`)
        .toContain(name);
    }
  });
});

describe("sb1-slides duplicate-component detector (v25 G4 fix-during-audit finding)", () => {
  it("no Slide<Name> component is exported by more than one file", () => {
    // v25 ran the contract test against bb7a381 and surfaced that
    // SlideBusinessCases.tsx defines SlidePortfolio, SlideRiskModeling,
    // SlideFraudDetection, AND SlideQRNG inline — while separate files
    // SlidePortfolio.tsx, SlideRiskModeling.tsx, SlideFraudDetection.tsx,
    // SlideQRNG.tsx ALSO export those same names with full Props interfaces.
    //
    // Whichever file the bundler resolves first becomes the actual rendered
    // component. The wrapper version takes no props (React.FC), the per-file
    // version takes scenario-shaped props — so the symptom of resolving the
    // wrong one is "scenario toggle silently does nothing on this slide."
    //
    // This test FAILS until the user picks A/B/C above (KNOWN_DRIFT block).
    // It is the regression guard that flips green when the dup is removed.
    const exportToFiles: Record<string, string[]> = {};
    for (const file of SLIDE_FILES) {
      const src = readFileSync(join(SB1_DIR, file), "utf8");
      const matches = src.matchAll(/^export\s+const\s+(Slide\w+)\b/gm);
      for (const m of matches) {
        const name = m[1];
        (exportToFiles[name] ||= []).push(file);
      }
    }
    const dups = Object.entries(exportToFiles)
      .filter(([, files]) => files.length > 1)
      .map(([name, files]) => `${name} -> ${files.join(", ")}`);
    expect(dups, `duplicate Slide* exports across sb1-slides/:\n  ${dups.join("\n  ")}`)
      .toEqual([]);
  });
});

describe("sb1-slides convergence with web/components/pitch/slides/", () => {
  it("slides/ and sb1-slides/ do NOT share component names (avoid resolution ambiguity)", () => {
    const SLIDES_DIR = join(__dirname, "..", "slides");
    if (!existsSync(SLIDES_DIR)) return;
    const slidesNames = readdirSync(SLIDES_DIR)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(/\.tsx$/, ""));
    const sb1Names = SLIDE_FILES.map((f) => f.replace(/\.tsx$/, ""));
    const overlap = slidesNames.filter((n) => sb1Names.includes(n));
    expect(overlap, `name collision between slides/ and sb1-slides/: ${overlap.join(", ")}`)
      .toEqual([]);
  });
});
