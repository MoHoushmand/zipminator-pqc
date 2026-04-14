#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATE_FILE="$REPO_ROOT/.marathon/.marathon-state.json"
HEARTBEAT="$REPO_ROOT/.marathon/.marathon-heartbeat"
INTERVAL="${MARATHON_WATCH_INTERVAL:-2}"

draw() {
  clear
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "marathon-watch: no state file at $STATE_FILE"
    return
  fi
  STATE_FILE="$STATE_FILE" HEARTBEAT="$HEARTBEAT" python3 <<'PY'
import json, os, sys, time
state = json.load(open(os.environ["STATE_FILE"]))
hb_path = os.environ["HEARTBEAT"]
hb_age = (time.time() - os.path.getmtime(hb_path)) if os.path.isfile(hb_path) else -1

def bar(n, total, w=40):
    if total <= 0:
        return "[" + " " * w + "]"
    f = max(0, min(w, int(n / total * w)))
    return "[" + "#" * f + "." * (w - f) + "]"

print("=" * 80)
print(f"Marathon run-id: {state.get('run_id','?')}   status: {state.get('status','?')}")
print(f"preset: {state.get('preset','?')}   branch: {state.get('branch','?')}")
print("=" * 80)
it = int(state.get("iteration", 0))
maxit = int(state.get("max_iterations", 0))
print(f"iter {it}/{maxit}  {bar(it, maxit)}")
print(f"composite: {float(state.get('composite_score', 0)):.3f}   "
      f"budget remaining: ${float(state.get('budget_usd_remaining', 0)):.2f}")
teams = state.get("teams", {})
print(f"teams: U={teams.get('U','?')}  O={teams.get('O','?')}  P={teams.get('P','?')}")
print(f"last-green: iter {state.get('last_green_iter', 0)} "
      f"sha {(state.get('last_green_sha') or '?')[:8]}")
if hb_age < 0:
    print("heartbeat: no file")
elif hb_age > 1200:
    print(f"heartbeat: STALE ({int(hb_age)}s)")
else:
    print(f"heartbeat: {int(hb_age)}s ago")
fm = state.get("failure_mode")
if fm:
    print(f"failure_mode: {fm}")
if state.get("escape_hatch"):
    print("escape_hatch: ON")
print("=" * 80)
print("Ctrl-C exits watcher (does not affect marathon)")
PY
}

trap "clear; echo 'marathon-watch: exiting'; exit 0" INT TERM
while true; do
  draw
  sleep "$INTERVAL"
done
