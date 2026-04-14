#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const iterDir = process.argv[2];
if (!iterDir) {
  console.error("usage: manifest-lint.mjs <iter-dir>");
  process.exit(2);
}

const REPO_ROOT =
  process.env.REPO_ROOT ||
  execFileSync("git", ["rev-parse", "--show-toplevel"]).toString().trim();

const manifestPath = join(iterDir, "MANIFEST.md");
if (!existsSync(manifestPath)) {
  console.error(`manifest-lint: MANIFEST.md missing at ${manifestPath}`);
  process.exit(1);
}
const manifest = readFileSync(manifestPath, "utf8");

const readJson = (name) => {
  const p = join(iterDir, name);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return {};
  }
};
const lighthouse = readJson("lighthouse.json");
const oauth = readJson("oauth.json");
const pillars = readJson("pillars.json");

const BANNED_WORDS = [
  "honest",
  "honestly",
  "to be honest",
  "I want to be transparent",
  "I appreciate",
  "Great question",
  "Absolutely",
  "Let me be clear",
  "robust",
  "leverage",
  "delve",
  "it's worth noting",
  "importantly",
  "game-changer",
  "paradigm shift",
  "cutting-edge",
];
const EM_DASH = "\u2014";

let fail = 0;

for (const w of BANNED_WORDS) {
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "i");
  if (re.test(manifest)) {
    console.error(`manifest-lint: banned word "${w}"`);
    fail = 1;
  }
}
if (manifest.includes(EM_DASH)) {
  console.error("manifest-lint: em dash (U+2014) present");
  fail = 1;
}

const flatten = (obj, prefix = "", acc = new Map()) => {
  if (typeof obj !== "object" || obj === null) return acc;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "number") acc.set(key, v);
    else if (typeof v === "object") flatten(v, key, acc);
  }
  return acc;
};

const known = new Set([
  ...flatten(lighthouse).values(),
  ...flatten(oauth).values(),
  ...flatten(pillars).values(),
]);
const knownValues = Array.from(known);

const numberLiterals = manifest.match(/[-+]?\d+\.\d{2,}/g) || [];
for (const lit of numberLiterals) {
  const v = Number(lit);
  if (!Number.isFinite(v)) continue;
  const matched = knownValues.some((x) => Math.abs(x - v) < 0.001);
  if (!matched) {
    console.error(
      `manifest-lint: number ${lit} not found in lighthouse/oauth/pillars JSON`,
    );
    fail = 1;
  }
}

const pathMatches = manifest.match(/`([^`\n]+\/[^`\n]+)`/g) || [];
for (const raw of pathMatches) {
  const path = raw.slice(1, -1);
  if (path.includes(" ") || path.startsWith("#") || path.includes("://"))
    continue;
  const absolute = path.startsWith("/") ? path : join(REPO_ROOT, path);
  if (!existsSync(absolute)) {
    console.error(`manifest-lint: path does not exist: ${path}`);
    fail = 1;
  }
}

const shaMatches = manifest.match(/\b[0-9a-f]{7,40}\b/gi) || [];
for (const sha of shaMatches) {
  if (sha.length < 7) continue;
  try {
    execFileSync("git", ["cat-file", "-e", sha], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
  } catch {
    console.error(`manifest-lint: SHA does not resolve: ${sha}`);
    fail = 1;
  }
}

if (fail) {
  console.error("manifest-lint: FAIL");
  process.exit(1);
}
console.log("manifest-lint: OK");
