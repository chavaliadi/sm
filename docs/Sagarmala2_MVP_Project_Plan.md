# Sagarmala 2.0 Portal — MVP Project Plan

**Team:** 1 Senior Dev (Lead) + 4 Junior Devs (transitioning beginner → intermediate)
**Timeline:** 15–20 days
**Goal:** A working, demo-ready prototype of the core approval workflow, built with enough polish to convince the client to continue the engagement.

---

## 1. Project Context

The Government of India's Sagarmala Programme is being expanded under **Sagarmala 2.0**, part of the Viksit Bharat 2047 mission — covering port modernization, shipbuilding, coastal development, and connectivity. The full RFP describes a large, multi-year system (26+ modules, mobile apps, satellite/drone integration, PFMS integration) built by a full vendor team over 6+ months.

**We are not building that.** We are building a focused, working slice of it — the core approval loop — in 15–20 days, to prove the idea works and win the right to continue.

Three parties exist in every project's lifecycle:

- **Port Authority** — proposes projects, submits the DPR (Detailed Project Report)
- **SMFCL** — reviews submissions, recommends or rejects, releases funds
- **Ministry / Apex Committee** — gives final approval on major decisions

A project moves through four phases in the real RFP (Appraisal & Sanction → Pre-construction → Construction → Post-construction). **Our MVP covers Phase 1 only** — Appraisal & Sanction — because it contains the entire core approval process and is the most demo-able slice.

---

## 2. Guiding Engineering Principles

These aren't decoration — they directly shape module boundaries and how the team splits work.

### KISS (Keep It Simple, Stupid)
- One status enum drives the entire DPR workflow — no separate tables for "pending," "rejected," etc. State lives in one column.
- No premature abstraction: don't build a generic "workflow engine" — build the one workflow the RFP actually asks for.
- Local dev only (native install or Docker, whichever is lighter per machine) — no cloud, no DevOps, no CI/CD pipeline. That's future work.
- Every module is a vertical slice (own pages + routes + tables), not split by layer. This avoids the classic beginner-team failure mode of five people fighting over the same files.

### DRY (Don't Repeat Yourself)
- Auth/permission checking lives in **one place** (RBAC middleware) — every other module imports it, no module reimplements "is this user allowed to do X."
- Shared UI primitives (buttons, form inputs, upload fields, status badges) built once in a shared component folder — modules consume them, don't rebuild them.
- One audit-log utility function (`log_action(user, action, entity)`), called from every module that needs one — not five different logging implementations.

