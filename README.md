# Sagarmala 2.0 Portal (MVP Portal)

The **Sagarmala 2.0 Portal** is a full-stack web application designed for the Ministry of Ports, Shipping and Waterways (MoPSW) and the Sagarmala Development Company Limited (SMFCL) to manage, appraise, approve, and execute port-led infrastructure projects across India.

This repository contains an **MVP, fully verified full-stack web application**: **FastAPI backend** (SQLModel + PostgreSQL) + **Vite / React / TypeScript / Tailwind CSS** frontend, preloaded with comprehensive database schemas, standard API envelopes, global error handling, RBAC permission authorization, feature modules, master seed datasets, and executive MIS dashboards.

**Current Status:** Both **Phase 1 (Appraisal & Sanction)** and **Phase 2 (Pre-Construction & Procurement)** are **100% complete, integrated, and live-verified end-to-end**.

---

## 1. Project Context and Vision

Sagarmala 2.0 is a flagship initiative of the Government of India under the **Viksit Bharat 2047** mission, focusing on port modernization, maritime industrialization, shipbuilding, coastal community development, multimodal connectivity, and sustainable maritime practices.

The portal covers the complete lifecycle of port-led infrastructure delivery:
* **Phase 1 (Appraisal & Sanction):** Proposal submission by Port Authorities, DPR technical & financial appraisal by SMFCL, Ministry final sanctioning, fund disbursement tracking, and full audit logging.
* **Phase 2 (Pre-Construction & Procurement):** Statutory clearances tracking, end-to-end tendering & bid evaluation, contractor registration & empanelment, contract execution, and work order management.

---

## 2. Core Workflows and State Machines

### 2.1 DPR Submission & Approval State Machine (Phase 1)
A Detailed Project Report (DPR) transitions through an 8-state audited lifecycle:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Port Authority creates DPR
    DRAFT --> SUBMITTED : Port Authority submits DPR
    DRAFT --> [*] : Soft Delete (DRAFT only)

    SUBMITTED --> SMFCL_REVIEW : SMFCL receives proposal

    SMFCL_REVIEW --> REJECTED_BY_SMFCL : SMFCL Rejects (with comments)
    REJECTED_BY_SMFCL --> SUBMITTED : Port Authority resubmits (version increments)

    SMFCL_REVIEW --> FORWARDED_TO_MINISTRY : SMFCL Recommends & forwards

    FORWARDED_TO_MINISTRY --> REJECTED_BY_MINISTRY : Ministry Rejects
    REJECTED_BY_MINISTRY --> SMFCL_REVIEW : SMFCL reviews / requests updates from Port

    FORWARDED_TO_MINISTRY --> APPROVED : Ministry grants final approval

    APPROVED --> FUNDS_RELEASED : SMFCL releases funds (sanction complete)
```

### 2.2 Tender & Bid Lifecycle State Machine (Phase 2)
Tenders follow a 14-stage sequential state machine with integrated bid submission and multi-factor evaluation:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Tender
    DRAFT --> INTERNAL_APPROVAL : Submit for Internal Review
    INTERNAL_APPROVAL --> PUBLISHED : Publish Tender
    PUBLISHED --> CORRIGENDUM : Issue Corrigendum (Optional)
    CORRIGENDUM --> BID_SUBMISSION : Resume Bidding
    PUBLISHED --> BID_SUBMISSION : Open Bidding Window
    BID_SUBMISSION --> BID_CLOSING : Bidding Deadline Reached
    BID_CLOSING --> TECHNICAL_EVALUATION : Evaluate Technical Bids
    TECHNICAL_EVALUATION --> FINANCIAL_EVALUATION : Rank Financial Bids (L1/L2/L3)
    FINANCIAL_EVALUATION --> FINAL_EVALUATION : Select Winning Bidder
    FINAL_EVALUATION --> APPROVAL : Tender Committee Sanction
    APPROVAL --> LOA_ISSUED : Issue Letter of Award (LOA)
    LOA_ISSUED --> CONTRACT_GENERATED : Draft Contract Package
    CONTRACT_GENERATED --> AWARDED : Final Award (links awarded_bid_id)
    AWARDED --> CLOSED : Tender Concluded
```

