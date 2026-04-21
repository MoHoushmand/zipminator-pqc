#!/usr/bin/env bash
# verify_artifacts.sh
# Validates Zipminator v1.0.0 GTM release artifacts.
# Run from the repository root. Exits non-zero on any check failure.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

pass=0
fail=0
checks=()

check() {
  local label="$1"
  local ok="$2"
  if [[ "$ok" -eq 0 ]]; then
    checks+=("PASS  $label")
    pass=$((pass + 1))
  else
    checks+=("FAIL  $label")
    fail=$((fail + 1))
  fi
}

artifacts=(
  "CHANGELOG.md"
  "docs/releases/v1.0.0/release-notes.md"
  "marketing/blog/v1-release/post.mdx"
  "marketing/linkedin/v1-release/announcement.md"
)

# 1. Artifact existence and non-empty
for f in "${artifacts[@]}"; do
  if [[ -s "$f" ]]; then
    check "exists: $f" 0
  else
    check "exists: $f" 1
  fi
done

# 2. Banned words (global house style)
if grep -rniE 'honestly|game-changer|paradigm shift|cutting-edge|it.{1,2}s worth noting|\bleverage\b|\bdelve\b|\brobust\b' \
     "${artifacts[@]}" >/dev/null 2>&1; then
  check "no banned words" 1
  echo "Banned word hits:" >&2
  grep -rniE 'honestly|game-changer|paradigm shift|cutting-edge|it.{1,2}s worth noting|\bleverage\b|\bdelve\b|\brobust\b' "${artifacts[@]}" >&2 || true
else
  check "no banned words" 0
fi

# 3. Em dashes forbidden in all GTM artifacts
em_dash=$'\xe2\x80\x94'
if grep -rn "$em_dash" "${artifacts[@]}" >/dev/null 2>&1; then
  check "no em dashes" 1
  grep -rn "$em_dash" "${artifacts[@]}" >&2 || true
else
  check "no em dashes" 0
fi

# 4. FIPS 140-3 affirmative claims forbidden. Negative ("NOT FIPS 140-3 certified")
#    disclaimers are permitted; match only positive claim patterns.
if grep -rniE '(^|[^t])is FIPS 140-3 (certified|validated|compliant)|\bFIPS 140-3 compliant\b|\bare FIPS 140-3\b' \
     "${artifacts[@]}" >/dev/null 2>&1; then
  check "no affirmative FIPS 140-3 claims" 1
  grep -rniE '(^|[^t])is FIPS 140-3 (certified|validated|compliant)|\bFIPS 140-3 compliant\b|\bare FIPS 140-3\b' "${artifacts[@]}" >&2 || true
else
  check "no affirmative FIPS 140-3 claims" 0
fi

# 5. Required NIST FIPS language present in blog + release notes + CHANGELOG
for f in marketing/blog/v1-release/post.mdx docs/releases/v1.0.0/release-notes.md CHANGELOG.md; do
  if grep -q "FIPS 203" "$f"; then
    check "FIPS 203 mentioned in $f" 0
  else
    check "FIPS 203 mentioned in $f" 1
  fi
done

# 6. DORA Art. 6.4 / Art. 7 citation in blog (quantum-readiness clause)
if grep -qE "Article 6\.4|Art\. 6\.4" marketing/blog/v1-release/post.mdx \
     && grep -qE "Article 7|Art\. 7" marketing/blog/v1-release/post.mdx; then
  check "DORA Art. 6.4 and Art. 7 cited in blog" 0
else
  check "DORA Art. 6.4 and Art. 7 cited in blog" 1
fi

# 7. Word-count gates
count_words() {
  local f="$1"
  awk 'BEGIN{c=0} {c+=NF} END{print c}' "$f"
}

blog_words=$(count_words marketing/blog/v1-release/post.mdx)
li_words=$(count_words marketing/linkedin/v1-release/announcement.md)

if (( blog_words >= 1200 && blog_words <= 1800 )); then
  check "blog word count 1200-1800 (got $blog_words)" 0
else
  check "blog word count 1200-1800 (got $blog_words)" 1
fi

if (( li_words >= 400 && li_words <= 600 )); then
  check "linkedin word count 400-600 (got $li_words)" 0
else
  check "linkedin word count 400-600 (got $li_words)" 1
fi

# 8. Remote URL hygiene: references to stale org must not exist.
if grep -rn "github.com/QDaria/zipminator" "${artifacts[@]}" >/dev/null 2>&1; then
  check "no stale github.com/QDaria/zipminator URLs" 1
  grep -rn "github.com/QDaria/zipminator" "${artifacts[@]}" >&2 || true
else
  check "no stale github.com/QDaria/zipminator URLs" 0
fi

# 9. CHANGELOG compare URLs resolve to the current remote.
if grep -q "MoHoushmand/zipminator-pqc/compare/v0.5.0...v1.0.0" CHANGELOG.md; then
  check "CHANGELOG v1.0.0 compare URL correct" 0
else
  check "CHANGELOG v1.0.0 compare URL correct" 1
fi

# Report
printf '\n%s\n' "=== verify_artifacts.sh report ==="
for line in "${checks[@]}"; do
  printf '%s\n' "$line"
done
printf '\npass=%d fail=%d\n' "$pass" "$fail"

exit "$fail"
