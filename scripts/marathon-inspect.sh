#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
ITER_DIR="$REPO_ROOT/.marathon"
TMP_DIR="$REPO_ROOT/_tmp"

usage() {
  cat <<EOF
marathon-inspect.sh
  <iter>              copy lean snapshot for iter to _tmp/inspect-iter-<iter>/; print MANIFEST head
  --rebuild <iter>    extract milestone docker-build.tar.gz to _tmp/; hint to start
  --diff <a> <b>      unified diff of two iterations' MANIFEST
  --worst             print the 3 lowest-composite iterations
EOF
}

find_iter_dir() {
  local iter="$1"
  local pad
  pad="$(printf '%04d' "$iter")"
  find "$ITER_DIR" -maxdepth 1 -type d -name "iter-${pad}-*" | head -1
}

cmd="${1:-}"
case "$cmd" in
  ""|-h|--help)
    usage
    exit 0
    ;;
  --worst)
    ITER_DIR="$ITER_DIR" python3 <<'PY'
import json, os, sys
d = os.environ["ITER_DIR"]
rows = []
for name in sorted(os.listdir(d)):
    p = os.path.join(d, name, "iteration.json")
    if not os.path.isfile(p):
        continue
    try:
        data = json.load(open(p))
    except Exception:
        continue
    rows.append((float(data.get("composite_score", 0)), name, data))
rows.sort()
for score, name, data in rows[:3]:
    lh = float(data.get("lighthouse_avg", 0))
    oa = float(data.get("oauth_pass_rate", 0))
    print(f"{score:.3f}  {name}  lighthouse={lh:.3f}  oauth={oa:.3f}")
PY
    ;;
  --diff)
    a="${2:?}"; b="${3:?}"
    dir_a=$(find_iter_dir "$a"); dir_b=$(find_iter_dir "$b")
    if [[ -z "$dir_a" || -z "$dir_b" ]]; then
      echo "marathon-inspect: iter $a or $b not found" >&2
      exit 2
    fi
    diff -u "$dir_a/MANIFEST.md" "$dir_b/MANIFEST.md" || true
    ;;
  --rebuild)
    iter="${2:?}"
    dir="$(find_iter_dir "$iter")"
    [[ -n "$dir" ]] || { echo "marathon-inspect: iter $iter not found" >&2; exit 2; }
    tar_file="$dir/docker-build.tar.gz"
    [[ -f "$tar_file" ]] || { echo "marathon-inspect: iter $iter is not a milestone" >&2; exit 2; }
    target="$TMP_DIR/inspect-iter-${iter}"
    mkdir -p "$target"
    tar -xzf "$tar_file" -C "$target"
    echo "marathon-inspect: extracted to $target"
    echo "  hint: cd $target && pnpm -C web start --port 3100"
    ;;
  *)
    iter="$cmd"
    dir="$(find_iter_dir "$iter")"
    [[ -n "$dir" ]] || { echo "marathon-inspect: iter $iter not found" >&2; exit 2; }
    target="$TMP_DIR/inspect-iter-${iter}"
    mkdir -p "$target"
    cp -R "$dir/." "$target/"
    echo "marathon-inspect: copied lean snapshot to $target"
    if [[ -f "$dir/MANIFEST.md" ]]; then
      echo "--- MANIFEST head ---"
      head -60 "$dir/MANIFEST.md"
    fi
    ;;
esac
