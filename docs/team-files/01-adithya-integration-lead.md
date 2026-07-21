# Sagarmala 2.0 Portal — Developer Handbook (Phase 2)
### Adithya (Senior Developer / Team Lead) — Integration Lead

**Project recap:** Phase 2 (Pre-Construction) builds the work that happens
after a DPR is approved and before construction begins: clearing land and
statutory approvals, running the tender process, and onboarding and
contracting the construction agency. Phase 1 (Appraisal & Sanction) is
complete and tagged `phase1-mvp-complete` on `main`. Full detail lives in
`Sagarmala_Phase2_PreConstruction_Module_Assignment.docx` and `docs/`.

**Git workflow (applies to everyone):**
- Branch from `develop` into your own `feature/*` branch at the start of every 2–3 day cycle.
- Rebase your feature branch onto `develop` at the start of every work session, not just before opening a PR.
- Day 3 of your cycle: raise a PR against `develop`.
- Day 4: your PR gets reviewed and merged (by you, for everyone else's).
- Never touch Alembic migrations from a feature branch — you're the one person who runs them.
- 15-minute daily standup: what you finished, what you're doing today, what's blocking you.
- Branch naming: `feature/<module>` — e.g. `feature/clearance`, `feature/tender`, `feature/contractor`, `feature/contract`.

---

## Your Role This Sprint: Integration Lead Only — No Feature Module

Unlike Phase 1, you own **zero feature modules** this sprint. This is
deliberate — Phase 1 showed what happens when the same person carries
architecture, reviews, migrations, *and* a module: things slip. This time
your full attention goes to keeping four parallel modules from colliding.

**Responsibilities:**
- Dashboard / MIS — new KPI cards for clearance status, tender pipeline, contractor count, active contracts
- Sidebar & navigation updates for all 4 new modules
- RBAC permission additions for new modules (new permission strings in `bootstrap_rbac.py`, wired into `role_permissions`)
- API router registration — single import point for all 4 new feature routers in `app/main.py`
- Alembic — run `alembic revision --autogenerate` **after all 4 models are merged**, per Rule D8. Not per-module — batch it once all 4 land, since they share this sprint's schema freeze.
- `seed.py` updates — add realistic demo rows for clearances, tenders/bids, contractors, contracts/work orders
- Final integration testing and PR reviews for all 4 modules
- Merging feature branches into `develop`

**Frozen files — only you edit these this sprint:**
```
backend/app/main.py
backend/app/api/router.py
backend/app/core/permissions.py
backend/alembic/
backend/app/db/seed.py (backend/seed.py)
frontend/src/layouts/
frontend/src/pages/DashboardPage.tsx (HomePage.tsx)
frontend/src/routes/
frontend/src/components/ui/
frontend/src/types/index.ts
```
If a junior needs something in one of these files (a new sidebar link, a
new route registration), they tell you what's needed — you make the edit,
not them. This is what actually prevents the merge conflicts Phase 1 hit
repeatedly on `AppLayout.tsx` and `routes/index.tsx`.

---

## Day 1 — Database Design Freeze (you run this, whole team present)

Before anyone writes service code:
- [ ] All new tables designed and reviewed as a group
- [ ] Relationships & foreign keys finalized — especially `clearances.project_id`, `bids.tender_id`, `contracts.tender_id`, `work_orders.contract_id`
- [ ] Enums finalized (clearance type, tender status, contract status)
- [ ] Naming conventions locked — snake_case tables, singular SQLModel class names, consistent with Phase 1's `dpr_audit_log` convention
- [ ] Everyone signs off on the schema before writing service code
- [ ] Confirm the Module 4 → Module 2 dependency explicitly: Jayanth needs Shashank's `tender_id` / award payload shape agreed **today**, not mid-sprint. Jayanth builds against a stubbed `tender_id` in the meantime if Module 2 isn't ready first.

---

## Definition of Done (your role)
- All 4 new permission strings exist in `bootstrap_rbac.py` and are mapped to the correct roles
- Dashboard shows real KPI cards for clearance status, tender pipeline, contractor count, active contracts — reading live data, no mocks left in by demo time
- Single Alembic migration covers all 4 modules' new tables cleanly, no gaps in the chain
- Every one of the 4 new modules merges into `develop` through a real PR you've reviewed, not merged blind
- Full demo walkthrough rehearsed end-to-end before handover, same standard as Phase 1's Section 15 script

## If you finish integration work early
- Pair with whichever developer is most behind — same rule as Phase 1
- Don't quietly start a 5th module or touch Phase 3 scope
