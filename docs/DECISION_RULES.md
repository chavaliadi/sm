# DECISION_RULES.md

Every entry below was already debated and decided. **An AI agent must treat
these as locked** — not re-litigate them, not "improve" them, not pick a
different textbook-correct pattern instead. If a decision here seems wrong
for a specific situation, flag it to a human and wait for a response; don't
silently override it.

Format: **Decision → Rationale → What NOT to do**

---

### D1. No Repository layer

**Decision:** Backend is `Route → Service → SQLModel Session`. Services talk
to the DB directly.
**Rationale:** A full Repository layer is textbook-correct but is mostly
CRUD boilerplate (`create()`, `update()`, `find()`, `find_by_id()` per
module) for a benefit — swappable data sources — nobody needs this month,
for a 5-dev/20-day beginner-to-intermediate team.
**Do NOT:** create a `repositories/` folder, or suggest adding one "for best
practice." If a genuine need for swappable data access shows up later, that's
a future decision, not a default.

### D2. `is_active` boolean, not `deleted_at` timestamp

**Decision:** Soft delete uses `is_active: bool`, filtered with `WHERE
is_active = true`.
**Rationale:** A `deleted_at` timestamp adds filtering logic and edge cases
(is a null-vs-set check, timezone handling) an MVP doesn't need.
**Do NOT:** add a `deleted_at` column to any table, or hard-delete rows.

### D3-REVISED. Notifications now have a frontend UI (amends D3)

**Original D3:** Notifications were backend-only for the MVP — table,
create_notification() service function, GET /notifications endpoint,
no UI.
**Revision:** A frontend UI was added — a bell icon with an unread-count
badge in AppLayout.tsx, and a dropdown panel
(frontend/src/features/notifications/NotificationsPanel.tsx) listing
notifications with dismiss (delete) actions.
**Important limitation, stated explicitly:** there is no mark-as-read
endpoint. Every notification is inserted with read=False and nothing in
the backend ever sets it to True. The only user action is dismiss
(DELETE /notifications/{id}), which removes the row entirely. This
means the system currently functions as a dismissible activity feed,
not a true read/unread inbox — the badge counts undismissed
notifications, not "unread" in the conventional sense.
**Do NOT:** assume a mark-as-read endpoint exists when building anything
that depends on it. If genuine read/unread tracking becomes a
requirement, that's a small addition (a PATCH endpoint + a read
boolean toggle) — not currently built.

### D4. Meetings has no `action_items` field

**Decision:** `meetings` table is just `(id, project_id, title, date,
notes)`. Action items from a meeting are created as Tasks.
**Rationale:** One task-tracking concept instead of two overlapping ones —
DRY.
**Do NOT:** add an `action_items` field back to `meetings`, or build a
second tracking system for the same concept.

### D5. RBAC is permission-based, not role-string-based

**Decision:** Every protected route calls `require_permission("SOME_PERMISSION")`.
Permissions are looked up via `role_permissions`, not by comparing
`role == "ADMIN"` inline.
**Rationale:** Adding a new permission later is "create permission, assign to
role" — not editing every route that used a hardcoded role check.
**Do NOT:** write `if user.role == "ADMIN"` (or similar) anywhere in route or
service code.

### D6-REVISED. Dashboard expanded from 1 bar + 1 pie to 2 bar + 2 pie (amends D6)

**Original D6:** Dashboard shows cards + a table + exactly one bar chart
+ one pie chart — no more, to keep it simple and readable.
**Revision:** Added a second bar chart (Tender Pipeline by Status,
all 14 tender stages represented, most currently at zero) and a second
pie chart (Statutory Clearance Status Breakdown — Approved/Pending/
Rejected). Chosen over a Contract status pie chart because clearances
currently have more real data variety (15 records across 3 statuses,
vs. 7 contracts across 3 statuses with less spread).
**Rationale:** The original 1+1 cap was right for a Phase-1-only demo.
Now that Phase 2's four modules (Clearances, Tendering, Contracts,
Contractors) generate real state, the Dashboard was under-representing
what the system actually does. This is a deliberate, bounded expansion
— 2+2 — not the start of unbounded chart growth.
**Do NOT:** add a third bar or third pie chart without a new, explicit
decision. If Contracts' data becomes more varied later, that's a reason
to swap the existing clearance pie for a contract one, not add a fifth
chart.

