# Sagarmala 2.0 Portal — Developer Handbook (Phase 2)
### Pragnya (Sub Dev 1) — Land Acquisition & Statutory Clearances

**Project recap:** Phase 2 (Pre-Construction) builds the work between DPR
approval and construction start. Your module gates project progression
from appraisal into tendering — nothing moves to Module 2 (Tendering)
until a project's clearances are in order.

**Why you:** You already own the project's geographic/location data and
`lifecycle_stage` field from Phase 1's Project Configuration module —
clearances gate directly against that field, so you already know this
schema better than anyone.

**Git workflow (applies to everyone):**
- Branch from `develop`: `feature/clearance`
- Rebase onto `develop` at the start of every work session
- Day 3: raise a PR against `develop`
- Never touch Alembic migrations yourself — Adithya runs one batched migration once all 4 Phase 2 modules are ready, not per-module
- 15-minute daily standup — say something the moment you're stuck
- Never edit another developer's `models/`, `schemas/`, `services/`, `api/`, or `features/` folders. Only Adithya touches the frozen shared files (see his handbook).

---

## Your Module: Land Acquisition & Statutory Clearances

**Backend:**
```
models/clearance.py
schemas/clearance.py
services/clearance_service.py
api/clearance.py
```

**Frontend:**
```
features/clearance/
```

**Key Features:**
- Land acquisition tracking
- CRZ clearance
- Environmental Clearance (EC)
- Forest Clearance
- Consent to Operate (CTO)
- Utility shifting
- Clearance expiry monitoring
- Clearance status linked to project `lifecycle_stage`

**Database Tables:** `clearances`, `clearance_documents`

**API Routes:** `/api/clearances/*`

**Effort Estimate:** ★★★★ (High)

---

## How it works

1. Each clearance record belongs to a project (`project_id`) and has a
   `clearance_type` (Land Acquisition / CRZ / EC / Forest / CTO / Utility
   Shifting) and a status (Pending / Approved / Rejected / Expired).
2. Track an expiry date per clearance — this is what the "expiry
   monitoring" feature reads from.
3. When all required clearances for a project reach Approved, that's
   what gates the project into the next stage — coordinate the exact
   trigger/flag with Adithya during Day 1 schema freeze, since it affects
   `lifecycle_stage`, a shared field.
4. Follow the standard D7 contract exactly, same as every Phase 1 module:
   `POST/GET/GET-by-id/PUT/DELETE /clearances`, paginated list, `is_active`
   soft delete, D11 error codes.
5. Wrap routes with `require_permission(...)` once Adithya has added the
   new clearance-related permission strings to `bootstrap_rbac.py` —
   don't invent your own permission names, confirm the exact strings
   with him first.

## Definition of Done
- Full CRUD works for clearances, matching the standard D7/D11 contract
- Clearance status and expiry date both stored and retrievable
- Clearance status change correctly reflects toward the project's
  `lifecycle_stage` gate (agreed with Adithya at Day 1 freeze)
- `require_permission(...)` correctly gates write actions
- No mock data fallback anywhere in the frontend — real error/empty
  states only, same rule as every Phase 1 module

## If you finish early
- Check `PROJECT_RULES.md` Section 3 and this sprint's own out-of-scope
  list before picking up anything else — document upload/verification
  detail is intentionally kept to a single document-link field, not a
  file upload system, don't gold-plate it
- Help populate realistic clearance rows in `seed.py` — talk to Adithya
