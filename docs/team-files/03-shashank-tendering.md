# Sagarmala 2.0 Portal — Developer Handbook (Phase 2)
### Shashank (Sub Dev 2) — Tendering & Bid Management

**Project recap:** Phase 2 (Pre-Construction) builds the work between DPR
approval and construction start. Your module is the **largest and highest
priority** module this sprint — Module 4 (Contracts, owned by Jayanth)
depends directly on your tender-award output.

**Why you:** Tendering has the same review → evaluate → decide workflow
shape as the DPR approval loop you already built and shipped in Phase 1.
You've already proven you can build a real state machine with an audit
trail — this is the same kind of module, at a similar scale.

**One thing worth saying plainly, given Phase 1:** your last module's
first few passes had real problems — an accidentally committed virtual
environment, a resurrected rejected branch, unverified "done" claims that
didn't hold up under live testing. The actual DPR state machine logic
underneath all of that, once extracted and fixed, was genuinely solid.
This sprint, build the same way you did at the end of Phase 1: commit
only your own files, verify everything live with real curl output before
calling it done, and check in daily — not just at PR time.

**Git workflow (applies to everyone):**
- Branch from `develop`: `feature/tender`
- Rebase onto `develop` at the start of every work session
- **Daily check-in with real evidence** — a curl response, a DB query,
  something live — not just a status update. This module is the critical
  path for Module 4, so a silent stall here blocks someone else, same as
  it did in Phase 1.
- Never touch Alembic migrations yourself — Adithya runs one batched
  migration once all 4 Phase 2 modules are ready
- Never edit another developer's `models/`, `schemas/`, `services/`,
  `api/`, or `features/` folders — and never re-merge an old, previously
  closed branch into this one. Start clean from current `develop`.

---

## Your Module: Tendering & Bid Management

**Backend:**
```
models/tender.py, models/bid.py
schemas/tender.py, schemas/bid.py
services/tender_service.py
api/tender.py
```

**Frontend:**
```
features/tender/
```

**Key Features:**
- Tender creation & publishing
- Bid submission tracker
- Technical bid evaluation
- Financial bid evaluation
- Tender award decision
- Tender status workflow (Draft → Published → Under Evaluation → Awarded)

**Database Tables:** `tenders`, `bids`

**API Routes:** `/api/tenders/*`

**Effort Estimate:** ★★★★★ (Large)

---

## How it works

1. Build the state machine explicitly, the same way you did for DPR —
   write down the exact transition matrix (Draft → Published → Under
   Evaluation → Awarded) before writing service code, and don't allow
   any transition outside it.
2. Bids belong to a tender (`tender_id`) and carry technical + financial
   evaluation fields.
3. The **award decision** is the critical output: it must produce a
   `tender_id` (and whatever award payload fields Module 4 needs) in a
   stable, agreed shape — confirm this exact shape with Jayanth **at Day
   1 schema freeze**, not mid-sprint. He may start building against a
   stubbed `tender_id` before your module is fully done; don't let the
   final shape change without telling him.
4. Log every status transition somewhere auditable, same pattern as
   `dpr_audit_log` — this project's convention is to always have a real
   audit trail on any approval-style workflow, not just DPR.
5. Follow the standard D7/D11 contract exactly.
6. Wrap routes with `require_permission(...)` using whatever permission
   strings Adithya adds for this module — confirm exact names with him,
   don't invent your own.

## Definition of Done
- Full tender + bid CRUD, matching D7/D11 contract
- Tender status transitions work and illegal transitions are blocked
  with a clear error — **live-tested, both a valid and an invalid
  transition, real HTTP response shown**, same standard as DPR's final
  verification
- Award decision produces the exact `tender_id`/payload shape Jayanth
  needs, confirmed with him directly
- No mock data fallback anywhere in the frontend
- `require_permission(...)` correctly gates write actions, tested with a
  non-privileged role actually blocked, not just Admin succeeding

## If you finish early
- Check in with Jayanth first — he may be blocked on your award output
- Check `PROJECT_RULES.md` Section 3 and this sprint's out-of-scope list
  before picking up anything else