### D7. API contract is frozen — every module matches it exactly

**Decision:**
```
POST   /{module}          create
GET    /{module}          list (paginated)
GET    /{module}/{id}     retrieve one
PUT    /{module}/{id}     update
DELETE /{module}/{id}     sets is_active = false

Success:    { "data": {...}, "meta": {} }
List:       { "data": [...], "meta": { "page", "page_size", "total" } }
Error:      { "error": { "code", "message", "field" } }
```
**Rationale:** Four modules independently inventing four response shapes is
the single biggest source of integration pain on a multi-junior team.
**Do NOT:** invent a different response shape, error format, or pagination
style for a new endpoint — match this exactly. This applies to Phase 2's
4 new modules identically to Phase 1's 6.

### D8. Only one person runs Alembic migrations

**Decision:** The Senior/Team Lead is the only person who runs `alembic
revision` and `alembic upgrade`. Juniors write SQLModel models in code; the
migration is generated when their PR lands on `develop`.
**Rationale:** Migrations form a chain (each points to the one before it).
Two people generating migrations on separate branches creates conflicting
chain heads that are painful to fix by hand — much worse than a normal code
merge conflict.
**Do NOT:** run `alembic revision --autogenerate` on a feature branch. An
agent helping a junior should write/update the SQLModel model and stop
there. In Phase 2, this migration is run **once, after all 4 new modules'
models have landed on `develop`** — not once per module — since the sprint
treats the schema freeze as a batch, not four separate migrations.

### D9. Git flow: `main ← develop ← feature/*`

**Decision:** Nobody merges directly into `main`. Feature branches merge into
`develop`; `develop` merges into `main` only at integration checkpoints.
**Rationale:** Keeps `main` release-ready at all times.
**Do NOT:** commit or open a PR directly against `main`. `main` was last
promoted at the Phase 1 completion checkpoint (tag `phase1-mvp-complete`);
the next promotion happens at Phase 2's own stable checkpoint, not
continuously during the sprint.

### D10. TypeScript, strict-ish

**Decision:** Frontend is TypeScript, not JavaScript. Shared types live in
`src/types/`, mirroring backend Pydantic schemas field-for-field.
**Rationale:** When a backend field name changes, every page using that type
gets a compile error immediately instead of a silent runtime failure
discovered during the demo.
**Do NOT:** use `any` to silence a type error — fix the actual mismatch, or
ask if the shared type needs updating (and update it in `src/types/`, not
just locally in one file). `src/types/index.ts` is a frozen/shared file in
Phase 2 (D13) — module owners tell the Integration Lead what needs adding,
they don't edit it directly.

### D11. Error raising convention

**Decision:** Always raise `HTTPException(status_code=..., detail={"code": "SOME_CODE", "message": "...", "field": None})` when raising errors explicitly. Never pass a bare string to `detail`.
**Rationale:** The global exception handler in `main.py` formats all validation and HTTP exceptions to the standard D7 error envelope. Passing a dict allows setting explicit, domain-specific error codes (like `INVALID_STATE_TRANSITION`) instead of defaulting to generic ones (like `BAD_REQUEST`).
**Do NOT:** raise `HTTPException(status_code=..., detail="bare string message")` or construct arbitrary custom error responses.

### D12. API routes return `*Read` schemas, never raw SQLModel objects

**Decision:** Every route returns a Pydantic `*Read` schema (`UserRead`, `ProjectRead`, etc.), never the raw SQLModel table object.
**Rationale:** `User` includes `password_hash`. If a route ever returns the raw model instead of a schema that explicitly excludes it, the hash leaks to the browser — this makes that a type/schema mismatch instead of something that depends on someone remembering not to do it.
**Do NOT:** return a raw SQLModel object from any route. Always construct the `*Read` schema explicitly.

