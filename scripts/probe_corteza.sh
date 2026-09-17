#!/usr/bin/env bash
# probe_corteza.sh — lightweight helper to capture runtime Corteza webapp config
# Usage: ./scripts/probe_corteza.sh [BASE_URL]
# Example: ./scripts/probe_corteza.sh http://localhost:18080

set -euo pipefail
BASE_URL=${1:-http://localhost:18080}

echo "Probing Corteza at $BASE_URL"

echo "\n1) Fetching webapp config (runtime)"
curl -sS "$BASE_URL/config.js" || { echo "Failed to fetch $BASE_URL/config.js"; exit 2; }

cat <<'EOF'

---
Next steps (manual):

2) Open Corteza in your browser and sign in as admin:
   $BASE_URL/

3) Use browser DevTools -> Network while creating a record in Compose:
   - Capture the POST request that creates a record.
   - Note request URL, request headers (cookies and X-CSRF-Token), and request body (field names).
   - Note response body (record ID, owner, createdAt fields).

4) CLI probe pattern (manual cookie reuse):
   After logging in via browser, export your session cookies to a file (or copy the cookie header value).

   Example (replace placeholders):

   # save cookie header obtained from browser (e.g., via DevTools -> Application -> Cookies)
   echo "CortezaSession=<your_cookie_value>; CortezaCSRF=<csrf_token>" > cookies.txt

   # Example curl to list records (replace <module-id> or adjust path based on captured network call)
   curl -b cookies.txt -H "X-CSRF-Token: <csrf_token>" "$BASE_URL/api/records?module=<module-id>"

Notes:
- Corteza typically uses cookie-based sessions and an X-CSRF-Token header when interacting from the SPA.
- The exact API paths depend on the module and Compose configuration; capture them from DevTools to avoid guessing.

If you want, run this script then paste the output of the POST request you captured (URL + headers + body + response) and I will update frontend/src/services/corteza.ts to match the observed contract.
