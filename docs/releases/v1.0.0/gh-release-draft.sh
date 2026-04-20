#!/usr/bin/env bash
# gh-release-draft.sh
# Recreate or refresh the Zipminator v1.0.0 GitHub draft release.
# Requires: gh CLI authenticated with repo scope on MoHoushmand/zipminator-pqc.

set -euo pipefail

REPO="${REPO:-MoHoushmand/zipminator-pqc}"
TAG="${TAG:-v1.0.0}"
TITLE="${TITLE:-Zipminator v1.0.0}"
NOTES="${NOTES:-docs/releases/v1.0.0/release-notes.md}"

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

if [[ ! -s "$NOTES" ]]; then
  echo "Missing release notes: $NOTES" >&2
  exit 1
fi

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Release $TAG already exists on $REPO. Updating notes."
  gh release edit "$TAG" --repo "$REPO" --notes-file "$NOTES" --title "$TITLE"
else
  echo "Creating draft release $TAG on $REPO."
  gh release create "$TAG" \
    --draft \
    --title "$TITLE" \
    --notes-file "$NOTES" \
    --repo "$REPO"
fi
