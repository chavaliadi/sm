# PROJECT_RULES.md

**Read this before writing any code.** This file exists so an AI coding agent
(or a junior dev pasting context into one) has the actual scope in front of
it — not the full RFP, not assumptions, not "what would a government portal
usually need." If something you're about to build isn't in this file, stop
and ask a human before proceeding.

---

## 1. What this project is

Sagarmala 2.0 Portal MVP. The real RFP describes a large, multi-year system
(26+ modules, mobile apps, satellite/drone integration, PFMS integration,
cloud deployment) built by a full vendor team over 6+ months.

**We are building a focused, working slice of it, phase by phase — not the
whole thing at once.**

- **Phase 1 (Appraisal & Sanction) is complete.** Tagged `phase1-mvp-complete`
  on `main`. All 6 modules below are built, live-verified end-to-end
  (including per-role permission enforcement), and demo-ready.
- **Phase 2 (Pre-Construction) is now in progress.** Full detail in
  `Sagarmala_Phase2_PreConstruction_Module_Assignment.docx` and the 5
  Phase 2 team handbooks in `docs/team/`. This covers what happens after a
  DPR is approved and before construction begins: land/statutory
  clearances, the tender process, and contractor onboarding/contracting.

If you are an AI agent and a prompt asks you to implement something from the
RFP that isn't in Section 2 or Section 2b below, **do not implement it** —
flag that it's out of scope and ask for confirmation first.

---

## 2. Phase 1 — the 6 modules already built (complete, tagged, do not redo)

| # | Module | Owner |
|---|---|---|
| 1 | Admin & Access Control (RBAC) | Adithya (Lead) |
| 2 | Project Configuration & Lifecycle | Pragnya |
| 3 | DPR Submission & Approval Workflow | Shashank |
| 4 | Task Management | Jayanth |
| 5 | Stakeholder & Meeting Management | Kavya |
| 6 | Dashboard / MIS | Adithya (Lead) |

Plus: Login page, route guards, and `seed.py` (master demo data script).
All of the above are merged into `develop` and `main`. Building on top of
them is fine (Phase 2's Dashboard KPI additions, new permission strings,
etc.) — rebuilding them from scratch is not.

## 2b. Phase 2 — the 4 modules currently being built

| # | Module | Owner |
|---|---|---|
| 1 | Land Acquisition & Statutory Clearances | Pragnya |
| 2 | Tendering & Bid Management | Shashank |
| 3 | Contractor Onboarding & Registration | Kavya |
| 4 | Contract & Work Order Management | Jayanth |

**Integration Lead this sprint: Adithya.** No feature module of his own —
full attention on cross-cutting integration (Dashboard KPI additions, RBAC
permission additions, router registration, one batched Alembic migration
for all 4 modules, `seed.py` updates, PR review, final integration). See
`DECISION_RULES.md` D13 for the frozen-files rule this implies.

**Explicit dependency:** Module 4 (Contracts) depends on Module 2's
(Tendering) `tender_id`/award-payload output. This must be agreed at the
Phase 2 Day 1 schema freeze — see `DECISION_RULES.md` D14.

---

## 3. Explicitly out of scope — do not build, even if asked casually

- Pre-Investment Appraisal & Feasibility (not part of either phase built so far)
- Risk Monitoring, risk/issue logging (Phase 3 — Construction)
- Progress tracking (physical/financial), fund release by construction
  milestone (Phase 3 — Construction; not to be confused with Phase 1's
  DPR fund-release step, which is already built and stays as-is)
- Contract execution/progress tracking against milestones — Phase 2's
  Contract module defines milestone *terms* only, not progress tracking
  against them (that's Phase 3)
- Contractor performance history — explicitly a Phase 3 placeholder;
  Phase 2's Contractor module must not stub this out, just leave it absent
- PFMS Integration, Grievance Management, Project Closure, PMC/EPC Performance
- Satellite Imagery, Drone Media Management, Mobile Apps (Android/iOS)
- AI-Powered Knowledge Assistant Chatbot
- Cloud deployment, DR, high-availability setup
- Phase 3 (Construction) and Phase 4 (Post-Construction) in full — Phase 2
  (Pre-Construction) is the current boundary, not the RFP's full lifecycle
- Any module or field not listed in Section 2, Section 2b, or `DECISION_RULES.md`

If a human explicitly asks for one of these, that's an override — otherwise
treat this list as a hard boundary.

---

## 4. Tech stack (do not substitute or "improve" without asking)

**Backend:** FastAPI, SQLModel + SQLAlchemy, Alembic, PostgreSQL, JWT auth,
Pydantic (via pydantic-settings for config).

**Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React
Router, Axios, React Hook Form + Zod.

**Not installed, don't add without asking:** TanStack Query, any state
management library (Redux/Zustand/etc.), any CSS-in-JS library, any second
HTTP client, any second ORM, any testing framework (Playwright, Jest, etc.)
without an explicit decision to add one.

---

## 5. Folder structure (canonical — don't restructure)

```
backend/app/
├── api/         → route handlers (thin)
├── core/        → config/settings
├── models/      → SQLModel tables
├── schemas/     → Pydantic request/response schemas
├── services/    → business logic + DB queries (see DECISION_RULES.md — no repositories/)
├── db/          → engine/session
└── main.py

frontend/src/
├── api/         → axios client + one function per endpoint
├── components/ui/ → shadcn/ui components
├── features/    → one folder per module
├── hooks/, layouts/, lib/, pages/, routes/, types/, utils/
```

Each backend module owns its own tables/routes/services exclusively. Each
frontend module owns its own `features/<module>/` folder. Don't create files
outside your assigned module's folders unless the task is explicitly
cross-module integration work — and in Phase 2, cross-module/shared-file
edits are the Integration Lead's job specifically (D13), not each module
owner's.

---

## 6. Where to find more detail

- Phase 1 architecture, data model, API contract, timeline: the master
  project plan (`Sagarmala2_MVP_Project_Plan.md`)
- Phase 2 module breakdown, effort estimates, sprint timeline:
  `Sagarmala_Phase2_PreConstruction_Module_Assignment.docx`
- Locked technical decisions an agent must not silently revisit: `DECISION_RULES.md`
- Coding conventions and agent behavior expectations: `DEVELOPMENT_RULES.md`
- Your specific module's workflow: your individual team handbook file in `docs/team/`