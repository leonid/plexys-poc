Corteza observed run — captured outputs and next steps

Observed runtime (from user-provided logs):

- Corteza image: cortezaproject/corteza:2026.9.0-dev.1
- Postgres image: postgres:16-alpine
- Exposed ports: Corteza -> host 18080:80, Postgres -> host 5432:5432

Sample Corteza UI response (HTTP GET /):
- HTML page served (One UI), indicating Corteza front-end is reachable at http://localhost:18080/

Relevant log excerpts (user-provided):

- WARN: "You're using SQLite as a storage backend" — indicates test/demo storage mode
- WARN: "no SMTP servers found, email sending will be disabled"
- WARN: env variables APIGW_* synced to settings
- ERROR: "could not register default filter" (http.apigw) — may be benign for POC

Docker compose service state (user-provided):

NAME              IMAGE                                   STATUS
plexys-corteza    cortezaproject/corteza:2026.9.0-dev.1   Up 51 seconds (healthy)
plexys-postgres   postgres:16-alpine                      Up 51 seconds

Notes and immediate recommendations

1. Pin the working image
   - Replace :latest with cortezaproject/corteza:2026.9.0-dev.1 in docker-compose.yml for reproducibility.

2. Decide storage backend
   - Logs show SQLite is used (warning). For realistic behavior use Postgres. Verify Corteza is actually using the postgres service (check Corteza settings / environment variables). If SQLite is active, ensure environment variables point Corteza to Postgres and restart.

3. Admin user / first-run
   - Open http://localhost:18080/ in a browser
   - If prompted for first-run, create an admin user and record credentials.

4. Next action (module config)
   - Use the Corteza Compose UI to create Namespace: "Plexys Homework" and Module: "Support Ticket" with fields:
     - Subject: String, required
     - Description: String/Text, optional
     - Status: Select (New, In Progress, Resolved, Closed), required
     - Priority: Select (Low, Medium, High, Urgent), required
     - Due Date: Date/Time, optional

5. Document exact image tag, admin credentials (private), and where the module was created. Add to docs/corteza-setup.md.

6. If Compose UI creation is done, proceed to API discovery (current-user endpoint, module/records endpoints, record payload shape).

Files changed in repo:
- docs/corteza-setup.md (blocked note earlier)
- docs/corteza-observed.md (this file)

What I can do now

- Guide you step-by-step through the Compose UI to create the Namespace and Module.
- Or provide a scripted Compose JSON (Corteza Compose format) to import the module automatically if you prefer automation.

Choose how you'd like to proceed and paste any additional logs or confirmation when you create the module.