### D13. Phase 2: Integration Lead is the sole editor of shared/frozen files

**Decision:** For the Phase 2 sprint, one person (Adithya, Integration Lead)
is the only one who edits: `backend/app/main.py`, `backend/app/api/router.py`,
`backend/app/core/permissions.py`, `backend/alembic/`, `backend/seed.py`,
`frontend/src/layouts/`, `frontend/src/pages/HomePage.tsx` (Dashboard),
`frontend/src/routes/index.tsx`, `frontend/src/components/ui/`,
`frontend/src/types/index.ts`. The Integration Lead carries no feature
module of their own this sprint specifically so this is a realistic
workload, not an additional burden on top of a module.
**Rationale:** Phase 1 repeatedly hit merge conflicts on exactly these files
(`AppLayout.tsx`, `routes/index.tsx`) when multiple module owners edited
them independently in parallel. Routing an edit through one person removes
the conflict at its source instead of resolving it after the fact.
**Do NOT:** have a module owner add their own sidebar link, route
registration, router import, permission string, or migration directly.
Tell the Integration Lead what's needed; they make the edit.

### D14. Phase 2 cross-module dependencies use foreign keys, agreed at Day 1 freeze

**Decision:** Module 4 (Contract & Work Order Management) depends on Module
2's (Tendering & Bid Management) tender-award output. The dependency is a
foreign key (`tender_id`) and an agreed payload shape, decided together at
the Phase 2 Day 1 schema freeze — not discovered mid-sprint. If Module 2
isn't ready when Module 4 needs it, Module 4 builds and tests against a
stubbed `tender_id` rather than staying idle.
**Rationale:** Same principle as D1/Section 5 of `DEVELOPMENT_RULES.md`
(cross-module relationships use FK IDs only, never direct imports of
another module's service/model code) — made explicit here because this is
the one dependency chain in Phase 2 that can silently block a whole
module if the handoff shape isn't nailed down in advance.
**Do NOT:** let Module 4 import Module 2's service or model code directly.
Do NOT let the `tender_id`/award payload shape change without telling the
other module's owner.

### D15. Tendering workflow is a 14-stage process, not the original 4-state placeholder

**Decision:** The Tender status lifecycle is:
DRAFT → INTERNAL_APPROVAL → PUBLISHED → CORRIGENDUM → BID_SUBMISSION →
BID_CLOSING → TECHNICAL_EVALUATION → FINANCIAL_EVALUATION → FINAL_EVALUATION →
APPROVAL → LOA_ISSUED → CONTRACT_GENERATED → AWARDED → CLOSED.
Rejection/rework path: INTERNAL_APPROVAL can return to DRAFT.
Bid evaluation includes automatic L1/L2/L3 ranking based on financial amount.
Award sets `tenders.awarded_bid_id` (FK to the winning bid) — this is the
field Module 4 (Contracts) depends on per D14.
**Rationale:** The original plan specified a simplified 4-state placeholder
(Draft → Published → Under Evaluation → Awarded) before the actual RFP
scope for Tendering & Bid Evaluation was reviewed in detail. The 14-stage
version was built deliberately, matches the RFP's tender/evaluation
requirements more precisely, and is verified working end to end — this
supersedes the earlier 4-state description in the Phase 2 handbooks.
**Do NOT:** revert to the 4-state model, or design Contract/Work Order logic
against anything other than the real 14-stage status list above.

### D16. A module never writes to another module's tables, even for "sync" purposes

**Decision:** Each module's service layer only reads and writes its own
tables. If one module's data needs to react to a change in another
module (e.g. a DPR status responding to a project stage change), that
integration is a deliberate, reviewed decision — not something a module
owner adds unilaterally inside their own service file.
**Rationale:** An earlier Phase 2 change added logic inside
`services/projects.py` (Project Configuration's file) that directly
imported and force-updated `DPR` records whenever a project's
`lifecycle_stage` changed — bypassing the actual SMFCL/Ministry review
chain required by the RFP (section 4.6.1: "configurable multi-level
routing... with a complete audit trail of submissions, approvals and
rejections"). This was caught and removed before merge, but the pattern
is worth naming explicitly so it isn't reintroduced by a different module.
**Do NOT:** import another module's models into your service file to
"keep them in sync." If a real cross-module trigger is needed, it goes
through the Integration Lead as a reviewed, explicit design decision —
not a side effect buried in an unrelated update function.

### D17. Phase 2 activity is not gated behind Phase 1 DPR completion — deliberately

**Decision:** Clearances and Tenders can be created and progressed for a
project regardless of that project's DPR status (DRAFT, SUBMITTED, or
even before a DPR exists at all). There is no validation in
`clearance_service.py` or `tender_service.py` requiring
`project.dpr.status == "APPROVED"` or `"FUNDS_RELEASED"` before Phase 2
work can begin.
**Rationale:** In real infrastructure project delivery, land/statutory
clearances and tender preparation legitimately start in parallel with
DPR review, not strictly after it — clearances in particular often take
months and starting them only after DPR approval would make the overall
timeline slower and less realistic, not more correct. Confirmed via live
testing (regression suite, Part C) that the system currently allows this
today; this entry formalizes it as an intentional choice rather than
leaving it as an undocumented gap.
**Do NOT:** silently add a cross-phase gate to "fix" this without a
deliberate decision to do so. If a future requirement genuinely needs
DPR approval as a hard prerequisite for Phase 2 activity, that's a new
decision to make explicitly (and would need client/RFP confirmation
first, since the RFP's own phase description doesn't mandate strict
sequential gating either) — not something to infer from this gap and
build unprompted.

### D18. react-router-dom pinned at 7.18.1 despite one known CVE — accepted risk

**Decision:** Stay on react-router-dom@7.18.1. Do not downgrade to "fix"
GHSA-qwww-vcr4-c8h2 (RSC-mode CSRF bypass).
**Rationale:** Every version from 6.0.0 through 8.2.0 has known CVEs.
7.18.1 has exactly one (RSC-mode CSRF), and this app uses plain
client-side routing — no React Server Components anywhere in this
codebase — so that specific vulnerability's attack surface doesn't
apply here. Downgrading to 7.11.0 was tried and reverted: it traded one
inapplicable CVE for 14 others, including open redirect and XSS issues
that ARE applicable to a client-side app. No version in the current
release range is genuinely clean.
**Do NOT:** downgrade this package to silence npm audit without checking
whether the newly-exposed CVEs are actually worse. Re-evaluate once
react-router-dom releases a version above 8.2.0, or if this app ever
adopts RSC mode (unlikely for this project's architecture).

### D19. DPR/Tender/Contract routing stages are hardcoded, not admin-configurable

**Decision:** The approval routing stages for DPR (8 states), Tender (14
stages), and Contract (4 states) are fixed in Python code
(services/*.py transition matrices), not stored as editable data an
admin can reconfigure through a UI.
**Rationale:** RFP 4.6.1 asks for "configurable" multi-level routing.
Building a genuine admin-configurable workflow engine (define stages,
store as data, execute dynamically) is a substantial feature — an
entirely different architecture from the explicit state machines this
MVP was built and verified against. Given the timeline, hardcoded but
correct and fully audited state machines were the right tradeoff for
proving the workflow works, over a flexible-but-unverified generic
engine.
**Do NOT:** silently build partial configurability (e.g. one config
flag) without a full design — that risks a half-working middle ground
that's worse than either extreme. If real configurability becomes a
requirement, it's a new phase of work, scoped and reviewed like any
other decision, not squeezed in ad hoc.

---

## Adding a new decision

If a human makes a new locked decision mid-build, add it here in the same
`Decision / Rationale / Do NOT` format — don't let it live only in chat
history where the next agent session won't see it.