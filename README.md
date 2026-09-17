# Plexys Homework

A small POC for a support ticket manager built on top of Corteza with a custom Vue 3 frontend.

## Vision

This repository demonstrates a realistic enterprise-pattern project in miniature:

- Corteza acts as the backend/data layer
- Vue 3 provides the custom UI layer
- the frontend uses the signed-in Corteza user identity
- ticket records are exposed through a documented API contract
- the project stays small, clean, and explainable instead of turning into a production platform

## Architecture

```text
Browser
  ↓
Vue 3 app
  ↓
Corteza API client / auth session
  ↓
Corteza backend
  ↓
PostgreSQL
```

## Repo structure

```text
.
├── docs/
│   ├── plan.md
│   └── project-plan.md
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── ...
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
└── .idea/ (workspace metadata)
```

## Development phases

### Phase 1: platform setup
- Launch Corteza and Postgres via Docker
- Document the selected Corteza version and setup notes
- Configure the Plexys Homework namespace and Support Ticket module

### Phase 2: API discovery
- Validate auth flow and current user behavior
- Inspect module and record endpoints
- Confirm record payload shape and error behavior

### Phase 3: frontend shell
- Set up Vue 3 + Vite
- Define service/composable/type boundaries
- Scaffold minimal ticket screens

### Phase 4: CRUD and validation
- List/create/edit/delete support tickets
- Validate required fields and user feedback
- Handle failing API states

### Phase 5: documentation and QA
- Add a README and run instructions
- Produce the short PDF summary
- Record known limitations and next steps

## Quickstart

### Local backend

```bash
docker compose up -d
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- This is a POC and intentionally not a full enterprise stack.
- The API contract and auth flow must be validated before the UI is built around assumptions.
- The most important review signal is not “it looks good,” but “the architecture and failure paths are understood and documented.”
