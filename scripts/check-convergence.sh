#!/usr/bin/env bash
# Convergence check for marathon loop.
# Exit 0 if the run has converged (COMPLETION_PROMISE sentinel present in state file AND
# required quality gates green). Exit 1 otherwise. Exit 2 on config error.
set -euo pipefail

usage() {
  cat <<'EOF'
check-convergence.sh [--state <file>] [--run-id <id>] [--strict] [--json]
  --state    path to marathon-state.json (default: .marathon/.marathon-state.json)
  --run-id   run id to match (default: read from state file)
  --strict   also require truth-score >= 0.95 for last 3 iterations
  --json     emit a JSON report to stdout
EOF
}

STATE=".marathon/.marathon-state.json"
RUN_ID=""
STRICT=0
JSON=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --state) STATE="$2"; shift 2 ;;
    --run-id) RUN_ID="$2"; shift 2 ;;
    --strict) STRICT=1; shift ;;
    --json) JSON=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "check-convergence: unknown flag '$1'" >&2; usage >&2; exit 2 ;;
  esac
done

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
if [[ "$STATE" != /* ]]; then
  STATE="$REPO_ROOT/$STATE"
fi

if [[ ! -f "$STATE" ]]; then
  if [[ "$JSON" -eq 1 ]]; then
    printf '{"converged":false,"reason":"state_file_missing","state":"%s"}\n' "$STATE"
  else
    echo "check-convergence: state file missing: $STATE" >&2
  fi
  exit 1
fi

python3 - "$STATE" "$RUN_ID" "$STRICT" "$JSON" <<'PY'
import json, os, sys, subprocess

state_path, run_id, strict, want_json = sys.argv[1], sys.argv[2], sys.argv[3] == "1", sys.argv[4] == "1"

def emit(converged, reason, extra=None):
    payload = {"converged": converged, "reason": reason}
    if extra:
        payload.update(extra)
    if want_json:
        print(json.dumps(payload))
    else:
        status = "converged" if converged else "not-converged"
        print(f"check-convergence: {status} ({reason})")
    sys.exit(0 if converged else 1)

try:
    with open(state_path) as f:
        state = json.load(f)
except Exception as exc:
    emit(False, f"state_parse_error:{exc}")

if not run_id:
    run_id = state.get("run_id") or ""
if not run_id:
    emit(False, "run_id_unknown")

sentinel = f"MARATHON_CONVERGED_{run_id}"
promise = state.get("completion_promise") or ""
if promise != sentinel:
    emit(False, "sentinel_missing", {"expected": sentinel, "actual": promise, "run_id": run_id})

gates = state.get("gates") or {}
required = ["cargo_test", "web_build", "flutter_test", "clippy"]
failed = [g for g in required if gates.get(g) not in ("pass", True)]
if failed:
    emit(False, "gates_failing", {"failed_gates": failed, "run_id": run_id})

if strict:
    scores = state.get("truth_scores") or []
    last3 = scores[-3:] if isinstance(scores, list) else []
    if len(last3) < 3 or any((s or 0) < 0.95 for s in last3):
        emit(False, "truth_score_below_threshold", {"last3": last3, "run_id": run_id})

emit(True, "ok", {"run_id": run_id, "promise": promise})
PY
