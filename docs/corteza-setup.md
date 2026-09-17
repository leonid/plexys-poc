Corteza local setup — observed constraints and run instructions

Status: blocked in this environment (docker CLI not available)

Observed during automated attempt:
- The project contains docker-compose.yml configured with cortezaproject/corteza:latest and Postgres.
- The runtime where the automation runs does not have Docker installed (docker: command not found), so the stack could not be started here.

What to do locally (developer steps):

1. Install Docker Desktop (macOS/Windows) or Docker Engine (Linux).
   - macOS: https://docs.docker.com/desktop/
   - Linux: https://docs.docker.com/engine/install/

2. From the repo root run:

   cp .env.example .env
   docker compose up -d

3. Verify containers are running:

   docker compose ps
   docker logs plexys-corteza --follow

4. Access the Corteza UI in your browser at:

   http://localhost:18080/

5. First-run setup and admin user:

   - On first web access, follow Corteza's web installer/first-run steps. Create an admin user and note credentials.
   - If the container prints initialization notes to the logs, follow those.

6. Pin the working Corteza image tag:

   - After verifying a working image (check docker images or logs for the exact tag), update docker-compose.yml to use a fixed tag instead of :latest for reproducible runs.

7. Configure the Plexys Homework namespace and Support Ticket module using the Corteza Compose UI (per project plan).

8. Once Corteza runs locally, record in docs:

   - exact Corteza image tag used
   - any environment variables required
   - admin username/email created
   - notes about where the module was created (namespace/module names)

Notes and alternatives

- If you cannot run Docker locally, provide a reachable Corteza instance URL and admin/test credentials so the frontend can be integrated against a live backend remotely.
- Alternatively, continue API discovery using public Corteza docs and a combination of small scripts; however, some behaviors (session cookies, CSRF, record format) are best validated against a real instance.

Next steps for this repo

- Once Docker is available, start the stack and follow the plan to create the namespace and module via the UI.
- If the user prefers, I can attempt API discovery now by reading Corteza documentation and sample API usage (no live instance).

Temporary fix applied in repo (local override)

- A local override file `corteza-config/config.js` was added and the docker-compose.yml was updated to mount it into the Corteza container at `/corteza/webapp/config.js`.
- The override sets CortezaAuth to use the correct public port so the webapp redirects to `http://localhost:18080/auth` instead of `http://localhost/auth`.

To apply the change locally:

1. Pull the latest repo changes (if you updated remotely):
   git pull

2. Restart the Corteza container to pick up the mounted override:
   docker compose up -d plexys-corteza

3. Check logs to confirm webapp config is loaded and that the auth redirect includes :18080:
   docker logs plexys-corteza --tail 200

If you'd rather change Corteza configuration via environment variables, we can update docker-compose to use the canonical environment keys instead of a mounted override—tell me and I will prepare a conservative environment-based change.
