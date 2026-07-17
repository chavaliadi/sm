# Sagarmala 2.0 Portal — Developer Handbook
### Junior Developer 2 — DPR Submission & Approval Workflow

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

## Your Module: DPR Submission & Approval Workflow

**This is the headline feature of the whole demo.** Port Authority submits a
DPR (Detailed Project Report) → SMFCL reviews → Ministry reviews → funds
released. If this works cleanly end-to-end, live, in front of the client,
the MVP has done its job. Take extra care here — ask questions early rather
than guessing.

**Entities you own:**
```
dpr           (id, project_id, version, status, submitted_by,
                current_stage, created_at, updated_at)
dpr_audit_log (id, dpr_id, actor_id, action, comment, timestamp)
```

**The state machine — do not redesign this, build exactly this:**
```
DRAFT
  → SUBMITTED
      → SMFCL_REVIEW
          → REJECTED_BY_SMFCL   (back to Port Authority) → SUBMITTED
          → FORWARDED_TO_MINISTRY
              → REJECTED_BY_MINISTRY  (back to SMFCL) → SMFCL_REVIEW
              → APPROVED
                  → FUNDS_RELEASED
```
Every transition must write to `dpr_audit_log`: actor, old status, new
status, comment, timestamp. This one table is the entire "audit trail"
requirement — no need for anything fancier.

**Endpoints:**
```
POST /dpr                       -- Port Authority creates a DPR (status: DRAFT)
PUT  /dpr/{id}/submit           -- DRAFT → SUBMITTED → SMFCL_REVIEW
PUT  /dpr/{id}/smfcl-review     -- {decision: approve|reject, comment}
                                    → FORWARDED_TO_MINISTRY or REJECTED_BY_SMFCL
PUT  /dpr/{id}/ministry-review  -- {decision: approve|reject, comment}
                                    → APPROVED or REJECTED_BY_MINISTRY
PUT  /dpr/{id}/release-funds    -- APPROVED → FUNDS_RELEASED
GET  /dpr, GET /dpr/{id}        -- standard list/retrieve
```

**Rules to enforce:**
- Reject any transition that doesn't match the diagram exactly (e.g. can't approve a DRAFT DPR, can't release funds before APPROVED).
- `smfcl-review` requires the SMFCL role + `APPROVE_DPR` permission; `ministry-review` requires the Ministry role + the same permission — check with the Senior once RBAC is frozen (Day 4).
- On key transitions (rejected, approved, funds released), call `create_notification(user_id, title, message)` — the notifications table/service is backend-only for this MVP, no UI needed (see `DECISION_RULES.md` D3).

**Definition of done:**
- All transitions in the diagram work; illegal transitions are blocked with a clear error
- Both reject paths (SMFCL and Ministry) are demonstrable, not just the happy path
- `dpr_audit_log` has a row for every transition with actor + old/new status + comment
- Notifications fire on reject/approve/funds-released

---

## If you finish early

Don't wander into an out-of-scope module — check `PROJECT_RULES.md` Section 3 first.

- During the integration pass (Days 15–17), coordinate with Junior 1 so an APPROVED/FUNDS_RELEASED DPR updates the project's `lifecycle_stage`.
- Add DPR versioning: a resubmission after rejection creates `version + 1` instead of overwriting.
- Write a few tests specifically for illegal-transition rejection — this is the module most likely to have a subtle bug the demo exposes live.
