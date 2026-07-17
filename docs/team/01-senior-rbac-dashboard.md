# Sagarmala 2.0 Portal — Developer Handbook
### Senior Developer / Team Lead — RBAC + Dashboard/MIS + Architecture

**Project recap:** Sagarmala 2.0 Portal MVP — a focused slice of the
Sagarmala 2.0 RFP covering Phase 1 (Appraisal & Sanction) only: a project
gets proposed, reviewed by SMFCL, approved by the Ministry, and funded, with
a full audit trail and a dashboard. 15–20 day build. Full detail lives in the
master plan (`Sagarmala2_MVP_Project_Plan.md`) and `docs/` — this file is
your personal slice of it.

**Git workflow (applies to everyone):**
- Branch from `develop` into your own `feature/*` branch at the start of every 2–3 day cycle.
- Day 3 of your cycle: raise a PR against `develop`.
- Day 4: your PR gets reviewed and merged (by you, for everyone else's — see below).
- Never touch Alembic migrations from a feature branch — you're the one person who runs them.
- 15-minute daily standup: what you finished, what you're doing today, what's blocking you.

---

## Your Modules

- **Admin & Access Control (RBAC)** — build first, freeze early
- **Dashboard / MIS** — scaffolded Day 5 with mock data, wired to real data incrementally

## Beyond your modules: your other responsibilities

- Architecture decisions, and keeping `DECISION_RULES.md` enforced as the team builds
- Reviewing every PR before it merges into `develop`
- Owning all Alembic migrations — you generate every migration, no one else does
- Final integration pass (Days 15–17) and merging `develop` into `main`
- Unblocking whoever's stuck, spotted via daily standup

Everything else — demo data, shared UI components, smoke testing,
UI-consistency pass — belongs to the Integration Owner (Junior 4), not you.
Don't quietly absorb it back.

---

## Module 1: Admin & Access Control (RBAC)

**What it does:** Login, four roles (Port Authority, SMFCL, Ministry,
Admin), permission-based access control, and an audit log utility every
other module calls into.

**Entities you own:**
```
users            (id, name, email, password_hash, role, created_at)
roles            (id, name)
permissions      (id, name)  -- VIEW_PROJECT, EDIT_PROJECT, APPROVE_DPR,
                                CREATE_TASK, VIEW_DASHBOARD, ...
role_permissions (role_id, permission_id)
audit_log        (id, user_id, action, entity_type, entity_id,
                   old_value, new_value, ip_address, user_agent,
                   performed_by, timestamp)
```

**Endpoints:**
```
POST /auth/login        -- returns JWT
POST /users             -- admin creates a user with a role
GET  /users             -- list users
GET  /permissions       -- list permissions
```

**How it works:**
1. Login issues a JWT containing the user's id and role.
2. Middleware decodes the JWT on every request, loads that role's permissions.
3. Every protected route calls `require_permission("SOME_PERMISSION")` — never `role == "ADMIN"` checks scattered around (see `DECISION_RULES.md` D5).
4. A single `log_action(user, action, entity, old_value, new_value)` utility writes to `audit_log` — every module imports this rather than writing its own logging.

**Freeze this by Day 4.** No other module's route logic starts until RBAC is merged into `develop`.

**Definition of done:**
- All 4 roles can log in and receive a valid JWT
- At least one protected route per module correctly blocks an unauthorized role
- Audit log entries are created for logins and for at least one action per module

---

## Module 2: Dashboard / MIS

**What it does:** Summary view pulling from every other module — project
counts by stage, pending approvals, task completion. Cards + tables + exactly
one bar chart and one pie chart — nothing fancier (see `DECISION_RULES.md` D6).

**How it works:**
1. Day 5: scaffold the layout, cards, and both charts against hardcoded mock JSON.
2. As each module lands on `develop` (Days 6–14), swap one mock endpoint at a time for the real one: `GET /projects`, `GET /dpr`, `GET /tasks`.
3. By Day 17, everything reads real data — this was never a Day 17 build-from-scratch task.

**Definition of done:**
- Project count by lifecycle stage (cards or bar chart)
- Pending DPR approvals count
- Task completion (pie chart: done / in progress / todo)
- All of the above reading real data by the final demo, not mocks

---

## If you finish early

Don't wander into an out-of-scope module — check `PROJECT_RULES.md` Section 3 first.

- Pair with whichever junior is most behind — an hour of pairing beats reassigning their module.
- Write a few basic tests for the auth flow (login, permission denial).
- Add a simple date-range filter to the Dashboard.
- Help the Integration Owner with the smoke-testing checklist before the final demo.
