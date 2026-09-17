#!/usr/bin/env bash
# Instructions and best-effort commands to import compose JSON into Corteza
# Usage: run locally from repo root
# 1) Ensure Corteza is running at http://localhost:18080
# 2) Open the Compose UI and use Import -> paste the JSON file docs/compose-import.json
#    OR follow the curl-based approach below if you prefer CLI.

set -euo pipefail
BASE=${1:-http://localhost:18080}
FILE=${2:-docs/compose-import.json}

cat <<'EOF'
INSTRUCTIONS - two options to import the compose JSON:

OPTION A (recommended - UI)
1. Open http://localhost:18080 in your browser and log in as admin.
2. Main menu -> Compose -> Import
3. Paste the contents of docs/compose-import.json and import.

OPTION B (CLI - best-effort)
# Note: CLI upload requires a valid session cookie or an API token. This example shows
# how to login via the web form, save cookies, and then POST a file to the compose import
# endpoint. The exact endpoint path may vary by Corteza version; adjust if necessary.

# 1) Fetch CSRF token and initial cookies (GET)
curl -c cookies.txt -sS "$BASE/" > /dev/null
# 2) Manually extract CSRF token from cookies or config.js
echo "Config:"
curl -sS "$BASE/config.js" || true

cat <<'CMD'

# 3) Login via web form (replace username/password as needed)
# Replace 'admin' and 'password' with real credentials or use the browser to login and export cookies.
#curl -b cookies.txt -c cookies.txt -X POST -d "username=admin&password=admin" "$BASE/auth/login"

# 4) POST import (best-guess endpoint)
#curl -b cookies.txt -F "file=@$FILE;type=application/json" -H "X-CSRF-Token: <csrf_token>" "$BASE/api/compose/import"
CMD

cat <<'EOF'

If the CLI path fails, use the UI method. After import, verify:
- Namespace "Plexys Homework" exists
- Module "Support Ticket" exists with fields
- Create a test record via UI and capture POST in DevTools

When you have the module ID or the sample POST/response, paste it here and I will wire the frontend and finish CRUD implementation.
EOF
