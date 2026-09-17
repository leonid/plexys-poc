# Plexys Homework — concrete implementation plan

## 1. Objective

Build a minimal support ticket manager that proves a clean Corteza + Vue 3 architecture in a local-first POC setup. The app must behave as the signed-in user and operate against real Corteza records, not mock data or fake identities.

## 2. Mission and review criteria

The task is not judged primarily on visual polish. It is judged on:

1. Ability to learn a new backend quickly
2. Ability to identify the correct client/API approach
3. Ability to build a clean Vue 3 app
4. Ability to think architecturally instead of only making features work
5. Ability to explain decisions and distinguish observed facts from assumptions

## 3. Product vision

A small support ticket system for a team that needs to create, edit, view, and delete tickets. Each ticket has:

- Subject
- Description
- Status
- Priority
- Due date

The platform backing the app is Corteza, configured through the UI rather than backend code generation. The custom frontend is a small Vue application with disciplined separation of concerns.

## 4. Project scope

In scope:

- Docker-based Corteza setup
- Namespace and module configuration in Corteza
- Auth/session investigation
- Record API discovery
- Vue 3 frontend shell and services
- Ticket CRUD flows
- Basic validation and error states
- Local run instructions and project docs

Out of scope for this POC:

- full RBAC/permissions matrix
- production deployment pipeline
- pagination/search/sorting with large data sets
- customer module unless explicitly added as a bonus phase
- heavy design system and unnecessary abstraction

## 5. Concrete tasks and milestones

### Phase 1 — environment and backend setup

Tasks:

- Select a Corteza version and document the reasoning
- Start Postgres and Corteza with Docker
- Complete first-run admin setup
- Create namespace: Plexys Homework
- Create module: Support Ticket
- Define required fields and option sets

Acceptance criteria:

- Corteza is running locally
- Admin can log in
- Support Ticket module exists in the namespace
- Fields and select values match the task brief

### Phase 2 — API contract discovery

Tasks:

- Validate browser-based auth flow into Corteza
- Identify current-user endpoint
- Identify module and record API endpoints
- Confirm create/list/update/delete methods and payloads
- Inspect response contract for record ID, owner, dates, field values, and errors

Acceptance criteria:

- The frontend is not written against guessed API contracts
- A clear auth flow is documented
- CRUD operations are validated against real Corteza responses
- Error handling is based on observed API behavior

### Phase 3 — frontend shell and boundary design

Proposed structure:

```text
frontend/
├── src/
│   ├── components/
│   │   ├── TicketTable.vue
│   │   ├── TicketModal.vue
│   │   ├── TicketForm.vue
│   │   └── ConfirmDialog.vue
│   ├── composables/
│   │   └── useTickets.ts
│   ├── services/
│   │   └── corteza.ts
│   ├── types/
│   │   └── ticket.ts
│   ├── App.vue
│   ├── main.ts
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── ...
```

Tasks:

- Initialize Vue 3 + Vite project
- Add minimal dependencies (Vue 3, PrimeVue, etc.)
- Create type definitions for supported ticket statuses and priorities
- Create a dedicated Corteza service module
- Create a composable that owns ticket state and CRUD actions

Acceptance criteria:

- UI components are thin and side-effect focused
- API-specific logic is not embedded in views
- App state management is centralized in a single reusable composable

### Phase 4 — CRUD implementation

Tasks:

- List tickets from Corteza
- Create a new ticket
- Edit existing ticket
- Delete a ticket with confirmation
- Validate required fields before submit
- Handle loading and error states

Acceptance criteria:

- All CRUD operations work against live backend data
- Required fields are blocked by validation
- Delete flows confirm before mutation
- Error paths show meaningful messages to the user

### Phase 5 — QA and documentation

Tasks:

- Add run instructions and environment examples
- Capture screenshots for key flows
- Write architecture notes and “why this approach” rationale
- Document limitations and next steps
- Draft the short PDF summary (max 5–6 pages)

Acceptance criteria:

- The repo can be run locally by another developer with minimal setup
- The PDF summary explains the architectural decisions, not just feature lists
- Known limitations are clearly called out

## 6. Decision principles

### Keep the backend small and real

Do not invent a fake persistence layer. Configure the real backend and work against it.

### Prefer first-party patterns

Before writing a custom wrapper, verify the official Corteza client/API path and adapt to it.

### Keep UI logic clean

Use a composable to isolate business operations from presentation. Components should render state and call actions, not own backend logic.

### Favor deliberate simplicity

This is a POC. The target is a functional, explainable solution, not a sprawling enterprise platform.

## 7. Weak points to watch

- API assumption drift: the biggest risk in the project
- Incorrect user identity handling: must use the signed-in Corteza user
- Over-engineered frontend: avoid extra state libs, routers, or custom UI kits
- Missing docs: a working app without explanation is not enough
- Bonus feature distraction: customer module is optional, not required for the core submission

## 8. Definition of done

The project is ready when:

- Corteza is configured and running locally
- The ticket module exists and functions in real data storage
- Vue 3 app loads and interacts with the live API
- CRUD, validation, and failure handling all work
- README and documentation explain setup and architecture
- The project is clean enough to explain to a reviewer in one pass
