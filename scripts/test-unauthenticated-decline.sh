#!/usr/bin/env bash
# Gap closure: automates VERIFICATION.md item 3 (CR-03 fix)
# Verifies that POST /api/families/invitations with action=decline returns 401 when unauthenticated.
# This confirms the auth guard fires before any token lookup, preventing anonymous token-guessing attacks.

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "Testing: POST ${BASE_URL}/api/families/invitations with action=decline (unauthenticated)..."

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/api/families/invitations" \
  -H "Content-Type: application/json" \
  -d '{"action":"decline","token":"fake-token-for-auth-test"}')

if [ "$STATUS" = "401" ]; then
  echo -e "\033[32mPASS: returned 401 Unauthorized — CR-03 fix confirmed at runtime\033[0m"
  exit 0
else
  echo -e "\033[31mFAIL: expected 401, received ${STATUS}. CR-03 may not be working correctly.\033[0m"
  exit 1
fi

# Usage:
# Make sure the server is running with 'pnpm dev' then execute:
# bash scripts/test-unauthenticated-decline.sh
#
# Or with a custom URL:
# NEXT_PUBLIC_APP_URL=https://staging.example.com bash scripts/test-unauthenticated-decline.sh