### 2.3 Contract & Work Order State Machine (Phase 2)
Contracts enforce the **D14 rule** (cannot be created against un-awarded tenders):
* **Contract Statuses:** `DRAFT` → `ISSUED` → `ACTIVE` → `CLOSED`
* **Work Order Statuses:** `DRAFT` → `ISSUED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`

### 2.4 Contractor Empanelment State Machine (Phase 2)
Contractors follow a strict 3-stage onboarding workflow:
* **Contractor Statuses:** `Registered` → `Verified` → `Empanelled`
* **Transition Rules:** Direct jumps (e.g. `Registered` → `Empanelled`) are blocked with `HTTP 400 INVALID_STATUS_TRANSITION`.

---

## 3. Technology Stack and Architecture

The application implements a clean, decoupled **Layered Architecture**:

```
┌────────────────────────────────────────────────────────┐
│  Presentation Layer (Frontend)                         │
│  React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons│
└────────────────────────────────────────────────────────┘
                           │
                           │ REST API (JSON / Standard Envelopes)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Application / Service Layer (Backend)                 │
│  FastAPI + Pydantic v2 + SQLModel + RBAC Dependencies  │
└────────────────────────────────────────────────────────┘
                           │
                           │ SQLAlchemy Engine / Alembic Migrations
                           ▼
┌────────────────────────────────────────────────────────┐
│  Data Layer (Persistence)                              │
│  PostgreSQL (Local / Docker)                           │
└────────────────────────────────────────────────────────┘
```

### Locked Architectural Decisions (`DECISION_RULES.md`)
* **D1. No Repository Layer:** `Route → Service → SQLModel Session`.
* **D2. Soft Delete:** Business records use `is_active: bool`. Audit logs are immutable and never deleted.
* **D3. Notifications Backend-Only:** `Notification` model + `create_notification()` + `GET /notifications`.
* **D5. Permission-Based RBAC:** Routes protected via `require_permission("PERMISSION_NAME")` evaluated dynamically against user roles.
* **D7. Standard API Contract Envelopes:** All responses wrapped in `data`, `meta`, and `error` structures.
* **D8. Single Linear Migration Chain:** Alembic migrations managed linearly ending in a single head (`f8d801247ecc`).
* **D11. Standardized Error Format:** `HTTPException` with `{"code", "message", "field"}` detail payload.
* **D12. Secure Read Schemas:** Endpoints return Pydantic `*Read` schemas, hiding internal models.
* **D14. Contract Creation Constraint:** Contracts can **ONLY** be created against tenders in `AWARDED` status.
* **D17. Parallel Phase 2 Progression:** Statutory clearances and tenders can be registered and progressed for a project regardless of its DPR status (matching real infrastructure practices where long-lead clearances run alongside DPR review).

---

## 4. Phase 1 & Phase 2 Modules — Status & Scope

All 10 feature modules + authentication and executive MIS dashboard are **100% complete and live-verified**:

