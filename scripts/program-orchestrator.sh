#!/usr/bin/env bash
# program-orchestrator.sh — master spawner for the Zipminator full-program push.
# Body of `/goals launch`. Creates a per-track git worktree, initialises a ruflo
# hive + swarm, then hands off to marathon.sh for the RALPH loop.
# Manifest (human-facing state): docs/guides/program/PROGRAM.yaml
# Convention proven in .marathon/.marathon-state.json (E/M/B/S/V/G + waves).
set -euo pipefail

ROOT="${ZIPMINATOR_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DATE="20260530"
cd "$ROOT"

# track -> branch-slug  (worktree is always ../zipminator-<TRACK>)
declare -A SLUG=(
  [T0]=setup        [A]=waitlist     [J]=design-drift  [B]=web-deploy
  [K]=crypto        [V]=vpn          [S]=mesh          [F]=anon-selector
  [C]=browser       [M2]=messenger   [M3]=voip         [M6]=qai
  [M7]=email        [D]=pypi         [E]=ios           [I]=android
  [G]=papers        [H]=ip           [Lic]=licensing   [Sec]=security
)
# tracks gated on T0 landing on main
GATED_ON_T0=(D E I)
ALL_TRACKS=(T0 Sec A J B K V S F C M2 M3 M6 M7 G H Lic D E I)

log() { printf '\033[36m[program]\033[0m %s\n' "$*"; }
err() { printf '\033[31m[program:err]\033[0m %s\n' "$*" >&2; }

have_ruflo() { command -v ruflo >/dev/null 2>&1; }

worktree_for() { echo "../zipminator-$1"; }
branch_for()   { echo "marathon/$DATE/${SLUG[$1]:-$1}"; }

ensure_worktree() {
  local track="$1" wt br
  wt="$(worktree_for "$track")"; br="$(branch_for "$track")"
  if git worktree list --porcelain | grep -q "worktree $(cd "$ROOT" && pwd)/${wt#../}"; then
    log "worktree exists: $wt"
  elif [ -d "$wt" ]; then
    log "worktree dir present: $wt"
  else
    log "creating worktree $wt on $br"
    git worktree add "$wt" -b "$br" 2>/dev/null \
      || git worktree add "$wt" "$br"   # branch already exists
  fi
}

collision_check() {
  # CLAUDE.md collision detector: warn if another live session touches this worktree
  local track="$1"
  local hits
  hits=$(find "$HOME/.claude/projects" -name "*.jsonl" -mmin -15 \
           -exec grep -l "zipminator-$track" {} \; 2>/dev/null | wc -l | tr -d ' ')
  [ "$hits" != "0" ] && err "WARNING: $hits recent session(s) reference zipminator-$track"
  return 0
}

init_swarm() {
  local track="$1"
  if have_ruflo; then
    log "ruflo hive-mind + swarm: zip-$track"
    ruflo hive-mind init -t hierarchical-mesh --name "zip-$track" 2>/dev/null || true
    ruflo swarm --name "zip-$track" 2>/dev/null || true
    ruflo memory store --key "program/$track/launched" --namespace active \
      --value "branch=$(branch_for "$track") worktree=$(worktree_for "$track")" 2>/dev/null || true
  else
    err "ruflo not on PATH — skipping swarm init (agent-team Task spawns still work)"
  fi
}

launch_one() {
  local track="$1"
  [ -n "${SLUG[$track]:-}" ] || { err "unknown track: $track"; return 1; }
  if printf '%s\n' "${GATED_ON_T0[@]}" | grep -qx "$track"; then
    git log --oneline -1 main 2>/dev/null | grep -qi "version" \
      || err "NOTE: $track is gated on T0 (version reconcile on main). Launching worktree anyway; do not tag until T0 merged."
  fi
  collision_check "$track"
  ensure_worktree "$track"
  init_swarm "$track"
  log "handing off to marathon.sh for $track"
  bash "$ROOT/scripts/marathon.sh" --track "$track" \
       --worktree "$(worktree_for "$track")" --prompt-version v6.1 || true
  log "launch complete for $track (RALPH owns iteration; /goals gate $track when ready)"
}

cmd="${1:-status}"; shift || true
case "$cmd" in
  launch)
    target="${1:-}"; [ -n "$target" ] || { err "usage: launch <track>|all"; exit 1; }
    if [ "$target" = "all" ]; then
      for t in "${ALL_TRACKS[@]}"; do launch_one "$t"; done
    else
      launch_one "$target"
    fi ;;
  status)
    log "tracks (convention): ${ALL_TRACKS[*]}"
    git worktree list 2>/dev/null || true
    have_ruflo && ruflo swarm status 2>/dev/null || true ;;
  *) err "usage: $0 {launch <track>|all | status}"; exit 1 ;;
esac
