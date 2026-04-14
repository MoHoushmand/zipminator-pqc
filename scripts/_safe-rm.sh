#!/usr/bin/env bash
# shellcheck shell=bash

safe_rm() {
  local target="$1"
  local abs
  abs="$(cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target")"
  local repo_root
  repo_root="$(git -C "$(dirname "$abs")" rev-parse --show-toplevel 2>/dev/null || true)"

  if [[ -z "$repo_root" ]]; then
    echo "safe_rm: not inside a git repo, refusing to rm $target" >&2
    return 2
  fi

  local allow_archive="$repo_root/.marathon"
  local allow_screens="$repo_root/_screenshots"
  local allow_tmp="$repo_root/_tmp"

  case "$abs" in
    "$allow_archive"/*|"$allow_screens"/*|"$allow_tmp"/*)
      rm -rf -- "$abs"
      ;;
    *)
      echo "safe_rm: refusing $abs (outside .marathon, _screenshots, _tmp)" >&2
      return 3
      ;;
  esac
}

safe_rmdir_empty() {
  local target="$1"
  if [[ -d "$target" ]] && [[ -z "$(ls -A "$target" 2>/dev/null)" ]]; then
    rmdir "$target"
  fi
}
