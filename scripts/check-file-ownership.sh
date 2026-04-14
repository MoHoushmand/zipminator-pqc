#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PRESET="${MARATHON_PRESET:-${1:-zipminator-oauth-ui-pillars}}"
PRESET_FILE="${HOME}/.claude/prompts/AESR/v6/presets/${PRESET}.md"

if [[ ! -f "$PRESET_FILE" ]]; then
  echo "check-file-ownership: preset file not found: $PRESET_FILE" >&2
  exit 2
fi

TEAM="${MARATHON_TEAM:-}"
if [[ -z "$TEAM" ]]; then
  commit_msg_file="${REPO_ROOT}/.git/COMMIT_EDITMSG"
  if [[ -f "$commit_msg_file" ]]; then
    TEAM=$(grep -E '^Marathon-Team:' "$commit_msg_file" | sed 's/Marathon-Team:[[:space:]]*//' | head -1 | tr -d '[:space:]')
  fi
fi

if [[ -z "$TEAM" ]]; then
  echo "check-file-ownership: no Marathon-Team trailer and MARATHON_TEAM unset; skipping ownership check" >&2
  exit 0
fi

readarray -t STAGED < <(git diff --name-only --cached)
if [[ ${#STAGED[@]} -eq 0 ]]; then
  exit 0
fi

python3 - "$PRESET_FILE" "$TEAM" "${STAGED[@]}" <<'PY'
import sys, re, fnmatch, yaml, os

preset_path = sys.argv[1]
team = sys.argv[2]
staged = sys.argv[3:]

with open(preset_path) as f:
    text = f.read()

m = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
if not m:
    print("check-file-ownership: preset has no YAML front-matter", file=sys.stderr)
    sys.exit(2)

fm = yaml.safe_load(m.group(1))
ownership = fm.get("marathon", {}).get("file_ownership", {})
globs = ownership.get(team, [])
if not globs:
    print(f"check-file-ownership: no ownership entry for team {team}", file=sys.stderr)
    sys.exit(2)

def matches(path, glob):
    if glob.endswith("/**"):
        base = glob[:-3]
        return path == base or path.startswith(base + "/")
    return fnmatch.fnmatch(path, glob)

violations = []
for path in staged:
    if not any(matches(path, g) for g in globs):
        violations.append(path)

if violations:
    print(f"check-file-ownership: team {team} cannot modify these files:")
    for v in violations:
        print(f"  {v}")
    sys.exit(1)

print(f"check-file-ownership: team {team} OK ({len(staged)} files)")
PY
