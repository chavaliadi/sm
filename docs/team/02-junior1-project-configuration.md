# Sagarmala 2.0 Portal — Developer Handbook
### Junior Developer 1 — Project Configuration & Lifecycle

**Project recap:** Sagarmala 2.0 Portal MVP — a focused slice of the
Sagarmala 2.0 RFP covering Phase 1 (Appraisal & Sanction) only: a project
gets proposed, reviewed by SMFCL, approved by the Ministry, and funded, with
a full audit trail and a dashboard. 15–20 day build. Full detail lives in the
master plan (`Sagarmala2_MVP_Project_Plan.md`) and `docs/` — this file is
your personal slice of it.

**Git workflow (applies to everyone):**
- Branch from `develop` into your own `feature/*` branch at the start of every 2–3 day cycle.
- Day 3 of your cycle: raise a PR against `develop`.
- Day 4: your PR gets reviewed and merged by the Senior (or Integration Owner for simple ones).
- Never touch Alembic migrations yourself — write your models in code, the Senior generates the migration when your PR lands.
- 15-minute daily standup: what you finished, what you're doing today, what's blocking you. Say something the moment you're stuck.

---

## Your Module: Project Configuration & Lifecycle

This is the spine of the app — almost every other module attaches to a
"project" record, so getting this schema right early matters more than any
other single module.

**Entity you own:**
```
projects (id, project_code, name, category, state, port_name,
           stakeholder_info, funding_model, estimated_cost,
           approved_cost, lifecycle_stage, is_active,
           created_by, updated_by, created_at, updated_at)
```

**Endpoints (standard contract — same shape every module uses, see `DECISION_RULES.md` D7):**
```
POST   /projects          create
GET    /projects          list (paginated)
GET    /projects/{id}     retrieve one
PUT    /projects/{id}     update
DELETE /projects/{id}     sets is_active = false (never hard-delete)
```

**How it works:**
1. Admin or Port Authority creates a project: name, category, state, port name, stakeholder info, funding model, cost estimates.
2. `lifecycle_stage` starts at `"appraisal"`. It advances later during the integration pass (Days 15–17) when Junior 2's DPR approval workflow moves it forward — coordinate with them then, you don't need to build that trigger yourself up front.
3. Every list endpoint filters `WHERE is_active = true` by default.
4. Wrap your routes with `require_permission("VIEW_PROJECT")` / `require_permission("EDIT_PROJECT")` once RBAC is merged (Day 4) — don't build your own auth checks.

**Definition of done:**
- Full CRUD works and matches the standard contract exactly (response shape, pagination, error format)
- `project_code` is unique — reject duplicates with a clear validation error
- Deleting a project sets `is_active = false`, doesn't remove the row
- Fields validated via Pydantic schemas (e.g. `estimated_cost`/`approved_cost` are numbers, not strings)

---

## If you finish early

Don't wander into an out-of-scope module — check `PROJECT_RULES.md` Section 3 first.

- Add filtering by category/state/lifecycle_stage to the list endpoint.
- Add a search-by-name query param.
- Help populate realistic project rows in `seed.py` (talk to the Integration Owner — Junior 4).
- Once Junior 2's DPR module lands, help wire the `lifecycle_stage` update trigger together during the integration pass.