### SOLID (applied practically, not academically)
- **S**ingle Responsibility — each module owns exactly one concern (Task Management doesn't know about DPR approval logic, and vice versa).
- **O**pen/Closed — the DPR status enum and RBAC roles are designed to have new values *added* later (e.g. more roles, more approval stages) without rewriting the core logic.
- **L**iskov / **I**nterface Segregation — kept lightweight here since we're not building deep class hierarchies; mainly expressed as: every module exposes a clean, small set of API routes that other modules call through, never reaching into another module's database tables directly.
- **D**ependency Inversion — modules depend on the RBAC middleware's *interface* (`get_current_user`, `require_permission()`), not on its internal implementation. If RBAC internals change, no other module's code has to. Same logic applies to the backend's own internal layering — see Section 3.

---

## 3. Architecture

Standard layered web application — nothing exotic. The complexity is in correctly modeling the approval states, not the technology.

```
┌─────────────────────────────────────────────┐
│  Presentation Layer                          │
│  React (Vite) + Tailwind CSS + shadcn/ui     │
│  React Router for navigation                 │
└─────────────────────────────────────────────┘
                    │  REST (JSON)
┌─────────────────────────────────────────────┐
│  Application / Business Logic Layer          │
│  FastAPI routes + services                   │
│  Pydantic validation, Swagger docs free      │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│  Data Layer                                  │
│  PostgreSQL + SQLModel/SQLAlchemy + Alembic  │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│  Security Layer (wraps everything above)     │
│  JWT auth + role-based middleware + audit log│
└─────────────────────────────────────────────┘
```

### Tech stack rationale

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind + shadcn/ui | Fast builds, professional look with minimal effort — clients judge a demo heavily on polish |
| Routing | React Router | Plain React has no built-in routing (not using Next.js) |
| Backend | FastAPI (Python) | Free Swagger docs, fast Pydantic validation, team is learning it together |
| ORM | SQLModel / SQLAlchemy | Type-safe, pairs naturally with FastAPI/Pydantic |
| Migrations | Alembic | Version-controlled schema changes — see Section 9 for the merge-safety rule |
| Database | PostgreSQL (local) | Matches what the real RFP mandates |
| Auth | JWT + role-based middleware | Simple, well-understood RBAC implementation |
| Local Dev | Native install or Docker Compose, team's choice per machine | No deployment this phase — zero DevOps overhead |

### Backend layered structure (frozen before anyone starts)

A plain "route talks straight to the database" pattern is fine for a solo script, but with 4 juniors touching the backend it means business logic ends up copy-pasted inside route handlers, and every module reinvents its own query style. A full Repository layer on top of that would be the textbook-correct next step, but for 5 devs in a 20-day window it's mostly CRUD boilerplate (`create()`, `update()`, `delete()`, `find()`, `find_by_id()` repeated per module) for a benefit — swappable data sources — nobody needs this month. So the shape is two layers, not three:

```
api/            → FastAPI route handlers (thin — just request/response)
services/       → business logic + all DB queries for that module's tables
                   (the DPR state machine lives here)
models/         → SQLModel table definitions
schemas/        → Pydantic request/response schemas
```

Route → Service → SQLModel Session, always in that order, no skipping layers. The service is still the *only* place that talks to the database and the *only* place that knows business rules — that's what makes the SOLID "Dependency Inversion" point in Section 2 real. If a genuine need for swappable data access shows up later (e.g. a second data source), a Repository layer slots in under `services/` without anyone's route code changing.

---

## 4. MVP Scope — What We're Building

The full RFP lists 26 "expected modules." We are building **6**, chosen because together they demonstrate the entire core value proposition end-to-end: *a project gets proposed, reviewed, approved, and funded — with a full audit trail — and a dashboard shows it all.*

| # | Module | What it does | Priority |
|---|---|---|---|
| 1 | **Admin & Access Control (RBAC)** | Login, roles (Port Authority / SMFCL / Ministry / Admin), permissions, audit log of who did what and when. Everything else depends on this. | HIGH |
| 2 | **Project Configuration & Lifecycle** | Create a project record, set category/stakeholders/funding info, track lifecycle stage. | HIGH |
| 3 | **DPR Submission & Approval Workflow** | The headline feature: Port Authority submits DPR → SMFCL reviews (approve/reject) → Ministry reviews (approve/reject) → funds released. Every step logged. | HIGH |
| 4 | **Task Management** | Create, assign, track tasks tied to a project — due dates, priority, status, assignee. | MEDIUM |
| 5 | **Stakeholder & Meeting Management** | Directory of people/orgs involved in a project, plus simple meeting notes (title, date, notes). Action items are just Tasks — no separate action-item tracking, keeps the data model DRY. | MEDIUM |
| 6 | **Dashboard / MIS** | Summary view pulling from every other module — project counts by stage, pending approvals, task completion. Scaffolded early with mock data (see Section 9), wired to real data incrementally. | MEDIUM |

**Explicitly out of scope this phase** (documented as future work, not a shortcut):

- Pre-Investment Appraisal & Feasibility, Tendering & Bid Evaluation, Risk Monitoring
- Fund Release as its own system (folded into DPR's final step as a simple field, not a module)
- PFMS Integration, Grievance Management, Project Closure, PMC/EPC Performance
- Satellite Imagery, Drone Media Management, Mobile Apps (Android/iOS)
- AI-Powered Knowledge Assistant Chatbot (only attempted if someone is genuinely free at the very end — never planned around)
- Cloud deployment, DR, high-availability setup
- Phases 2–4 of the project lifecycle (pre-construction, construction, post-construction)

Attempting to half-build integrations we don't have real access to (PFMS APIs, satellite feeds, drone hardware) would waste time and look incomplete — a small set of modules that work convincingly end-to-end is a stronger demo than a large set that half-work.

---

## 5. DPR Approval State Machine

This is the one module where ambiguity costs the most time, so it's specified up front rather than designed on the fly:

```
DRAFT
  → SUBMITTED
      → SMFCL_REVIEW
          → REJECTED_BY_SMFCL  ──(back to Port Authority, resubmit)──→ SUBMITTED
          → FORWARDED_TO_MINISTRY
              → REJECTED_BY_MINISTRY ──(back to SMFCL)──→ SMFCL_REVIEW
              → APPROVED
                  → FUNDS_RELEASED
```

Every transition logs: **actor, timestamp, comment/observation**. One `dpr_status` enum column + one `dpr_audit_log` table satisfies the RFP's entire "multi-level routing with audit trail" requirement — no need for anything more elaborate.

---

## 6. Core Data Model

Only the entities the MVP actually needs — resist the urge to model fields for out-of-scope modules. Two categories of field are worth adding now even though nothing "uses" them on day 1: government-project fields that will obviously be asked for the moment a client looks closely (`project_code`, `estimated_cost`, `approved_cost`, `port_name`), and cross-cutting infrastructure (`notifications`, richer `audit_log`) the RFP repeatedly references. Both are cheap to add now and expensive to retrofit once other modules have foreign keys pointing at these tables.

```
users            (id, name, email, password_hash, role, created_at)
roles            (id, name)  -- Port Authority / SMFCL / Ministry / Admin
permissions      (id, name)  -- VIEW_PROJECT, EDIT_PROJECT, APPROVE_DPR,
                                CREATE_TASK, VIEW_DASHBOARD, ...
role_permissions (role_id, permission_id)  -- many-to-many

projects         (id, project_code, name, category, state,
                   port_name, stakeholder_info, funding_model,
                   estimated_cost, approved_cost, lifecycle_stage,
                   is_active, created_by, updated_by,
                   created_at, updated_at)

dpr              (id, project_id, version, status, submitted_by,
                   current_stage, created_at, updated_at)
dpr_audit_log    (id, dpr_id, actor_id, action, comment, timestamp)

tasks            (id, project_id, title, description, priority, status,
                   assigned_to, due_date, created_at)
stakeholders     (id, project_id, name, organization, role, contact_info)
meetings         (id, project_id, title, date, notes)

notifications    (id, user_id, title, message, read, created_at)

audit_log        (id, user_id, action, entity_type, entity_id,
                   old_value, new_value, ip_address, user_agent,
                   performed_by, timestamp)
```

Notes on the additions:

- **`permissions` / `role_permissions`** replace scattered `if role == "ADMIN"` checks with a single lookup (`require_permission("APPROVE_DPR")`). Internally it's still "role has permissions," so RBAC stays simple to build — it's just not hardcoded to specific role names inside every route.
- **`notifications`** — backend only for the MVP: table, a `create_notification(user_id, title, message)` service function, and a `GET /notifications` endpoint. No notification bell/inbox UI this phase — building the plumbing now means the UI is a pure frontend task later, not a schema change.
- **`audit_log`** now captures what actually changed (`old_value`/`new_value`), not just that something happened — this is the difference between "a log" and "an audit trail," and government reviewers specifically look for the latter.
- **`is_active`** replaces a `deleted_at` timestamp — a plain boolean is enough for an MVP; every list query just filters `WHERE is_active = true`, no extra "soft delete" filtering logic to get wrong under deadline pressure.
- **`meetings`** dropped a separate `action_items` field — action items are just Tasks (Section 4, module 4) linked to the same project. One task model instead of two overlapping ones.

Each module owns its own tables exclusively — no module edits another module's table directly. Cross-module reads (e.g. the Dashboard) go through each module's own API, never straight into another module's DB table.

---

## 7. API Contract Freeze (agree before anyone writes a route)

The single biggest source of integration pain on a multi-junior team isn't bad code — it's four people independently inventing four different shapes for "list of things" or "here's an error." Freeze these before Day 4 (when module building starts), the same way RBAC gets frozen:

**Standard REST shape, every module follows it:**
```
POST   /{module}          create
GET    /{module}          list (paginated)
GET    /{module}/{id}     retrieve one
PUT    /{module}/{id}     update
DELETE /{module}/{id}     soft delete (sets is_active = false, doesn't remove the row)
```

**Standard success response:**
```json
{ "data": { ... }, "meta": { } }
```

**Standard paginated list response:**
```json
{ "data": [ ... ], "meta": { "page": 1, "page_size": 20, "total": 137 } }
```

**Standard error response:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }
```

Also freeze on Day 1–4, alongside RBAC: the `users`, `projects`, `dpr`, `tasks`, and `meetings` models (field names and types), and the status enums (`dpr_status`, `project.lifecycle_stage`, `task.status`). Once frozen, changing them requires a conversation with you first, not a silent edit inside someone's branch — this is what stops four people from quietly inventing four incompatible versions of "what a project looks like."

---

## 8. Team & Module Assignment

You are actively coding this time (not purely reviewing), which changes the split from a "senior manages, juniors build" model to a proper 5-person team. One structural change from earlier drafts: **you are no longer carrying architecture + 2 modules + all of git/reviews/mentoring alone** — that's closer to three roles than one, and it makes you the bottleneck. One junior is named **Integration Owner** in addition to their module.

| Module | Owner | Notes |
|---|---|---|
| Admin & Access Control (RBAC) | **You (Senior)** | Build first, freeze early. No one else touches auth logic once frozen. |
| Project Configuration & Lifecycle | Junior 1 | Spine of the app — schema needs to be right early since other modules attach to "project." |
| DPR Submission & Approval Workflow | Junior 2 | Headline feature — hand them the state machine in Section 5 directly, don't let them design it from scratch. |
| Task Management | Junior 3 | Fully independent tables/routes — safe to build fully in parallel, low conflict risk. |
| Stakeholder & Meeting Management + **Integration Owner** | Junior 4 (most confident of the four) | Simple CRUD module, plus: **owns** the seed script/demo data (Section 13), shared frontend component library (Section 12), smoke-testing checklist, and resolving simple merge conflicts — so none of that lands on you. |
| Dashboard / MIS | **You (Senior)** | Scaffolded Day 5 with mock data (Section 10) — not left until the end. One bar chart, one pie chart, cards, tables — nothing fancier (Section 10). |

**Your responsibilities:** architecture, RBAC, Dashboard, PR review, Alembic migration ownership (Section 9), final integration. That's it — demo data, shared UI components, and smoke testing now belong to the Integration Owner, not you, so this list stays realistic alongside actually writing code.

**On the "one junior = one module = one bottleneck" risk:** the fix isn't splitting modules across people — that reintroduces the multi-person-in-one-file conflicts the vertical-slice design exists to avoid. The fix is catching a stuck junior on **day 2 of their cycle, not day 3** when the PR is already late. That's what the daily standup (Section 11) is for, backed by you or the Integration Owner pairing with them for an hour rather than reassigning their module.

---

## 9. Git Workflow

**Structure:** `main` ← `develop` ← `feature/*` branches. Modules never merge straight into `main` — `develop` is where integration happens and gets exercised before anything touches `main`, which stays release-ready at all times (useful the moment the client wants to see something live).

```
feature/rbac  ─┐
feature/dpr    ├──►  develop  ──►  main
feature/tasks ─┘
```

**Cycle (repeats throughout the build):**
1. Dev pulls/rebases their `feature/*` branch from `develop` at the **start** of every cycle (not just when finished) — keeps conflicts small.
2. Dev works on their module for 2–3 days on their `feature/*` branch.
3. Day 3: dev raises a PR against `develop`.
4. Day 4: you (or the Integration Owner, for simple ones) review, resolve conflicts, merge into `develop`.
5. Everyone pulls the updated `develop` and continues.
6. Periodically (end of each integration pass in the timeline below), `develop` gets merged into `main` once it's demo-stable.

**Migration safety rule (prevents the worst kind of merge pain):**
Alembic migrations form a chain — each one points to the migration before it. If two people each create a migration on their own branch, both branches think their migration comes right after the same parent, and merging creates two conflicting "heads" that are painful to fix by hand.

**Rule: only you run `alembic revision` and apply migrations.** Juniors write their models/tables in code; when their PR reaches `develop`, you generate the migration for it. One person creating migrations = one clean chain, no forks. Code conflicts are normal and easy — migration conflicts are not, so this is worth the extra step on your side.

---

## 10. Timeline (15–20 Days)

| Days | Focus |
|---|---|
| **1–2** | **Setup.** You: repo skeleton (`main`/`develop`), shared DB credentials, base FastAPI folder structure (Section 3's layering), core schema for the entities in Section 6, API contract (Section 7) written down and agreed, Environment Setup doc (Section 14) written. **Integration Owner:** builds the shared frontend component library (Layout, Sidebar, Navbar, Table, Form, Card, Badge — Section 12) before any module UI starts, and scaffolds `seed.py` (Section 13). Juniors: environment setup, read their module's requirements, rough wireframes. |
| **3** | You start building RBAC. Juniors continue wireframing/learning their module's requirements. |
| **4** | RBAC merged and **frozen**. Juniors 1–4 begin building their modules in parallel, each on their own `feature/*` branch. |
| **5** | **Dashboard scaffolded with mock/fake data** — layout, cards, charts wired to hardcoded JSON, not real endpoints yet. This means Day 17 is "swap mock data for real," not "build the whole thing from scratch." |
| **6–14** *(exam days absorbed into this window)* | Standard 2–3 day cycles: build → PR day 3 → merge day 4 → pull → continue. Daily standups (Section 11) run throughout. Budget for **one solid module per junior** across this window, not two — that's the plan succeeding, not underperforming. Dashboard incrementally swaps mock endpoints for real ones as each module lands on `develop`. |
| **15–17** | **Integration pass.** Connect modules: DPR approval updates project lifecycle stage; approval can spawn a task; notifications fire on key transitions. `develop` merged into `main` once stable. |
| **18–20** | **Polish & demo prep.** Integration Owner runs the UI-consistency pass, seed realistic demo data, no new features started, rehearse the live demo: *submit DPR → SMFCL review → Ministry approval → funds released → Dashboard reflects it.* |

---

## 11. Daily Standup

15 minutes, every day, no exceptions — this is what catches a stuck junior before it costs a whole cycle. Each person answers three questions only:

1. What did I finish yesterday?
2. What am I doing today?
3. What's blocking me?

That's it — no design debates in standup, take those offline. If someone's blocked two days running, that's your (or the Integration Owner's) cue to pair with them directly rather than waiting for the Day 3 PR to reveal the problem.

---

## 12. Frontend Consistency

Left to their own judgment, four juniors building four modules independently will produce four different-looking apps — one modern, one that looks like default Bootstrap, one that looks like a copy-pasted Tailwind example. The fix is building the shared pieces once, before any module UI work starts:

```
components/
  Layout.tsx      -- page shell: sidebar + topbar + content area
  Sidebar.tsx
  Navbar.tsx
  Table.tsx        -- one table component, used by every module's list view
  Form.tsx         -- one form wrapper + input styles
  Card.tsx
  StatusBadge.tsx  -- renders dpr_status / task.status / lifecycle_stage consistently
```

Whoever builds these (you, during Day 1–2 setup, or the Integration Owner if you're deep in RBAC) owns them going forward — juniors *consume* these components, they don't build their own versions. This is the same DRY principle from Section 2, just applied to the frontend instead of the backend.

---

## 13. Seed Script & Demo Data

"Seed some demo data" left informal means someone manually clicking through the UI at 11pm on Day 19. Formalize it as a single script, owned by the Integration Owner, built incrementally as each module lands:

```
seed.py
  → creates users: 1 Admin, 2 Port Authority, 2 SMFCL, 1 Ministry
  → creates 8 projects across different categories/stages
  → creates 15 DPRs across different states in the state machine
     (some DRAFT, some SMFCL_REVIEW, some APPROVED, some FUNDS_RELEASED,
      at least one REJECTED_BY_SMFCL and one REJECTED_BY_MINISTRY —
      the demo needs to show both reject paths, not just the happy path)
  → creates 40 tasks across projects, mixed statuses/priorities
  → creates 10 meetings with notes
  → creates a handful of notifications
```

One command — `python seed.py` — resets to a clean, demo-ready state. Never hand-enter demo data. This also doubles as each junior's fastest way to get realistic data for their own module while building, instead of testing against one manually-created row.

---

## 14. Environment Setup

One page, so no junior burns half a day fighting their local setup instead of building their module:

```
git clone <repo>
cp .env.example .env
docker compose up -d          # or native Postgres install, team's choice
alembic upgrade head
python seed.py
npm install
npm run dev                   # frontend
uvicorn app.main:app --reload # backend
```

Written down on Day 1, alongside the repo skeleton — this is part of setup, not something each junior figures out independently.

---

## 15. Definition of Done / Demo Script

The MVP is done when this sequence works live, without errors, with realistic seed data:

1. Admin logs in, creates a project, assigns Port Authority/SMFCL/Ministry users.
2. Port Authority submits a DPR for that project.
3. SMFCL reviews it — demo both paths: reject with a comment (loops back), then approve and forward to Ministry.
4. Ministry reviews — approves.
5. Funds are marked released; audit trail shows every step with actor, old/new value, and timestamp.
6. A task gets created/assigned tied to the project.
7. A meeting note is logged for the project.
8. A notification record is created for the relevant user on a key transition (e.g. DPR rejected, funds released) — checked via the API/DB, no UI needed.
9. Dashboard shows the project's stage, pending approvals count, and task completion — all from real data, not the Day 5 mocks.

If this runs cleanly end-to-end, the MVP has done its job — everything else is a bonus.

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Exams eat into the 15–20 day window unevenly | Timeline already treats days 6–14 as elastic; don't compress days 1–5 (setup/RBAC/dashboard scaffold) or 18–20 (polish) to compensate — protect those. |
| RBAC not frozen in time, blocking everyone | It's the first thing built, by the most experienced person (you), with no other work starting until it's merged. |
| A junior gets stuck and becomes a silent bottleneck | Daily standup surfaces this on day 1–2 of their cycle, not day 3. You or the Integration Owner pair with them directly rather than reassigning the module mid-stream. |
| Dashboard becomes a last-minute scramble | Solved structurally — scaffolded Day 5 with mock data, wired incrementally, not built from scratch at Day 17. |
| A junior's module runs over time | Task Management and Stakeholder/Meeting Management are the two modules that can be quietly descoped further (e.g. drop priority levels, drop contact-info fields) without hurting the demo story. |
| Migration conflicts | Solved structurally in Section 9 — only you touch Alembic. |
| Four modules end up with four different API/response shapes | Solved structurally in Section 7 — contract frozen before Day 4. |
| Four modules end up looking visually inconsistent | Solved structurally in Section 12 — shared component library built before module UI starts. |
| Demo data assembled manually at the last minute | Solved structurally in Section 13 — one `seed.py` command, owned by the Integration Owner. |
| Scope creep back toward the full RFP | Section 4's "explicitly out of scope" list exists so any pressure to add a module gets checked against it first. |
| Plan becomes more detailed than the project itself | Every addition above (permissions, notifications, richer audit log) is real implementation work, not free — if the team finishes core modules early, spend the extra time hardening these, not adding new modules (Section 17 exists for that temptation instead). |

---

## 17. Future Roadmap (to mention to the client, not to build now)

Presenting this list alongside the demo signals deliberate scoping, not a limitation:

- Pre-Investment Appraisal & Feasibility, Tendering & Bid Evaluation, Risk Monitoring
- Full Fund Release & Disbursement system, PFMS Integration
- Grievance Management, Project Closure & Third-Party Clearance, PMC/EPC Performance tracking
- Satellite Imagery Integration, Drone Media Management
- Mobile Applications (Android/iOS)
- AI-Powered Knowledge Assistant Chatbot
- Cloud hosting, DR/HA, CI/CD
- Phases 2–4 of the project lifecycle (pre-construction, construction, post-construction)
