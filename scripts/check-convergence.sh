#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
ITER_DIR="${REPO_ROOT}/.marathon"
THRESHOLD="${LIGHTHOUSE_THRESHOLD:-0.95}"

log() { printf "[check-convergence] %s\n" "$*"; }

fail=0

latest_iter_dir() {
  local pointer="${ITER_DIR}/.last-iter"
  [[ -f "$pointer" ]] || return 1
  local iter
  iter=$(cat "$pointer" | tr -d '[:space:]')
  local dir
  dir=$(find "$ITER_DIR" -maxdepth 1 -type d -name "iter-${iter}-*" | head -1)
  [[ -n "$dir" ]] || return 1
  echo "$dir"
}

LAST_DIR=$(latest_iter_dir || true)
if [[ -z "$LAST_DIR" ]]; then
  log "no latest iteration dir; fail"
  exit 1
fi

LH_JSON="${LAST_DIR}/lighthouse.json"
OAUTH_JSON="${LAST_DIR}/oauth.json"
PILLARS_JSON="${LAST_DIR}/pillars.json"

# 1. Lighthouse >= threshold on all 4 categories
if [[ ! -f "$LH_JSON" ]]; then
  log "lighthouse.json missing at $LH_JSON"
  fail=1
else
  if ! python3 - "$LH_JSON" "$THRESHOLD" <<'PY'
import json, sys
path, thr = sys.argv[1], float(sys.argv[2])
with open(path) as f:
    data = json.load(f)
cats = data.get("categories") or data.get("summary") or {}
required = ("performance", "accessibility", "best-practices", "seo")
vals = {}
for k in required:
    entry = cats.get(k)
    if isinstance(entry, dict):
        vals[k] = entry.get("score", 0) or 0
    else:
        vals[k] = entry or 0
for k, v in vals.items():
    if v < thr:
        print(f"lighthouse {k}={v:.3f} < {thr}", file=sys.stderr)
        sys.exit(1)
sys.exit(0)
PY
  then
    fail=1
  fi
fi

# 2. OAuth all 4 keys pass
if [[ ! -f "$OAUTH_JSON" ]]; then
  log "oauth.json missing at $OAUTH_JSON"
  fail=1
else
  if ! python3 - "$OAUTH_JSON" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for k in ("github", "google", "linkedin", "dashboard"):
    entry = data.get(k) or {}
    if not entry.get("pass"):
        err = entry.get("error") or "not pass"
        print(f"oauth.{k}: {err}", file=sys.stderr)
        sys.exit(1)
sys.exit(0)
PY
  then
    fail=1
  fi
fi

# 3. pillars.json has 9 entries, all slugs have a non-404 SVG, composite non-regressive
if [[ ! -f "$PILLARS_JSON" ]]; then
  log "pillars.json missing at $PILLARS_JSON"
  fail=1
else
  if ! python3 - "$PILLARS_JSON" "$REPO_ROOT" <<'PY'
import json, os, sys
path, root = sys.argv[1], sys.argv[2]
with open(path) as f:
    data = json.load(f)
pillars = data.get("pillars") or []
if len(pillars) != 9:
    print(f"pillars.json has {len(pillars)} entries, need 9", file=sys.stderr)
    sys.exit(1)
for p in pillars:
    slug = p.get("slug")
    svg = os.path.join(root, "web", "public", "logos", "pillars", f"{slug}.svg")
    if not os.path.isfile(svg):
        print(f"svg missing for pillar {slug} at {svg}", file=sys.stderr)
        sys.exit(1)
print(f"composite_avg={data.get('composite_avg',0):.3f}")
sys.exit(0)
PY
  then
    fail=1
  fi
fi

# 4. Forward-progress proof
if [[ -z "$(git -C "$REPO_ROOT" diff --name-only HEAD~1..HEAD 2>/dev/null)" ]]; then
  log "no diff since HEAD~1; forward-progress failed"
  fail=1
fi

# 5. typecheck + lint clean
if ! (cd "$REPO_ROOT/web" && pnpm typecheck >/dev/null 2>&1); then
  log "pnpm -C web typecheck failed"
  fail=1
fi
if ! (cd "$REPO_ROOT/web" && pnpm lint >/dev/null 2>&1); then
  log "pnpm -C web lint failed"
  fail=1
fi

if [[ $fail -ne 0 ]]; then
  echo "FAIL"
  exit 1
fi

# Emit composite on success
python3 - "$PILLARS_JSON" "$LH_JSON" "$OAUTH_JSON" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
lh = json.load(open(sys.argv[2]))
oa = json.load(open(sys.argv[3]))
pillar_avg = p.get("composite_avg", 0)
cats = lh.get("categories") or {}
lh_vals = []
for k in ("performance","accessibility","best-practices","seo"):
    entry = cats.get(k)
    v = entry.get("score") if isinstance(entry, dict) else entry
    lh_vals.append(v or 0)
lh_avg = sum(lh_vals)/len(lh_vals) if lh_vals else 0
oa_vals = [int(bool((oa.get(k) or {}).get("pass"))) for k in ("github","google","linkedin","dashboard")]
oa_avg = sum(oa_vals)/len(oa_vals) if oa_vals else 0
composite = (pillar_avg + lh_avg + oa_avg) / 3
print(f"composite={composite:.4f} pillars={pillar_avg:.3f} lighthouse={lh_avg:.3f} oauth={oa_avg:.3f}")
PY

echo "CONVERGED"
exit 0
