# Plexys Support Ticket Manager POC — Architecture & Review Guide

This document presents the complete architectural rationale, technical design, user guide, administration instructions, and failure analysis for the Support Ticket Manager Proof of Concept (POC) built with **Vue 3** and **Corteza**.

---

## 1. Overview & Architecture

### High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 SPA (PrimeVue)                     │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ TicketTable.vue  │  │ TicketModal.vue│  │ App.vue     │  │
│  └────────┬─────────┘  └───────┬────────┘  └──────┬──────┘  │
│           └────────────────────┼──────────────────┘         │
│                                ↓                            │
│                      useTickets Composable                  │
│                                ↓                            │
│                      cortezaService (API)                   │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTP (CSRF / JWT Bearer)
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Corteza Low-Code Backend                    │
│  - Namespace: "Plexys Homework" (ID: 514163239221133313)    │
│  - Module: "Support Ticket" (ID: 514163239224016897)        │
│  - Auth & RBAC Engine (User Identity & Audit Trail)         │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL 15                           │
└─────────────────────────────────────────────────────────────┘
```

The system demonstrates a production-style pattern in miniature:
- **Corteza** manages the data model, storage, RBAC permissions, and audit logging.
- **Vue 3** provides a responsive user interface with validation, status badges, and failure recovery.
- **Identity preservation**: The application acts as the signed-in user so that record ownership (`ownedBy`), creation stamps (`createdAt`), and update logs (`updatedAt`) reflect the real user.

---

## 2. Technology Choices & Rationale

### Why Vue 3 + Composition API?
- **Separation of Concerns**: Business state (loading, error handling, record mutations) lives cleanly inside `useTickets.ts`, decoupling presentation components (`TicketTable.vue`, `TicketModal.vue`) from Corteza API details.
- **Type Safety**: Full TypeScript integration across models (`TicketRecord`, `TicketFormValues`) ensures compile-time validation.
- **Reactivity & Ergonomics**: Vue 3's reactive primitives allow immediate UI feedback while maintaining server truth as the primary state.

### Why PrimeVue + Aura Preset?
- **Rapid Delivery**: Provides robust enterprise components out-of-the-box: `DataTable`, `Dialog`, `InputText`, `Textarea`, `Select`, `Calendar`, and `ConfirmDialog`.
- **Built-in Accessibility & Responsive Behavior**: Meets standard ARIA conventions and mobile/desktop viewport requirements without writing a custom UI library from scratch.
- **Flexibility**: Clean theme customization via `@primevue/themes/aura`.

### Why this Corteza API Approach?
- **Dynamic Token Resolution**: Decoupled from hardcoded environment variables. The client dynamically searches:
  1. URL parameters/fragments (`?token=...`, `#token=...`, `#access_token=...` from OAuth2 redirects)
  2. Browser `sessionStorage` and `localStorage` (via the UI's interactive session dialog)
  3. Environment variables (`VITE_CORTEZA_JWT`) as a development fallback
- **Identity & RBAC Preservation**: When a Bearer JWT is attached, Corteza validates the token claims, identifies the `sub` (subject user ID), and preserves the genuine audit trail on every record mutation.
- **Endpoint Fallback Resilience**: Routes dynamically between canonical Corteza REST endpoints (`/api/compose/namespace/.../module/.../record/` and `/compose/namespace/.../module/.../record/`) to ensure stability across reverse proxies and development setups.
- **Data Normalization Layer**: Maps Corteza's internal record value structure (`[{ name, value }]`) into standard TypeScript interface fields (`subject`, `description`, `status`, `priority`, `dueDate`), isolating the UI from backend schema representation details.

---

## 3. Technical Decisions & Failure Path Tracing

### Core Architectural Decisions

1. **OAuth2 Bearer Tokens vs Session Cookies**:
   - *Design Choice*: Standalone custom frontends must use Bearer JWT authentication against Corteza REST endpoints (`/api/compose/...`).
   - *Rationale*: Corteza decouples its authentication provider (`/auth`) from its API resource servers (`/api`). While browser cookies authenticate the user on `/auth`, the resource API requires an explicit Bearer JWT token header for authorization and RBAC evaluation.
2. **Server as Single Source of Truth**:
   - The UI does not perform optimistic mutations. Records are refreshed or updated only after the backend confirms HTTP 200/201 success.
3. **Graceful Error Banners & Dynamic Auth Modal**:
   - API failures (unauthenticated session, network down, validation rejections) do not crash the view; meaningful error banners notify the user and offer a direct "Provide Auth Token" action.
4. **Strict Validation Before Dispatch**:
   - Mandatory fields (`subject`, `status`, `priority`) are verified clientside before sending API payloads, avoiding unnecessary roundtrips.
5. **Delete Safety**:
   - Irreversible actions require explicit user confirmation through `ConfirmDialog` before invoking the DELETE endpoint.

### Failure Path Tracing (Review Breakdown)

| Step | Failure Scenario | Observed vs Assumed Behavior | User Experience / UI Reaction |
| :--- | :--- | :--- | :--- |
| **API Request** | No Bearer JWT provided (session cookies only) | **Assumed**: Browser session cookies would authenticate `/api/compose` requests directly via `credentials: 'include'`.<br>**Observed**: Corteza redirects or returns HTML/401 because the REST API requires an OAuth2 Bearer token header. | Error banner displays clear warning and provides a **"Provide Auth Token"** button to connect dynamically. |
| **List Tickets** | Network error or expired auth token | **Observed**: Corteza returns HTTP 401 or network error. | Service catches failure, preserves table state, and renders an actionable error banner. |
| **Create Ticket** | Missing required `subject` | **Observed**: Frontend validation halts dispatch. | Subject input highlights with red border and message *"Subject is required"*; modal remains open. |
| **Create Ticket** | Backend DB failure (e.g. Postgres down) | **Observed**: 500 error returned by API. | Composable catches error, stores in `error.value`, displays banner, and preserves form values for user retry. |
| **Delete Ticket** | Permission denied on Corteza RBAC | **Observed**: 403 Forbidden. | Delete confirmation closes, error banner indicates deletion failure, and record remains intact. |

---

## 4. User Guide

### 1. View Support Tickets
- Navigate to the frontend application (`http://localhost:5173/`).
- The dashboard displays the total ticket count and count of open tickets (excluding *Resolved* and *Closed*).
- Tickets are displayed in a responsive data table showing **Subject**, **Status**, **Priority**, and **Due Date**.

### 2. Create a New Ticket
1. Click the **"New Ticket"** button in the top right.
2. Enter the **Subject** (required).
3. Provide an optional **Description**.
4. Select the **Status** (`New`, `In Progress`, `Resolved`, `Closed`).
5. Select the **Priority** (`Low`, `Medium`, `High`, `Urgent`).
6. Pick an optional **Due Date** using the calendar picker.
7. Click **"Save"**. The modal closes and the table updates with the newly created ticket.

### 3. Edit an Existing Ticket
1. Click the **"Edit"** button on any table row.
2. The modal opens pre-populated with existing values.
3. Make the necessary changes and click **"Save"**.

### 4. Delete a Ticket
1. Click the **"Delete"** button on the target ticket row.
2. A confirmation dialog appears: *"Are you sure you want to delete ticket '[Subject]'?"*.
3. Confirming removes the record from the backend and updates the list.

---

## 5. Admin & Setup Guide

### Environment & Version Specifications

- **Corteza Server**: `cortezaproject/corteza:2024.9` (pinned for stability and reproducibility)
- **Database**: `postgres:15`
- **Node.js**: `v18+` or `v20+`

### Local Setup Instructions

1. **Start Backend Infrastructure**:
   ```bash
   cp .env.example .env
   docker compose up -d
   ```
2. **Verify Containers**:
   ```bash
   docker compose ps
   ```
3. **Configure Corteza**:
   - Access `http://localhost:18080/`
   - Create the Admin user during first-run.
   - In Compose, verify or create the Namespace `Plexys Homework` and Module `Support Ticket` with fields:
     - `subject` (String, Required)
     - `description` (String, Optional)
     - `status` (Select: `New`, `In Progress`, `Resolved`, `Closed`, Required)
     - `priority` (Select: `Low`, `Medium`, `High`, `Urgent`, Required)
     - `due-date` (Date/Time, Optional)
4. **Launch Frontend Application**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Frontend Configuration (`frontend/.env`)
```ini
VITE_CORTEZA_API_URL=http://127.0.0.1:18080
VITE_CORTEZA_NAMESPACE_ID=514163239221133313
VITE_CORTEZA_MODULE_ID=514163239224016897
VITE_CORTEZA_JWT=<optional-jwt-for-development>
```

---

## 6. Known Limitations & Roadmap

### Current Scope (POC)
- [x] Full CRUD operations for Support Tickets.
- [x] **Customer Relation (Bonus Feature)**: Support Ticket references Customer module via Record link and interactive UI selection.
- [x] Dynamic Session and JWT-based OAuth Bearer authentication support.
- [x] Client-side form validation with visual feedback.
- [x] Clean architectural decoupling (View → Composable → Service → Corteza).
- [x] Delete confirmation and API failure handling.

### Future Roadmap / Next Steps
1. **Server-Side Pagination & Sorting**:
   - Wire Corteza's `limit`, `pageCursor`, and `sort` parameters to PrimeVue's lazy `DataTable` pagination.
2. **Full-Text Search & Multi-Field Filtering**:
   - Add status/priority/customer multi-select filters and real-time subject search.
3. **Optimistic Locking**:
   - Pass `updatedAt` / version hashes to prevent concurrent edit overwrites.
4. **Automated End-to-End Tests**:
   - Add Playwright / Vitest suite covering CRUD and failure recovery flows.
