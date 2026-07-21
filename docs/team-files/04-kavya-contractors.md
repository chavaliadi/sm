# Sagarmala 2.0 Portal — Developer Handbook (Phase 2)
### Kavya (Sub Dev 3) — Contractor Onboarding & Registration

**Project recap:** Phase 2 (Pre-Construction) builds the work between DPR
approval and construction start. Your module registers and tracks the
construction agencies that will eventually be awarded contracts.

**Why you:** A contractor directory with registration and verification is
a direct extension of the stakeholder-directory pattern you already built
and shipped cleanly in Phase 1 — same shape, different entity.

**Git workflow (applies to everyone):**
- Branch from `develop`: `feature/contractor`
- Rebase onto `develop` at the start of every work session
- Day 3: raise a PR against `develop`
- Never touch Alembic migrations yourself — Adithya runs one batched
  migration once all 4 Phase 2 modules are ready
- Never edit another developer's `models/`, `schemas/`, `services/`,
  `api/`, or `features/` folders

---

## Your Module: Contractor Onboarding & Registration

**Backend:**
```
models/contractor.py
schemas/contractor.py
services/contractor_service.py
api/contractor.py
```

**Frontend:**
```
features/contractors/
```

**Key Features:**
- Contractor profile & registration
- Eligibility / document verification
- Empanelment status
- Contractor directory
- Contractor performance history (**placeholder for Phase 3 only** — don't build this now, just leave the field/section absent, not a stubbed fake feature)

**Database Tables:** `contractors`, `contractor_documents`

**API Routes:** `/api/contractors/*`

**Effort Estimate:** ★★★ (Medium)

---

## How it works

1. A contractor record has a profile (name, registration details, contact
   info) and a status enum: Registered → Verified → Empanelled.
2. Keep document verification to a single document-link field (same
   pattern as Task Management's `evidence_url` from Phase 1) — no file
   upload system, that's explicitly out of scope for this sprint.
3. This is the smallest, most template-like module in this sprint —
   build it clean and simple, and if you finish early, you're the
   natural person to help whoever's furthest behind (likely Shashank,
   given Module 2's size, or Jayanth if he's blocked on the `tender_id`
   handoff).
4. Follow the standard D7/D11 contract exactly.
5. Wrap routes with `require_permission(...)` using the exact permission
   strings Adithya adds — confirm with him.

## Definition of Done
- Full contractor CRUD, matching D7/D11 contract
- Status enum works (Registered / Verified / Empanelled)
- Single document-link field present and functional, no upload system
- Performance history section is genuinely absent, not stubbed with fake
  data — that's Phase 3 scope, not this sprint's
- No mock data fallback anywhere in the frontend
- `require_permission(...)` correctly gates write actions

## If you finish early
- Check `PROJECT_RULES.md` Section 3 and this sprint's out-of-scope list
- Check in with Shashank (Module 2, largest/highest-risk module) or
  Jayanth (may be blocked waiting on Module 2's output) — whoever needs
  it more
- Help Adithya get realistic contractor rows into `seed.py`
