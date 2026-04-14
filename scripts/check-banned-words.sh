#!/usr/bin/env bash
set -euo pipefail

BANNED_WORDS=(
  "honest"
  "honestly"
  "to be honest"
  "I want to be transparent"
  "I appreciate"
  "Great question"
  "Absolutely"
  "Let me be clear"
  "robust"
  "leverage"
  "delve"
  "it's worth noting"
  "importantly"
  "game-changer"
  "paradigm shift"
  "cutting-edge"
)

BANNED_PUNCT_REGEX=$'\xe2\x80\x94'

SCAN_PATHS=("${@:-.}")
EXCLUDES=(
  ':(exclude)node_modules'
  ':(exclude).next'
  ':(exclude)target'
  ':(exclude)dist'
  ':(exclude)_archive'
  ':(exclude)_tmp'
  ':(exclude)scripts/check-banned-words.sh'
  ':(exclude)web/e2e/.auth'
  ':(exclude)*.lock'
  ':(exclude)pnpm-lock.yaml'
  ':(exclude)*.png'
  ':(exclude)*.jpg'
  ':(exclude)*.svg'
)

fail=0

for path in "${SCAN_PATHS[@]}"; do
  for word in "${BANNED_WORDS[@]}"; do
    hits=$(git --no-pager grep -n -i -F -- "$word" "$path" "${EXCLUDES[@]}" 2>/dev/null || true)
    if [[ -n "$hits" ]]; then
      echo "BANNED WORD: \"$word\""
      echo "$hits"
      echo
      fail=1
    fi
  done
  em_hits=$(git --no-pager grep -n -P -- "$BANNED_PUNCT_REGEX" "$path" "${EXCLUDES[@]}" 2>/dev/null || true)
  if [[ -n "$em_hits" ]]; then
    echo "BANNED PUNCTUATION: em dash (U+2014)"
    echo "$em_hits"
    echo
    fail=1
  fi
done

if [[ $fail -ne 0 ]]; then
  echo "check-banned-words: FAIL"
  exit 1
fi

echo "check-banned-words: OK"
