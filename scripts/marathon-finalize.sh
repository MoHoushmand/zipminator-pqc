#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATE_FILE="$REPO_ROOT/.marathon/.marathon-state.json"
[[ -f "$STATE_FILE" ]] || { echo "marathon-finalize: no state file" >&2; exit 2; }

STATE_FILE="$STATE_FILE" REPO_ROOT="$REPO_ROOT" python3 <<'PY'
import glob, json, os, subprocess, sys

state_path = os.environ["STATE_FILE"]
root = os.environ["REPO_ROOT"]
state = json.load(open(state_path))
run_id = state.get("run_id", "unknown")
out = os.path.join(root, ".marathon", f"RUN-SUMMARY-{run_id}.md")

lines = []
lines.append(f"# Marathon Run Summary, {run_id}")
lines.append("")
lines.append(f"- preset: {state.get('preset','?')}")
lines.append(f"- branch: {state.get('branch','?')}")
lines.append(f"- status: {state.get('status','?')}")
lines.append(f"- started: {state.get('started_at','?')}")
lines.append(f"- last heartbeat: {state.get('last_heartbeat','?')}")
lines.append(f"- iterations: {state.get('iteration',0)} / {state.get('max_iterations',0)}")
lines.append(f"- composite: {float(state.get('composite_score',0)):.4f}")
lines.append(f"- budget remaining: ${float(state.get('budget_usd_remaining',0)):.2f}")
lines.append(f"- last green sha: {state.get('last_green_sha','?')}")
teams = state.get("teams", {})
lines.append(f"- team state: U={teams.get('U','?')} O={teams.get('O','?')} P={teams.get('P','?')}")
if state.get("failure_mode"):
    lines.append(f"- failure_mode: {state['failure_mode']}")

iter_dirs = sorted(glob.glob(os.path.join(root, ".marathon/iter-*")))
lines.append("")
lines.append("## Last 20 iterations")
for d in iter_dirs[-20:]:
    p = os.path.join(d, "iteration.json")
    if not os.path.isfile(p):
        continue
    try:
        data = json.load(open(p))
    except Exception:
        continue
    cs = float(data.get("composite_score", 0))
    lh = float(data.get("lighthouse_avg", 0))
    oa = float(data.get("oauth_pass_rate", 0))
    lines.append(f"- {os.path.basename(d)}: composite={cs:.3f} lighthouse={lh:.3f} oauth={oa:.2f}")

lines.append("")
lines.append("## Failure-mode histogram")
histogram = {}
for d in iter_dirs:
    p = os.path.join(d, "iteration.json")
    if not os.path.isfile(p):
        continue
    try:
        data = json.load(open(p))
    except Exception:
        continue
    fm = data.get("failure_mode")
    if fm:
        histogram[fm] = histogram.get(fm, 0) + 1
if histogram:
    for k, v in sorted(histogram.items(), key=lambda x: -x[1]):
        lines.append(f"- {k}: {v}")
else:
    lines.append("- none")

lines.append("")
lines.append("## Recent commits")
try:
    ref = state.get("branch") or "HEAD"
    log = subprocess.check_output(
        ["git", "-C", root, "log", "--oneline", "-n", "10", ref],
        stderr=subprocess.DEVNULL,
    ).decode()
    for line in log.strip().split("\n"):
        if line:
            lines.append(f"- {line}")
except Exception as e:
    lines.append(f"- (git log failed: {e})")

with open(out, "w") as f:
    f.write("\n".join(lines) + "\n")
print(f"marathon-finalize: wrote {out}")
PY
