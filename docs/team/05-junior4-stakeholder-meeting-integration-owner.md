# Sagarmala 2.0 Portal — Developer Handbook
### Kavya (Junior Developer 4) — Stakeholder & Meeting Management + Integration Owner

**Project recap:** Sagarmala 2.0 Portal MVP — a focused slice of the
Sagarmala 2.0 RFP covering Phase 1 (Appraisal & Sanction) only: a project
gets proposed, reviewed by SMFCL, approved by the Ministry, and funded, with
a full audit trail and a dashboard. 15–20 day build. Full detail lives in the
master plan (`Sagarmala2_MVP_Project_Plan.md`) and `docs/` — this file is
your personal slice of it.

**Git workflow (applies to everyone):**
- Branch from `develop` into your own `feature/*` branch at the start of every 2–3 day cycle.
- Day 3 of your cycle: raise a PR against `develop`.
- Day 4: your PR gets reviewed and merged by the Senior (or you, for simple ones — see below).
- Never touch Alembic migrations yourself — write your models in code, the Senior generates the migration when your PR lands.
- 15-minute daily standup: what you finished, what you're doing today, what's blocking you. Say something the moment you're stuck.

---

## Your Module: Stakeholder & Meeting Management

The simplest CRUD module in the MVP — intentionally, because you're also
carrying the Integration Owner responsibilities below. Keep this module
lean; don't gold-plate it.

**Entities you own:**
```
stakeholders (id, project_id, name, organization, role, contact_info)
meetings     (id, project_id, title, date, notes)
```
Note: there's no separate `action_items` field on meetings — action items
are just Tasks (Junior 3's module) linked to the same project (see
`DECISION_RULES.md` D4). Don't build a second tracking system for the same
concept.

**Endpoints (standard contract, both entities):**
```
POST/GET/PUT/DELETE  /stakeholders
POST/GET/PUT/DELETE  /meetings
```

**Definition of done — your module:**
- CRUD works for both stakeholders and meetings, matching the standard contract
- Both are scoped to a `project_id`

---

## Your Other Role: Integration Owner

**This is the bigger part of your job** — budget your time accordingly, and
keep your CRUD module simple so you have room for this.

### 1. Shared frontend component library (Days 1–2, before anyone builds module UI)

Build these once so all four modules end up looking like one consistent app:
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
Everyone else consumes these — they don't build their own versions. If
you're blocked waiting on RBAC to be frozen before your own module can
start, this is exactly what to spend Days 1–2 on.

### 2. Seed script & demo data (owned by you, built incrementally)

```
seed.py
  → 1 Admin, 2 Port Authority, 2 SMFCL, 1 Ministry user
  → 8 projects across categories/stages
  → 15 DPRs across different states — include at least one
     REJECTED_BY_SMFCL and one REJECTED_BY_MINISTRY, not just approved ones
  → 40 tasks, mixed statuses/priorities
  → 10 meetings with notes
  → a handful of notifications
```
One command, `python seed.py`, resets everyone's local DB to a clean
demo-ready state. Update it as each module lands on `develop` — don't leave
it all for the last week.

### 3. Environment setup doc (Day 1)

```
git clone <repo>
cp .env.example .env
docker compose up -d
alembic upgrade head
python seed.py
npm install
npm run dev
uvicorn app.main:app --reload
```
Write this down on Day 1 so nobody loses half a day fighting their local
setup.

### 4. Smoke-testing checklist & UI-consistency pass (Days 18–20)

Before the final demo, walk through every module and confirm the shared
components are actually being used consistently, then run the full demo
script end-to-end at least once yourself before the live demo (find it in
the master plan's Definition of Done section).

### 5. Simple merge conflicts

For straightforward PRs, you can review and merge into `develop` instead of
routing everything through the Senior — this is the whole point of your
role: taking load off the bottleneck.

---

## If you finish early

Don't wander into an out-of-scope module — check `PROJECT_RULES.md` Section 3 first.

- If there's time, build the notifications backend properly (table + `create_notification()` service + `GET /notifications` endpoint) if no one's picked it up yet — it's cross-cutting infrastructure, not owned by one module.
- Add a couple of automated smoke tests instead of just a manual checklist.
- Help whichever junior is furthest behind — you're the second pair of hands after the Senior.
