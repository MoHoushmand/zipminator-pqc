#!/bin/bash

INPUT=$(cat)
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "Claude"')
CWD=$(echo "$INPUT" | jq -r '.workspace.current_dir // .cwd')
DIR=$(basename "$CWD")

BRANCH=$(cd "$CWD" 2>/dev/null && git branch --show-current 2>/dev/null)

printf "\033[1m$MODEL\033[0m in \033[36m$DIR\033[0m"
[ -n "$BRANCH" ] && printf " on \033[33m⎇ $BRANCH\033[0m"

METRICS_DIR="$CWD/.marathon/metrics"
if [ -f "$METRICS_DIR/model-routing.log" ]; then
  LAST_TIER=$(tail -n 1 "$METRICS_DIR/model-routing.log" 2>/dev/null | awk '{print $2}' | cut -d= -f2)
  [ -n "$LAST_TIER" ] && printf " \033[35mtier=$LAST_TIER\033[0m"
fi

echo
