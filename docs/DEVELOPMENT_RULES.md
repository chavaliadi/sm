# DEVELOPMENT_RULES.md

Conventions and behavior expectations for anyone — human or AI agent —
writing code in this repo. `PROJECT_RULES.md` says *what* to build;
`DECISION_RULES.md` says *what's already decided*; this file says *how* to
actually write it day to day.

---

## 1. Branching

- Branch name: `feature/<module-name>` (e.g. `feature/dpr-workflow`,
  `feature/task-management`).
- Branch from `develop`, not `main`.
- Rebase/pull `develop` into your branch at the **start** of every work
  cycle, not just before opening a PR.
- PR target is `develop`, never `main`.

## 2. Commit messages

Short, plain, present tense: `add dpr submit endpoint`, `fix task filter by
status`. No need for a strict conventional-commits format for this project —
clarity over ceremony.

## 3. Where new code goes

- Stay inside your module's own files. `backend/app/api/`, `services/`,
  `models/`, `schemas/` all group by module (e.g. a `dpr.py` in each), and a
  junior/agent working on Task Management should not be editing DPR files.
- Same on the frontend: work inside your `features/<module>/` folder. Shared
  things (`components/ui/`, `layouts/`, `lib/utils.ts`) are consumed, not
  edited, unless the task is explicitly about the shared layer.
- Cross-module integration (e.g. "DPR approval should update project
  lifecycle_stage") happens during the integration pass, coordinated between
  the two module owners — not built speculatively by one module ahead of
  time.

## 4. Adding a new endpoint

Follow the frozen contract in `DECISION_RULES.md` (D7) exactly:
- Route handler in `api/` — thin, just parses request and calls a service function.
- Business logic and DB queries in `services/` — this is the only layer that
  talks to the database (D1).
- Request/response shapes as Pydantic schemas in `schemas/`.
- Response wrapped in `{ "data": ..., "meta": {} }` (or the paginated/error
  variants) — always, no exceptions, even for a quick internal endpoint.

## 5. Adding a new DB field or table

- Add it to your own module's SQLModel file in `models/`.
- Do not run a migration yourself (D8) — flag it as ready for migration and
  let the Senior/Team Lead generate it.
- Do not add a field to another module's table (e.g. don't add a
  `dpr_status` field to `projects` — that's DPR's data, referenced by
  `project_id`, not duplicated).

## 6. Frontend types

- When you add or change a backend schema field, update the matching
  interface in `src/types/` in the same PR — don't leave frontend types
  stale for someone else to discover later.
- Prefer `interface` for object shapes, `type` for unions/aliases — consistent
  with what's already in `src/types/index.ts`.

## 7. Testing expectations for this MVP

- No requirement for full test coverage — this is a 15–20 day MVP, not a
  production system.
- The one place tests genuinely matter: the DPR state machine (illegal
  transitions must be blocked — e.g. can't approve a DRAFT DPR). Cover this
  with a few focused tests even if nothing else in the project has any.

## 8. What an AI agent should do when uncertain

- If a request isn't covered by `PROJECT_RULES.md` or `DECISION_RULES.md`,
  **stop and ask** — don't infer an answer from "what a system like this
  usually has" or from the original RFP. The RFP describes a much bigger
  system than this MVP; treating it as a source of truth is how scope creep
  happens.
- If a request conflicts with something in `DECISION_RULES.md`, say so
  explicitly rather than silently complying or silently ignoring the
  request.
- Don't add a new dependency (npm package or pip package) without listing it
  and asking first — check `PROJECT_RULES.md` Section 4 for what's already
  approved.

## 9. Explicit "do not" list

- Don't create a `repositories/` folder (D1).
- Don't add `deleted_at` — use `is_active` (D2).
- Don't build UI for notifications (D3).
- Don't add `action_items` to meetings (D4).
- Don't hardcode role checks — use `require_permission()` (D5).
- Don't add extra chart types to the Dashboard (D6).
- Don't invent a different API response/error/pagination shape (D7).
- Don't run Alembic migrations from a feature branch (D8).
- Don't commit directly to `main` (D9).
- Don't use `any` to bypass a TypeScript error (D10).
- Don't implement anything from `PROJECT_RULES.md` Section 3's out-of-scope
  list without an explicit human override.

## 10. Definition of done

Before calling a module "finished," check it against your individual
handbook file's Definition of Done section, and against the master plan's
overall Definition of Done / Demo Script — the sequence that has to work
live, end to end, for the actual client demo.
