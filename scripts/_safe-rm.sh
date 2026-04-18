#!/usr/bin/env bash
# Sandboxed rm helper sourced by marathon.sh.
# Refuses any path outside the marathon-owned area (.marathon/ subtree of the project).
# Does not exit on load; exposes functions for the marathon run to use.

__safe_rm_root() {
  local root
  root="${MARATHON_WORKDIR:-${REPO_ROOT:-}}"
  if [[ -z "$root" ]]; then
    root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  fi
  printf '%s' "$root"
}

safe_rm() {
  local root target real_root real_target
  root="$(__safe_rm_root)"
  real_root="$(cd "$root" 2>/dev/null && pwd -P)"
  if [[ -z "$real_root" ]]; then
    echo "safe_rm: cannot resolve sandbox root '$root'" >&2
    return 2
  fi
  for target in "$@"; do
    case "$target" in
      -*)
        echo "safe_rm: refusing flag-like arg '$target' (pass paths only)" >&2
        return 2
        ;;
      /|/*/|/root|/etc|/usr|/var|/bin|/sbin|/Users|/home)
        echo "safe_rm: refusing system path '$target'" >&2
        return 3
        ;;
    esac
    if [[ ! -e "$target" && ! -L "$target" ]]; then
      continue
    fi
    real_target="$(cd "$(dirname "$target")" 2>/dev/null && pwd -P)/$(basename "$target")"
    case "$real_target" in
      "$real_root"/.marathon/*)
        /bin/rm -rf -- "$real_target"
        ;;
      "$real_root"/_screenshots/*|"$real_root"/_tmp/*|"$real_root"/_archive/*)
        /bin/rm -rf -- "$real_target"
        ;;
      *)
        echo "safe_rm: refusing '$real_target' (outside $real_root/.marathon/ sandbox)" >&2
        return 4
        ;;
    esac
  done
}

safe_rm_dir_contents() {
  local dir
  dir="${1:-}"
  if [[ -z "$dir" || ! -d "$dir" ]]; then
    return 0
  fi
  local entry
  for entry in "$dir"/* "$dir"/.[!.]*; do
    [[ -e "$entry" || -L "$entry" ]] || continue
    safe_rm "$entry"
  done
}

export -f safe_rm safe_rm_dir_contents __safe_rm_root 2>/dev/null || true
