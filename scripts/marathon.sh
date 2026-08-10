#!/usr/bin/env bash
# marathon.sh — RALPH loop shim for a single program track.
# Recreated to match the proven convention in .marathon/.marathon-state.json
# (marathon/<date>/<track> branches, waves, completion sentinel). Per tdd-ralph.md
# the iteration cap is 12; on non-convergence it escalates to the user.
# Invoked by program-orchestrator.sh / `/goals launch`.
#
# Usage: marathon.sh --track <ID> --worktree <path> [--prompt-version v6.1] [--max-iter 12]
#
# This shim drives the loop bookkeeping (state, checkpoints, gate calls). The actual
# code edits happen in Claude Code agent-team teammates spawned for the track; this
# script is the harness that calls the gate and records convergence.
set -euo pipefail

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
TRACK="" ; WORKTREE="" ; PROMPT_VERSION="v6.1" ; MAX_ITER=12
while [ $# -gt 0 ]; do
  case "$1" in
    --track) TRACK="$2"; shift 2;;
    --worktree) WORKTREE="$2"; shift 2;;
    --prompt-version) PROMPT_VERSION="$2"; shift 2;;
    --max-iter) MAX_ITER="$2"; shift 2;;
    *) echo "marathon: unknown arg $1" >&2; exit 1;;
  esac
done
[ -n "$TRACK" ] || { echo "marathon: --track required" >&2; exit 1; }
WORKTREE="${WORKTREE:-../zipminator-$TRACK}"

log() { printf '\033[35m[marathon:%s]\033[0m %s\n' "$TRACK" "$*"; }
STATE_DIR="$ROOT/.marathon"; STATE="$STATE_DIR/.marathon-state.json"
mkdir -p "$STATE_DIR"

gate() {
  bash "$ROOT/scripts/gate-check.sh" --track "$TRACK" --worktree "$WORKTREE"
}

checkpoint() {
  local iter="$1"
  command -v ruflo >/dev/null 2>&1 && \
    ruflo memory store --key "program/$TRACK/checkpoint" --namespace active \
      --value "iter=$iter prompt=$PROMPT_VERSION worktree=$WORKTREE $(date -u +%FT%TZ)" 2>/dev/null || true
}

log "RALPH loop start (max $MAX_ITER iters, prompt $PROMPT_VERSION) in $WORKTREE"
iter=0
while [ "$iter" -lt "$MAX_ITER" ]; do
  iter=$((iter+1))
  log "iteration $iter/$MAX_ITER — (agent team performs Red/Green/Refactor here)"
  # The orchestrating Claude session performs the edits for this iteration, then
  # control returns here to run the gate. In headless use, wire the edit step in.
  checkpoint "$iter"
  if gate; then
    log "GATE GREEN at iter $iter — track ready for review"
    command -v ruflo >/dev/null 2>&1 && \
      ruflo memory store --key "program/$TRACK/converged" --namespace completed \
        --value "MARATHON_CONVERGED_${TRACK}_iter${iter}" 2>/dev/null || true
    echo "MARATHON_CONVERGED_${TRACK}_iter${iter}"
    exit 0
  fi
  log "gate not green — continue RALPH"
  # In an autonomous harness this would re-dispatch the fix agent; interactively the
  # orchestrator loops. Break here to hand control back to the session each pass.
  break
done

if [ "$iter" -ge "$MAX_ITER" ]; then
  log "ESCALATE: hit $MAX_ITER-iteration cap without convergence — surface to user"
  exit 2
fi
log "iteration $iter complete; re-invoke marathon.sh or /goals gate $TRACK to continue"
exit 0
