#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
# shellcheck source=scripts/_safe-rm.sh
source "$REPO_ROOT/scripts/_safe-rm.sh"
ITER_DIR="$REPO_ROOT/.marathon"

KEEP=3
DRY_RUN=0
PRUNE_TAGS=""

usage() {
  cat <<EOF
marathon-gc.sh
  --keep N              keep the most recent N milestone snapshots (default 3)
  --dry-run             print what would be removed, do not remove
  --prune-tags <run>    delete local git tags under marathon/<run>/*
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep) KEEP="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --prune-tags) PRUNE_TAGS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "marathon-gc: unknown arg $1" >&2; usage >&2; exit 2 ;;
  esac
done

prune_milestones() {
  local milestones total remove
  milestones=$(find "$ITER_DIR" -maxdepth 2 -name "docker-build.tar.gz" 2>/dev/null | sort || true)
  if [[ -z "$milestones" ]]; then
    echo "marathon-gc: no milestone snapshots found"
    return
  fi
  total=$(echo "$milestones" | wc -l | tr -d ' ')
  if [[ "$total" -le "$KEEP" ]]; then
    echo "marathon-gc: $total milestone(s), keep $KEEP, nothing to prune"
    return
  fi
  remove=$(echo "$milestones" | head -n "$((total - KEEP))")
  while IFS= read -r tar; do
    [[ -z "$tar" ]] && continue
    local dir
    dir="$(dirname "$tar")"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] would prune milestone artefacts in $dir"
    else
      echo "pruning milestone artefacts in $dir"
      safe_rm "$tar"
      for name in .next playwright-report coverage; do
        [[ -e "$dir/$name" ]] && safe_rm "$dir/$name"
      done
    fi
  done <<< "$remove"
}

prune_tags() {
  local run="$1" tags
  tags=$(git -C "$REPO_ROOT" tag --list "marathon/${run}/*")
  if [[ -z "$tags" ]]; then
    echo "marathon-gc: no tags under marathon/${run}/*"
    return
  fi
  while IFS= read -r t; do
    [[ -z "$t" ]] && continue
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] would delete tag $t"
    else
      git -C "$REPO_ROOT" tag -d "$t"
    fi
  done <<< "$tags"
}

prune_milestones
[[ -n "$PRUNE_TAGS" ]] && prune_tags "$PRUNE_TAGS"
echo "marathon-gc: done"
