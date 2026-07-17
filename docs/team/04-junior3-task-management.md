# Sagarmala 2.0 Portal — Developer Handbook
### Jayanth (Junior Developer 3) — Task Management

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

## Your Module: Task Management

Fully independent tables and routes — this is the module with the lowest
conflict risk, safe to build entirely in parallel with everyone else.

**Entity you own:**
```
tasks (id, project_id, title, description, priority, status,
        assigned_to, due_date, created_at)
```

**Endpoints (standard contract, see `DECISION_RULES.md` D7):**
```
POST   /tasks              create
GET    /tasks              list (paginated, filterable)
GET    /tasks/{id}         retrieve one
PUT    /tasks/{id}         update
PATCH  /tasks/{id}/status   quick status change (todo / in_progress / done)
DELETE /tasks/{id}         sets is_active = false
```

**How it works:**
1. A task belongs to a project (`project_id`) and is assigned to a user (`assigned_to`).
2. Fields: `priority` (low/medium/high), `status` (todo/in_progress/done), `due_date`.
3. Wrap routes with `require_permission("CREATE_TASK")` / similar once RBAC is merged (Day 4).
4. Later (Days 15–17), a DPR approval may auto-create a task — Junior 2 will call into your task-creation logic during the integration pass. You don't need to build anything for this now, just be available to coordinate then.

**Definition of done:**
- Full CRUD works, matches the standard contract
- Tasks are filterable by `project_id`, `assigned_to`, and `status`
- Due dates sort correctly in the list view

---

## If you finish early

Don't wander into an out-of-scope module — check `PROJECT_RULES.md` Section 3 first.

- Highlight overdue tasks (a status badge color change when `due_date` has passed and status isn't done) — a nice visible demo detail.
- Add a bulk-assign endpoint.
- Help the Integration Owner get realistic task rows into `seed.py`.
- Once you're done, check in with Junior 1 or Junior 4 — whoever's furthest behind benefits most from a second pair of hands.
