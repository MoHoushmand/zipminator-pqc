#!/usr/bin/env bash
set -euo pipefail

# PostToolUse hook: if Edit/Write touched web/app or web/components,
# run the Playwright screenshots project and drop PNGs into
# _screenshots/YYYY-MM-DD/iter-NN/. Iteration number comes from marathon
# state or falls back to "manual".

input_json="$(cat)"
tool_name="$(jq -r '.tool_name // empty' <<<"$input_json")"
file_path="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' <<<"$input_json")"

[[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]] || exit 0
[[ -n "$file_path" ]] || exit 0

case "$file_path" in
  */web/app/*|*/web/components/*|*/web/app/**|*/web/components/**)
    ;;
  *)
    exit 0
    ;;
esac

repo_root="$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$repo_root" ]] && exit 0

state_file="$repo_root/.marathon/.marathon-state.json"
iter="manual"
if [[ -f "$state_file" ]]; then
  iter="$(jq -r '.iteration // "manual"' "$state_file" 2>/dev/null || echo manual)"
  iter="$(printf 'iter-%02d' "$iter" 2>/dev/null || echo "iter-$iter")"
fi

date_dir="$(date +%Y-%m-%d)"
out_dir="$repo_root/_screenshots/$date_dir/$iter"
mkdir -p "$out_dir"

cd "$repo_root/web"
if ! lsof -nP -iTCP:3099 -sTCP:LISTEN >/dev/null 2>&1; then
  exit 0
fi

PLAYWRIGHT_OUTPUT_DIR="$out_dir" \
  pnpm exec playwright test e2e/smoke.spec.ts \
    --project=chromium \
    --reporter=list \
    >"$out_dir/playwright.log" 2>&1 || true

exit 0