| Module | Core Scope & Capabilities | Status |
| :--- | :--- | :---: |
| **1. Admin & Access Control (RBAC)** | JWT authentication, dynamic permission checks across defined roles and permissions, `/login` flow, `ProtectedRoute`. | **Complete — Verified** |
| **2. Project Configuration** | Project master registry, state/port mapping, funding model, estimated cost, lifecycle stage tracking. | **Complete — Verified** |
| **3. DPR Submission & Approval** | 8-state DPR lifecycle, version incrementing, SMFCL & Ministry review loops, `dpr_audit_log` trail with old/new status tracking. | **Complete — Verified** |
| **4. Task Management** | Project tasks, priority & status tracking, mandatory `evidence_url` verification rule prior to setting status to `DONE`. | **Complete — Verified** |
| **5. Stakeholders & Meetings** | Stakeholder directory, project meeting scheduling, participant mapping, meeting minutes. | **Complete — Verified** |
| **6. Statutory Clearances** | CRZ, EC, Forest, CTO, Land Acquisition & Utility Shifting clearance tracking, approval workflow, expiry monitoring summary (`/api/clearances/summary`). | **Complete — Verified** |
| **7. Tendering & Bid Management** | 14-stage tender workflow, bid submission engine, financial/technical evaluation & L1/L2/L3 ranking, tender award linking winning bid. | **Complete — Verified** |
| **8. Contractor Onboarding** | Contractor registration, GST/PAN/Reg verification, sequential status machine (`Registered` → `Verified` → `Empanelled`), document URL tracking. | **Complete — Verified** |
| **9. Contracts & Work Orders** | Awarded tender contract binding (D14 enforcement), contract lifecycle (`ACTIVE`/`ISSUED`), nested Work Orders with scope & milestone value tracking. | **Complete — Verified** |
| **10. Executive Dashboard / MIS** | Portfolio metrics, 8 live KPI cards (Phase 1 + Phase 2 Pre-Construction metrics), 1 Bar Chart (Projects by Stage), 1 Pie Chart (Task Breakdown). | **Complete — Verified** |

---

## 5. Comprehensive Integration & Regression Verification

The entire portal was validated using an end-to-end automated live verification suite executing real HTTP requests and PostgreSQL queries:

* **Part A (Phase 1 Regression):** Executed full 9-step DPR state machine (`Submit` → `SMFCL Reject` → `Resubmit` → `SMFCL Approve` → `Ministry Reject` → `SMFCL Requeue` → `SMFCL Re-approve` → `Ministry Approve` → `Release Funds`). Verified `dpr_audit_log` records all 12 transitions with populated `old_status` and `new_status` columns. Confirmed Task `DONE` status strictly rejects missing evidence URLs.
* **Part B (Phase 2 Workflow):** Verified Clearance approval, 14-stage Tender lifecycle, 3-bid evaluation & L1 award, D14 contract block (`TENDER_NOT_AWARDED` returned on un-awarded tenders), Contract activation, Work Order creation, and Contractor `Registered` → `Verified` → `Empanelled` sequential enforcement.
* **Part C (Phase Boundary Check):** Confirmed parallel Phase 2 activity is enabled per D17 (clearances and tenders can be registered on projects prior to final DPR sanction).
* **Part D (Housekeeping & Repo Integrity):** Confirmed Alembic single linear chain (`f8d801247ecc`), **0** committed cache/venv/env files in Git, and **0 errors** on `npm run build`.

---

## 6. Dashboard KPI Architecture

The Executive Dashboard (`frontend/src/pages/HomePage.tsx`) displays 8 live KPI cards organized into two executive domain sections:

### Phase 1 Portfolio Metrics
1. **Total Projects:** Count of all monitored port projects (`GET /projects`).
2. **Active Tasks:** Tasks in `TODO` or `IN_PROGRESS` status (`GET /tasks`).
3. **Completed Tasks:** Tasks marked as `DONE` with verified evidence (`GET /tasks`).

### Phase 2 Pre-Construction & Procurement Metrics
4. **Pending Clearances:** Count of clearances with status `PENDING` (`GET /api/clearances?status=PENDING`).
5. **Active Tenders:** Tenders in active workflow stages (excluding `AWARDED` and `CLOSED`) (`GET /tenders`).
6. **Contracts In Progress:** Contracts in `ACTIVE` or `ISSUED` status (`GET /contracts`).
7. **Empanelled Contractors:** Verified contractors in `Empanelled` status (`GET /api/contractors?status=Empanelled`).

Each card implements independent API fetching and per-card error state rendering without breaking layout or charts.

