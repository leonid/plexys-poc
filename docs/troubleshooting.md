Corteza local troubleshooting checklist (common issues and fixes)

If http://localhost:18080 is not reachable or shows errors, run these checks locally and follow the remedies.

1) Check containers

  docker compose ps
  docker ps --filter name=plexys --no-trunc

- Expect: plexys-corteza (Up, healthy) and plexys-postgres (Up).
- If a container is not Up, inspect logs (see step 3).

2) Check webapp runtime config

  curl -sS http://localhost:18080/config.js

- Expect keys:
  window.CortezaAPI = '/api' (or full URL)
  window.CortezaAuth = 'http://localhost:18080/auth'
  window.CortezaWebapp = '/'

- If config.js shows http://localhost/auth without :18080, ensure the mounted override `corteza-config/config.js` exists and is mapped in docker-compose.yml.

3) Inspect logs

  docker logs plexys-corteza --tail 300
  docker logs plexys-postgres --tail 200

- Look for errors about DB connection, migrations, or webapp startup.
- Common findings:
  • Using SQLite warning → Corteza fell back to SQLite. Verify CORTEZA_DB_* environment variables in docker-compose.yml and that Postgres is reachable.
  • Auth redirect issues → confirm config.js and CORTEZA_HTTP_ADDR values.

4) Inspect container mounts and env

  docker inspect plexys-corteza --format '{{json .Mounts}}'
  docker inspect plexys-corteza --format '{{json .Config.Env}}'

- Ensure config.js override is mounted (check HostPath -> /corteza/webapp/config.js)
- Ensure CORTEZA_DB_HOST=postgres and CORTEZA_HTTP_ADDR=0.0.0.0:80 are present.

5) Quick restart to pick up config changes

  docker compose up -d plexys-corteza
  docker compose logs --follow plexys-corteza

6) Port conflict / firewall

- Confirm port 18080 not in use by other process:
  lsof -i :18080
- If blocked by firewall, allow connections or change mapping in docker-compose.yml.

7) If still failing

- Capture and paste: output of `docker compose ps`, `curl -I http://localhost:18080/`, and `docker logs plexys-corteza --tail 300`.
- If you prefer, run `scripts/import_compose_instructions.sh` to import the module once UI is reachable.

8) Temporary workaround summary

- If the webapp directs to the wrong auth host, mounting `corteza-config/config.js` (already prepared) fixes the client-side redirect for local runs.
- If Corteza uses SQLite (warning), fix DB env vars to point to the postgres service and restart.

If you paste the above command outputs I can diagnose the exact failure and provide a precise change (docker-compose edit or environment fix).