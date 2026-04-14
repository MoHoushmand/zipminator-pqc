#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
export REPO_ROOT
cd "$REPO_ROOT"
# shellcheck source=scripts/_safe-rm.sh
source "$REPO_ROOT/scripts/_safe-rm.sh"

PRESET="zipminator-oauth-ui-pillars"
MAX_ITER=200
BUDGET_USD="${MARATHON_BUDGET_USD:-500}"
DRY_RUN=0
RESUME=0
RUN_ID_OVERRIDE=""
USE_CAFFEINATE=1

usage() {
  cat <<EOF
marathon.sh [flags]
  --preset <name>       preset under ~/.claude/prompts/AESR/v6/presets/ (default: zipminator-oauth-ui-pillars)
  --max-iter <n>        hard iteration ceiling (default: 200)
  --budget-usd <usd>    cost ceiling (default: \$MARATHON_BUDGET_USD or 500)
  --dry-run             preflight + 1 iteration, no completion promise
  --resume              continue from .marathon-state.json
  --run-id <id>         override run-id (implies --resume)
  --no-caffeinate       do not wrap in caffeinate -dimsu
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preset) PRESET="$2"; shift 2 ;;
    --max-iter) MAX_ITER="$2"; shift 2 ;;
    --budget-usd) BUDGET_USD="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --resume) RESUME=1; shift ;;
    --run-id) RUN_ID_OVERRIDE="$2"; shift 2 ;;
    --no-caffeinate) USE_CAFFEINATE=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "marathon: unknown arg $1" >&2; usage >&2; exit 2 ;;
  esac
done

PRESET_FILE="${HOME}/.claude/prompts/AESR/v6/presets/${PRESET}.md"
[[ -f "$PRESET_FILE" ]] || { echo "marathon: preset not found: $PRESET_FILE" >&2; exit 2; }

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "marathon: refusing to run on $BRANCH; check out a feature branch first" >&2
  exit 2
fi

STATE_FILE="$REPO_ROOT/.marathon/.marathon-state.json"
mkdir -p "$(dirname "$STATE_FILE")"

export MARATHON_PRESET_FILE="$PRESET_FILE"
python3 - <<'PY'
import json, os, re, sys

preset_path = os.environ["MARATHON_PRESET_FILE"]
repo = os.environ["REPO_ROOT"]
with open(preset_path) as f:
    text = f.read()
m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
if not m:
    print("marathon: preset missing YAML front-matter", file=sys.stderr)
    sys.exit(2)

def parse_block_list(front_matter, key):
    pat = re.compile(
        r"^(?P<indent> *)" + re.escape(key) + r":\s*\n(?P<body>(?:\1 +-[^\n]*\n?)+)",
        re.MULTILINE,
    )
    match = pat.search(front_matter)
    if not match:
        return []
    items = []
    for line in match.group("body").splitlines():
        stripped = line.strip()
        if stripped.startswith("-"):
            item = stripped[1:].strip().strip("'").strip('"')
            if item:
                items.append(item)
    return items

front = m.group(1)
env_required = parse_block_list(front, "env_required")
env_file = os.path.join(repo, "web", ".env.local")
env_vars = {}
if os.path.isfile(env_file):
    for line in open(env_file):
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        if s.startswith("export "):
            s = s[len("export "):]
        k, _, v = s.partition("=")
        env_vars[k.strip()] = v.strip().strip("'").strip('"')
missing = [k for k in env_required if not env_vars.get(k)]
if missing:
    print(f"marathon: missing env in web/.env.local: {missing}", file=sys.stderr)
    sys.exit(2)

plugins_required = parse_block_list(front, "plugins_required")
settings_path = os.path.expanduser("~/.claude/settings.json")
if plugins_required and os.path.isfile(settings_path):
    data = json.load(open(settings_path))
    enabled = data.get("enabledPlugins", {}) or {}
    enabled_names = set()
    for k in enabled:
        enabled_names.add(k)
        enabled_names.add(k.split("@", 1)[0])
        enabled_names.add(k.split("/", 1)[-1])
    missing_p = [p for p in plugins_required if p not in enabled_names]
    if missing_p:
        print(f"marathon: plugins not enabled: {missing_p}", file=sys.stderr)
        sys.exit(2)
print("marathon: preset validation ok")
PY

PER_ITER_USD="6.62"
ESTIMATED_USD=$(python3 -c "print(round($MAX_ITER * $PER_ITER_USD, 2))")
if python3 -c "import sys; sys.exit(0 if $ESTIMATED_USD <= $BUDGET_USD else 1)"; then
  echo "marathon: preflight \$${ESTIMATED_USD} <= budget \$${BUDGET_USD} [unverified: Opus 4.6 rates]"
else
  echo "marathon: preflight FAIL, estimated \$${ESTIMATED_USD} > budget \$${BUDGET_USD}" >&2
  exit 3
fi

if [[ -n "$RUN_ID_OVERRIDE" ]]; then
  RUN_ID="$RUN_ID_OVERRIDE"; RESUME=1
elif [[ "$RESUME" -eq 1 && -f "$STATE_FILE" ]]; then
  RUN_ID=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('run_id') or '')")
  [[ -n "$RUN_ID" ]] || { echo "marathon: state has no run_id, cannot resume" >&2; exit 2; }
else
  RUN_ID="$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 3)"
fi
echo "marathon: run-id=$RUN_ID preset=$PRESET max-iter=$MAX_ITER budget=\$${BUDGET_USD}"

for p in github google linkedin; do
  f="$REPO_ROOT/web/e2e/.auth/${p}.json"
  if [[ ! -f "$f" ]]; then
    echo "marathon: missing $f" >&2
    echo "  reseed: pnpm -C web exec playwright test e2e/_seed-auth.spec.ts --project=seed --headed" >&2
    exit 4
  fi
  if [[ $(find "$f" -mtime +1 2>/dev/null | wc -l | tr -d ' ') -gt 0 ]]; then
    echo "marathon: $f older than 24h, reseed required" >&2
    exit 4
  fi
done

FREE_GB=$(df -g "$REPO_ROOT" | awk 'NR==2{print $4}')
if [[ "${FREE_GB:-0}" -lt 20 ]]; then
  echo "marathon: only ${FREE_GB}G free, need >= 20G" >&2
  exit 5
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "marathon: dry-run preflight complete; no completion promise issued"
  exit 0
fi

COMPLETION_PROMISE="MARATHON_CONVERGED_${RUN_ID}"
LOG_FILE="$REPO_ROOT/.marathon/.marathon-${RUN_ID}.log"

APPEND_SYS="Run-ID: ${RUN_ID}; Max-Iter: ${MAX_ITER}; Budget: ${BUDGET_USD}; Completion-Promise: ${COMPLETION_PROMISE}"

echo "marathon: launching; streaming to $LOG_FILE"
PRESET_BODY="$(cat "$PRESET_FILE")"

if [[ "$USE_CAFFEINATE" -eq 1 ]]; then
  caffeinate -dimsu claude --effort max -p "$PRESET_BODY" --append-system-prompt "$APPEND_SYS" 2>&1 | tee "$LOG_FILE"
else
  claude --effort max -p "$PRESET_BODY" --append-system-prompt "$APPEND_SYS" 2>&1 | tee "$LOG_FILE"
fi
