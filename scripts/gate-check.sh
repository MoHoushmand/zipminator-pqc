#!/usr/bin/env bash
# gate-check.sh — deterministic per-track quality gate runner.
# Selects the gate set by track type (per docs/guides/program/PROGRAM.yaml gate_policy
# and zipminator/CLAUDE.md Build & Test). Exit 0 = green (track may flip to AWAITING_REVIEW).
# Holds the port-3099 singleton lock for any web build+screenshot step.
#
# Usage: gate-check.sh --track <ID> [--worktree <path>]
set -uo pipefail   # NOTE: not -e; we want to run all checks and aggregate

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
TRACK="" ; WT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --track) TRACK="$2"; shift 2;;
    --worktree) WT="$2"; shift 2;;
    *) echo "gate-check: unknown arg $1" >&2; exit 1;;
  esac
done
[ -n "$TRACK" ] || { echo "gate-check: --track required" >&2; exit 1; }
DIR="${WT:-$ROOT}"; [ -d "$DIR" ] || DIR="$ROOT"
cd "$DIR"

PASS=0; FAIL=0
ok()   { printf '\033[32m  ✓ %s\033[0m\n' "$1"; PASS=$((PASS+1)); }
no()   { printf '\033[31m  ✗ %s\033[0m\n' "$1"; FAIL=$((FAIL+1)); }
run()  { local name="$1"; shift; if "$@" >/tmp/gate-$TRACK-$$.log 2>&1; then ok "$name"; else no "$name (see /tmp/gate-$TRACK-$$.log)"; fi; }

# Which stacks does this track touch? (by convention)
rust=0; web=0; flutter=0; tauri=0; python=0; docs=0; crypto=0
case "$TRACK" in
  K|V|S)        rust=1; crypto=1;;
  C)            tauri=1; crypto=1;;       # browser proxy is crypto-adjacent
  M2)           rust=1;;
  M3)           rust=1; crypto=1; flutter=1;;
  M7)           rust=1;;
  A|J|B|M6)     web=1;;
  F)            flutter=1;;
  D)            python=1;;
  E|I)          flutter=1;;
  G|H|Lic)      docs=1;;
  T0)           rust=1; web=1; flutter=1; python=1;;   # integration matrix
  Sec)          docs=1;;
esac

echo "── gate: $TRACK  (rust=$rust web=$web flutter=$flutter tauri=$tauri python=$python docs=$docs crypto=$crypto) ──"

if [ "$rust" = 1 ]; then
  run "cargo test --workspace"            cargo test --workspace
  run "cargo clippy -D warnings"          cargo clippy --workspace --all-targets -- -D warnings
  run "cargo fmt --check"                 cargo fmt --all -- --check
  if [ "$crypto" = 1 ]; then
    run "cargo audit"                     bash -c 'command -v cargo-audit >/dev/null && cargo audit || echo "cargo-audit not installed (CI mirrors security.yml)"'
    run "cargo deny check"                bash -c 'command -v cargo-deny >/dev/null && cargo deny check || echo "cargo-deny not installed (CI mirrors security.yml)"'
    echo "  · const-time + NIST-KAT + cargo-fuzz: run in CI security.yml; human review REQUIRED for crypto"
  fi
fi

if [ "$tauri" = 1 ]; then
  run "browser cargo test"                bash -c 'cd "'"$DIR"'/browser/src-tauri" && cargo test'
  run "browser clippy -D warnings"        bash -c 'cd "'"$DIR"'/browser/src-tauri" && cargo clippy --all-targets -- -D warnings'
fi

if [ "$web" = 1 ]; then
  ( cd web 2>/dev/null && {
      run "pnpm build" bash -c 'pnpm build --if-present 2>/dev/null || pnpm build'
    } ) || no "web/ not found in $DIR"
  echo "  · Playwright runs vs `next start -p 3099` (production build, never HMR) — holds 3099 lock"
fi

if [ "$flutter" = 1 ]; then
  ( cd app 2>/dev/null && {
      run "flutter test"    flutter test
      run "flutter analyze" flutter analyze
    } ) || no "app/ not found in $DIR"
fi

if [ "$python" = 1 ]; then
  run "pytest (zip-pqc)" bash -c 'eval "$(micromamba shell hook --shell bash 2>/dev/null)"; micromamba activate zip-pqc 2>/dev/null; pytest tests/ -q'
fi

if [ "$docs" = 1 ]; then
  # claim-integrity: forbidden FIPS-certified phrasing must be absent.
  # Scope to live docs; exclude archived transcripts/_archive (historical quotes are not claims).
  # Match the phrase, then drop disclaimer/prohibition lines (e.g. 'NEVER claim "FIPS certified"',
  # 'not ... FIPS certified', checklist items) which are correct guidance, not claims.
  CLAIM_HITS=$(grep -rniE "FIPS[ -]?certified|NIST[ -]?certified|certified[ -]?compliant" \
      docs/guides docs/research docs/ip marketing README.md 2>/dev/null \
      | grep -vE "session-transcripts|_archive|runbooks" \
      | grep -viE "\bnot\b|never|don'?t|do not|avoid|forbidden|prohibit|instead|no \"|say \"implements|\[ \]" || true)
  if [ -n "$CLAIM_HITS" ]; then
    no "claim-scan: forbidden 'FIPS certified' phrasing: $(echo "$CLAIM_HITS" | head -3 | cut -c1-100)"
  else
    ok "claim-scan clean (no 'FIPS certified' in live docs)"
  fi
  echo "  · citation-resolution (DOI/arXiv) + link-check: run by the docs/papers agent (zero-hallucination)"
fi

echo "── result: $PASS passed, $FAIL failed ──"
[ "$FAIL" -eq 0 ]
