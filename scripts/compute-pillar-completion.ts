#!/usr/bin/env -S npx tsx
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export const PILLAR_SLUGS = [
  "qvault",
  "qmessenger",
  "qvoip",
  "qvpn",
  "qanonymizer",
  "qai",
  "qmail",
  "qbrowser",
  "qmesh",
] as const;
export type PillarSlug = (typeof PILLAR_SLUGS)[number];

const WEIGHTS = {
  tests_pass_ratio: 0.35,
  features_shipped_ratio: 0.25,
  lighthouse_target_met: 0.15,
  a11y_violations_zero: 0.1,
  type_safety: 0.15,
} as const;

const LEGACY_NAMES: Record<PillarSlug, string[]> = {
  qvault: ["Quantum Vault"],
  qmessenger: ["PQC Messenger"],
  qvoip: ["Quantum VoIP"],
  qvpn: ["Q-VPN", "WireGuard"],
  qanonymizer: ["Anonymization Suite"],
  qai: ["Q-AI", "PQC AI Assistant"],
  qmail: ["Quantum-Secure Email"],
  qbrowser: ["ZipBrowser"],
  qmesh: ["Q-Mesh"],
};

const REPO_ROOT = process.env.REPO_ROOT;
if (!REPO_ROOT) {
  console.error("compute-pillar-completion: REPO_ROOT env var required");
  process.exit(2);
}

const TYPE_CHECK_CLEAN = process.env.TYPE_CHECK_CLEAN === "1" ? 1.0 : 0.5;
const ITER_DIR = resolveIterDir();

function resolveIterDir(): string {
  if (process.env.ITER_DIR) return process.env.ITER_DIR;
  const pointer = join(REPO_ROOT!, ".marathon/.last-iter");
  if (!existsSync(pointer)) {
    console.error(
      "compute-pillar-completion: .last-iter missing; set ITER_DIR env",
    );
    process.exit(2);
  }
  const raw = readFileSync(pointer, "utf8").trim();
  if (raw.startsWith("/")) return raw;
  const archiveRoot = join(REPO_ROOT!, ".marathon");
  const { readdirSync } = require("node:fs");
  const pad = raw.padStart(4, "0");
  const match = readdirSync(archiveRoot).find((n: string) =>
    n.startsWith(`iter-${pad}-`),
  );
  if (!match) {
    console.error(`compute-pillar-completion: no iter dir for ${raw}`);
    process.exit(2);
  }
  return join(archiveRoot, match);
}

interface PillarScore {
  slug: PillarSlug;
  tests_pass_ratio: number;
  features_shipped_ratio: number;
  lighthouse_target_met: number;
  a11y_violations_zero: number;
  type_safety: number;
  composite: number;
}

function safeJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function scoreTests(slug: PillarSlug): number {
  const data = safeJson<any>(join(REPO_ROOT!, "test-results", `${slug}.json`));
  if (!data) return 0;
  const total = Number(data.total ?? data.numTotalTests ?? 0);
  const passed = Number(data.passed ?? data.numPassedTests ?? 0);
  if (total === 0) return 0;
  return Math.max(0, Math.min(1, passed / total));
}

function scoreFeatures(slug: PillarSlug): number {
  const path = join(REPO_ROOT!, "docs/guides/FEATURES.md");
  if (!existsSync(path)) return 0;
  const text = readFileSync(path, "utf8");
  const needles = [slug, ...(LEGACY_NAMES[slug] ?? [])];
  let headingStart = -1;
  let headingLen = 0;
  for (const n of needles) {
    const re = new RegExp(`^#+[^\\n]*${n}[^\\n]*$`, "im");
    const m = text.match(re);
    if (m?.index !== undefined) {
      headingStart = m.index;
      headingLen = m[0].length;
      break;
    }
  }
  if (headingStart < 0) return 0;
  const bodyStart = headingStart + headingLen;
  const next = text.slice(bodyStart).search(/^#+\s/m);
  const section =
    next === -1 ? text.slice(bodyStart) : text.slice(bodyStart, bodyStart + next);
  const checked = (section.match(/^\s*-\s*\[x\]/gim) || []).length;
  const unchecked = (section.match(/^\s*-\s*\[ \]/gim) || []).length;
  const total = checked + unchecked;
  return total === 0 ? 0 : checked / total;
}

function scoreLighthouse(slug: PillarSlug): number {
  const data = safeJson<any>(join(ITER_DIR, `lighthouse-${slug}.json`));
  if (!data) return 0;
  const cats = data.categories || data.summary || {};
  for (const k of ["performance", "accessibility", "best-practices", "seo"]) {
    const e = cats[k];
    const v = typeof e === "object" && e ? e.score : e;
    if (!(typeof v === "number" && v >= 0.95)) return 0;
  }
  return 1;
}

function scoreA11y(slug: PillarSlug): number {
  const data = safeJson<any>(
    join(REPO_ROOT!, "test-results/a11y", `${slug}.json`),
  );
  if (!data) return 0;
  const violations = Array.isArray(data.violations) ? data.violations : [];
  const serious = violations.filter((v: any) =>
    ["serious", "critical"].includes(String(v.impact)),
  ).length;
  if (serious === 0) return 1;
  return Math.max(0, 1 - serious * 0.25);
}

function compositeFor(slug: PillarSlug): PillarScore {
  const tests = scoreTests(slug);
  const features = scoreFeatures(slug);
  const lh = scoreLighthouse(slug);
  const a11y = scoreA11y(slug);
  const ts = TYPE_CHECK_CLEAN;
  const composite =
    tests * WEIGHTS.tests_pass_ratio +
    features * WEIGHTS.features_shipped_ratio +
    lh * WEIGHTS.lighthouse_target_met +
    a11y * WEIGHTS.a11y_violations_zero +
    ts * WEIGHTS.type_safety;
  return {
    slug,
    tests_pass_ratio: tests,
    features_shipped_ratio: features,
    lighthouse_target_met: lh,
    a11y_violations_zero: a11y,
    type_safety: ts,
    composite,
  };
}

function main() {
  const pillars = PILLAR_SLUGS.map(compositeFor);
  const composite_avg =
    pillars.reduce((s, p) => s + p.composite, 0) / pillars.length;
  const out = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    iter_dir: ITER_DIR,
    weights: WEIGHTS,
    composite_avg,
    pillars,
  };
  const outPath = join(ITER_DIR, "pillars.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(
    `compute-pillar-completion: ${outPath} composite_avg=${composite_avg.toFixed(4)}`,
  );
}

main();