---

## 7. Quickstart and Installation

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL 14+ (running on port `5435` or default `5432`)

### Step 1: Database Setup
1. Create a PostgreSQL database named `sagarmala`.
2. Create a user named `sagarmala` with password `sagarmala`.

### Step 2: Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Set DATABASE_URL=postgresql://sagarmala:sagarmala@localhost:5435/sagarmala
alembic upgrade head      # Applies single linear migration chain up to head
python seed.py            # Idempotently seeds master dataset across all 11 sections
uvicorn app.main:app --reload --port 8000
```
* **Swagger API Documentation:** http://localhost:8000/docs
* **Health Check Endpoint:** http://localhost:8000/health → `{"status":"ok"}`

### Step 3: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
* **Vite Development Portal:** http://localhost:5173

---

## 8. Authentication & Pre-configured Login Accounts

All protected routes redirect to `/login` if unauthenticated. The RBAC system is preloaded via `bootstrap_rbac.py` and `seed.py` with pre-configured demo user accounts:

| Role | Default Email | Password | Key Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sagarmala.gov.in` | `admin123` | Full access across all Phase 1 & Phase 2 modules |
| **Port Authority** | `port1@sagarmala.gov.in` | `password123` | Create/submit Projects, Tasks, Stakeholders, DPRs, Clearances. Blocked from DPR approvals and contracting. |
| **SMFCL** | `smfcl1@sagarmala.gov.in` | `password123` | Review DPRs (approve/reject/forward), release funds, manage clearances & contracts. |
| **Ministry** | `ministry@sagarmala.gov.in` | `password123` | Final DPR sanction/rejection. Read-only on tendering & contractor onboarding. |
| **Tender Creator** | `tender_creator@sagarmala.gov.in` | `password123` | Draft and publish tenders, manage bid submissions. |
| **Bidder** | `bidder1@sagarmala.gov.in` | `password123` | Submit bids for published tenders. Blocked from contract management (403). |

---

## 9. Codebase Folder Layout

```
SagarMala/
├── backend/
│   ├── app/
│   │   ├── api/          # REST route handlers: auth, projects, dpr, tasks, stakeholders, clearance, tender, contract, contractor
│   │   ├── core/         # Security, JWT, RBAC permissions, configuration
│   │   ├── db/           # Database engine & session management
│   │   ├── models/       # SQLModel database tables (Project, DPR, Task, Clearance, Tender, Bid, Contract, WorkOrder, Contractor)
│   │   ├── schemas/      # Pydantic validation and *Read schemas
│   │   ├── services/     # Domain business logic & state machine handlers
│   │   └── main.py       # FastAPI application entrypoint & middleware
│   ├── alembic/          # Single linear migration chain (versions up to f8d801247ecc)
│   ├── bootstrap_rbac.py # Idempotent roles, permissions, and admin user bootstrap
│   ├── seed.py           # Master 11-section seed script for demo data across all modules
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/          # Axios API client functions (projects, tasks, dpr, tender, etc.)
    │   ├── components/   # ProtectedRoute guard, navigation, UI elements
    │   ├── features/     # Feature modules: clearance, contracts, contractors, tasks, stakeholders, meetings
    │   ├── layouts/      # AppLayout navigation shell
    │   ├── pages/        # Route pages: HomePage (Dashboard), ProjectsPage, DprsPage, TendersPage, StakeholdersPage, MeetingsPage
    │   ├── routes/       # React Router central routing configuration
    │   └── types/        # TypeScript interfaces matching backend schemas
    ├── package.json
    └── vite.config.ts
```

---

## 10. Technical Documentation References

* **Technical Decision Records:** `docs/DECISION_RULES.md`
* **Development & Agent Guidelines:** `DEVELOPMENT_RULES.md`
* **Phase 1 Architectural Spec:** `Sagarmala2_MVP_Project_Plan.md`
* **Phase 2 Module Handbooks:** `docs/team/`