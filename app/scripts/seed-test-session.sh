#!/usr/bin/env bash
# Loads SUPABASE_* keys from app/.env, upserts a deterministic QA test user via the
# Supabase Admin API, then exchanges email+password for a real signed session JWT.
# Idempotent: 422 (user exists) is treated as success and the run proceeds to token exchange.
# Output: session JSON (access_token + refresh_token + expires_in) on stdout. Errors go to stderr.

set -euo pipefail

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_ANON_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not defined in .env or environment." >&2
    exit 1
  fi
done

echo "Target:       $SUPABASE_URL" >&2
echo "Service Key:  ************${SUPABASE_SERVICE_ROLE_KEY: -4}" >&2
echo "Anon Key:     ************${SUPABASE_ANON_KEY: -4}" >&2

TEST_EMAIL="qa-test@zipminator.dev"
TEST_PASS="QaZip!ManTest2026"
TMP_OUT=$(mktemp)
trap 'rm -f "$TMP_OUT"' EXIT

HTTP_STATUS=$(curl -s -o "$TMP_OUT" -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASS\", \"email_confirm\": true}")

if [[ "$HTTP_STATUS" -ne 201 && "$HTTP_STATUS" -ne 200 && "$HTTP_STATUS" -ne 422 ]]; then
  echo "Error creating/upserting user (HTTP $HTTP_STATUS):" >&2
  cat "$TMP_OUT" >&2
  exit 1
fi

HTTP_STATUS=$(curl -s -o "$TMP_OUT" -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASS\"}")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "Error authenticating user (HTTP $HTTP_STATUS):" >&2
  cat "$TMP_OUT" >&2
  exit 1
fi

jq -c . < "$TMP_OUT"
