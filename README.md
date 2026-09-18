# Plexys Support Ticket Manager POC

A minimal, production-pattern Proof of Concept (POC) demonstrating a custom **Vue 3** frontend running on top of a **Corteza** low-code backend.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 SPA (PrimeVue)                     │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ TicketTable.vue  │  │ TicketModal.vue│  │   App.vue   │  │
│  └────────┬─────────┘  └───────┬────────┘  └──────┬──────┘  │
│           └────────────────────┼──────────────────┘         │
│                                ↓                            │
│                  useTickets / useCustomers                 │
│                                ↓                            │
│                      cortezaService (API)                   │
└────────────────────────────────┬────────────────────────────┘
                                 │ HTTP (Bearer JWT / OAuth2)
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 Corteza Low-Code Backend                    │
│  - Namespace: "Plexys Homework"                             │
│  - Modules: "Support Ticket", "Customer" (Record Relation)  │
│  - RBAC & Audit Engine (Preserving Signed-in User Identity) │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL 15                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
.
├── docs/
│   ├── poc-architecture-and-review-guide.md   # Complete 6-section architecture & interview review guide
│   ├── corteza-setup.md                       # Platform run & setup documentation
│   ├── api-discovery.md                       # API discovery findings and auth behavior
│   ├── compose-import.json                    # Schema definitions for Support Ticket & Customer
│   └── ai/                                    # Original assignment requirements and task plan
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TicketTable.vue                # Responsive data table with badges & actions
│   │   │   └── TicketModal.vue                # Form dialog for Create/Edit with validation
│   │   ├── composables/
│   │   │   ├── useTickets.ts                  # Centralized ticket state & CRUD actions
│   │   │   └── useCustomers.ts                # Customer list & relationship lookup
│   │   ├── services/
│   │   │   └── corteza.ts                     # API client, dynamic auth & payload mapping
│   │   ├── types/
│   │   │   ├── ticket.ts                      # Strict TypeScript definitions for tickets
│   │   │   └── customer.ts                    # Customer model definitions
│   │   ├── App.vue                            # Orchestrator with metrics & session modal
│   │   └── main.ts                            # PrimeVue & theme configuration
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml                         # Corteza 2024.9 + PostgreSQL 15 stack
├── .env.example                               # Environment template for local runs
├── README.md
└── scripts/
    └── probe_corteza.sh                       # CLI endpoint probing utility
```

---

## 🚀 Quickstart

### 1. Start Corteza & Postgres

```bash
cp .env.example .env
docker compose up -d
```

Verify the stack is healthy:
```bash
docker compose ps
```

### 2. Configure Modules in Corteza UI
1. Navigate to `http://localhost:18080/` and complete initial admin setup.
2. In **Compose**, ensure the `Plexys Homework` namespace contains:
   - **Support Ticket** (`subject`, `description`, `status`, `priority`, `due-date`, `customer`)
   - **Customer** (`name`, `email`, `company`)
   *(You can import [docs/compose-import.json](docs/compose-import.json) or configure manually)*.

### 3. Launch Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit the application at **`http://localhost:5173/`**.

---

## 🔑 Authentication

- **Dynamic Token Resolution**: Supports URL parameters (`?token=...`, `#token=...`), browser `sessionStorage` / `localStorage`, or interactive session modal in the UI.
- **Audit Trail & RBAC**: Every mutation preserves real user identity extracted from token claims (`sub`), ensuring audit stamps (`createdBy`, `updatedAt`) and Corteza permissions function correctly.

---

## 📖 Comprehensive Review Guide

For a deep dive into technology rationale (*Why Vue 3? Why PrimeVue?*), failure path tracing (*Observed vs Assumed*), and future roadmap, read **[docs/poc-architecture-and-review-guide.md](docs/poc-architecture-and-review-guide.md)**.
