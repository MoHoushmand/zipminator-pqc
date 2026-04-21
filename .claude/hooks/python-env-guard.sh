#!/usr/bin/env bash
# Auto-activate the zip-pqc micromamba env for any Python-tooling Bash command.
# Also rewrites a bare `pip install ...` to `uv pip install ...` per project policy.
# Runs as a Claude Code PreToolUse hook on Bash.
# Emits the modern hookSpecificOutput.updatedInput shape; silent no-op on pass-through.

set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

[ -z "$cmd" ] && exit 0

# Pass through if the user (or an earlier rewrite) already activated an env.
if printf '%s' "$cmd" | grep -qE '(^|[[:space:]]|&&[[:space:]]*)(micromamba|mamba|conda)[[:space:]]+activate[[:space:]]'; then
  exit 0
fi

# Only fire for Python-tooling entry points at the start of the command.
if ! printf '%s' "$cmd" | grep -qE '^[[:space:]]*(python3?|pytest|maturin|uv[[:space:]]+pip|pip)([[:space:]]|$)'; then
  exit 0
fi

# Project rule: never `pip install ...` directly; always `uv pip install ...`.
# Only rewrite when the command literally starts with `pip ` (not `uv pip`, not `python -m pip`).
rewritten="$(printf '%s' "$cmd" | sed -E 's#^([[:space:]]*)pip([[:space:]])#\1uv pip\2#')"

new_cmd="micromamba activate zip-pqc && ${rewritten}"

jq -nc \
  --arg c "$new_cmd" \
  --arg r "auto-activate zip-pqc env for Python tooling (uv pip rewrite if applicable)" \
  '{
     hookSpecificOutput: {
       hookEventName: "PreToolUse",
       permissionDecision: "allow",
       permissionDecisionReason: $r,
       updatedInput: { command: $c }
     }
   }'
