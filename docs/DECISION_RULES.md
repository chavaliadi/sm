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

### D3. Notifications are backend-only for this MVP

**Decision:** `notifications` table + `create_notification()` service
function + `GET /notifications` endpoint. No inbox/bell UI.
**Rationale:** Having the plumbing means the UI is a pure frontend task
later, not a schema change. Building UI for it now is unscoped work.
**Do NOT:** build a notification bell, toast system, or inbox page unless
explicitly asked.

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

### D6. Dashboard: one bar chart, one pie chart — no more

**Decision:** Dashboard shows cards + a table + exactly one bar chart + one
pie chart.
**Rationale:** Government clients care about readability, not chart variety.
More charts is more surface area for bugs with no demo payoff.
**Do NOT:** add additional chart types or a new charting library without
being asked.

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
style for a new endpoint — match this exactly.

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
there.

### D9. Git flow: `main ← develop ← feature/*`

**Decision:** Nobody merges directly into `main`. Feature branches merge into
`develop`; `develop` merges into `main` only at integration checkpoints.
**Rationale:** Keeps `main` release-ready at all times.
**Do NOT:** commit or open a PR directly against `main`.

### D10. TypeScript, strict-ish

**Decision:** Frontend is TypeScript, not JavaScript. Shared types live in
`src/types/`, mirroring backend Pydantic schemas field-for-field.
**Rationale:** When a backend field name changes, every page using that type
gets a compile error immediately instead of a silent runtime failure
discovered during the demo.
**Do NOT:** use `any` to silence a type error — fix the actual mismatch, or
ask if the shared type needs updating (and update it in `src/types/`, not
just locally in one file).

### D11. Error raising convention

**Decision:** Always raise `HTTPException(status_code=..., detail={"code": "SOME_CODE", "message": "...", "field": None})` when raising errors explicitly. Never pass a bare string to `detail`.
**Rationale:** The global exception handler in `main.py` formats all validation and HTTP exceptions to the standard D7 error envelope. Passing a dict allows setting explicit, domain-specific error codes (like `INVALID_STATE_TRANSITION`) instead of defaulting to generic ones (like `BAD_REQUEST`).
**Do NOT:** raise `HTTPException(status_code=..., detail="bare string message")` or construct arbitrary custom error responses.

### D12. API routes return `*Read` schemas, never raw SQLModel objects

**Decision:** Every route returns a Pydantic `*Read` schema (`UserRead`, `ProjectRead`, etc.), never the raw SQLModel table object.
**Rationale:** `User` includes `password_hash`. If a route ever returns the raw model instead of a schema that explicitly excludes it, the hash leaks to the browser — this makes that a type/schema mismatch instead of something that depends on someone remembering not to do it.
**Do NOT:** return a raw SQLModel object from any route. Always construct the `*Read` schema explicitly.

---

## Adding a new decision

If a human makes a new locked decision mid-build, add it here in the same
`Decision / Rationale / Do NOT` format — don't let it live only in chat
history where the next agent session won't see it.
