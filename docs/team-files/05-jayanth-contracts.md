# Sagarmala 2.0 Portal — Developer Handbook (Phase 2)
### Jayanth (Sub Dev 4) — Contract & Work Order Management

**Project recap:** Phase 2 (Pre-Construction) builds the work between DPR
approval and construction start. Your module turns an awarded tender into
an issued contract and trackable work orders.

**Why you:** Contracts and work orders decompose into trackable
deliverables — the same shape as the Task Management module you already
built and shipped cleanly in Phase 1.

**Real dependency to plan around:** your module depends on **Module 2's
(Shashank's) tender-award output** — specifically the `tender_id` and
whatever award payload fields come with it. Agree the exact shape at Day 1
schema freeze. If Module 2 isn't ready when you are, build and test
against a stubbed/hardcoded `tender_id` rather than sitting idle — don't
let his module's pace fully block yours.

**Git workflow (applies to everyone):**
- Branch from `develop`: `feature/contract`
- Rebase onto `develop` at the start of every work session
- Day 3: raise a PR against `develop`
- Never touch Alembic migrations yourself — Adithya runs one batched
  migration once all 4 Phase 2 modules are ready
- Never edit another developer's `models/`, `schemas/`, `services/`,
  `api/`, or `features/` folders
- Cross-module relationships use foreign-key IDs only (`tender_id`) —
  never import Module 2's service or model code directly

---

## Your Module: Contract & Work Order Management

**Backend:**
```
models/contract.py, models/work_order.py
schemas/contract.py
services/contract_service.py
api/contract.py
```

**Frontend:**
```
features/contracts/
```

**Key Features:**
- Contract issuance after tender award
- Work order generation
- Contract terms & milestone definitions (**execution/progress tracking
  is Phase 3 — don't build that here, just the terms/milestone
  definitions themselves**)
- Contract status tracking (Draft → Issued → Active → Closed)

**Database Tables:** `contracts`, `work_orders`

**API Routes:** `/api/contracts/*`

**Effort Estimate:** ★★★ (Medium)

**Depends on:** Module 2's tender-award output (`tender_id`) — coordinate
the exact handoff fields during the Day 1 schema freeze, not mid-sprint.

---

## How it works

1. A contract references a `tender_id` (foreign key only, never a direct
   import of Shashank's tender service/model).
2. Contract status: Draft → Issued → Active → Closed — build this as an
   explicit small state machine, same discipline as your Phase 1
   evidence-URL rule and DPR's transition matrix, not ad-hoc if/else.
3. Work orders belong to a contract (`contract_id`) — this is genuinely
   the same shape as Tasks belonging to a project, so this module should
   move fast for you.
4. Milestone definitions are just data on the contract (terms, dates,
   amounts) — no progress-tracking logic against them, that's explicitly
   Phase 3.
5. Follow the standard D7/D11 contract exactly.
6. Wrap routes with `require_permission(...)` using the exact permission
   strings Adithya adds — confirm with him.

## Definition of Done
- Full contract + work order CRUD, matching D7/D11 contract
- Contract status transitions work correctly (Draft → Issued → Active →
  Closed), illegal transitions blocked
- `tender_id` FK wiring confirmed working against Module 2's real output
  (not just the stub) before calling this done
- No mock data fallback anywhere in the frontend
- `require_permission(...)` correctly gates write actions

## If you finish early
- If blocked on Module 2, build and verify against a stubbed `tender_id`
  rather than waiting idle — swap to the real one once available
- Check `PROJECT_RULES.md` Section 3 and this sprint's out-of-scope list
- Help Adithya get realistic contract/work-order rows into `seed.py`
