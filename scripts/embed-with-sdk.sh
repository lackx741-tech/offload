#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${1:-}
BASE_URL=${2:-http://localhost:3000}
OUT_DIR=${3:-dist}
OBF_LEVEL=${4:-medium}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID [BASE_URL] [OUT_DIR] [OBF_LEVEL]"
  exit 2
fi

mkdir -p "$OUT_DIR"

TMP_JS="/tmp/stealth-sdk-$PROJECT_ID.js"
OUT_HTML="$OUT_DIR/embed-$PROJECT_ID.html"

echo "Fetching compiled SDK..."
./scripts/fetch-affiliate-script.sh "$PROJECT_ID" "$BASE_URL" "$OBF_LEVEL"

SDK_PATH="public/generated-scripts/script-$PROJECT_ID.js"
if [ ! -f "$SDK_PATH" ]; then
  echo "Expected $SDK_PATH to exist (fetch failed?)"
  exit 1
fi

echo "Inlining SDK into template -> $OUT_HTML"
awk 'BEGIN{inside=0} /<!-- SDK_SCRIPT -->/{print "<script type=\"module\">"; while((getline l < "'"$SDK_PATH"'")>0) print l; print "</script>"; next} {print}' scripts/embed-template.html > "$OUT_HTML"

echo "Wrote $OUT_HTML"
echo "Open in browser to verify the SDK loads and status changes to 'SDK loaded'."

exit 0
