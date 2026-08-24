#!/usr/bin/env bash
# Fetch compiled affiliate script from the running app and save to public/generated-scripts
# Usage:
#   ./scripts/fetch-affiliate-script.sh PROJECT_ID [BASE_URL] [OBF_LEVEL]
# Examples:
#   ./scripts/fetch-affiliate-script.sh aff_012345 http://localhost:3000 medium

set -euo pipefail

PROJECT_ID=${1:-}
if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID [BASE_URL] [OBF_LEVEL]"
  exit 2
fi

BASE_URL=${2:-http://localhost:3000}
OBF_LEVEL=${3:-medium}

OUT_DIR="public/generated-scripts"
mkdir -p "$OUT_DIR"

OUT_FILE="$OUT_DIR/script-$PROJECT_ID.js"

echo "Fetching compiled script for project: $PROJECT_ID"
echo "POST $BASE_URL/api/affiliate/compile -> $OUT_FILE"

HTTP_STATUS=$(curl -sS -w "%{http_code}" -o "$OUT_FILE" -X POST "$BASE_URL/api/affiliate/compile" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"obfuscationLevel\":\"$OBF_LEVEL\"}")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "Failed to fetch script — HTTP status $HTTP_STATUS"
  echo "Response saved to $OUT_FILE (may contain error JSON)"
  exit 1
fi

echo "Saved script to: $OUT_FILE"
echo "You can include it in your site as (example):"
echo "  <script type=\"module\" src=\"/generated-scripts/script-$PROJECT_ID.js\"></script>"

echo "Quick smoke test (in browser console after page load):"
echo "  typeof window.StealthV26 === 'object' && console.log('SDK loaded', window.StealthV26.getConfig())"

exit 0
