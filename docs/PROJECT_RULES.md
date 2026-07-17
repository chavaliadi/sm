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

**We are building none of that.** We are building a focused, working slice —
Phase 1 (Appraisal & Sanction) only — in 15–20 days, with a 5-person team of
mixed beginner/intermediate developers, to demonstrate the core workflow and
win the right to continue.

If you are an AI agent and a prompt asks you to implement something from the
RFP that isn't in Section 2 below, **do not implement it** — flag that it's
out of scope and ask for confirmation first.

---

## 2. The 6 modules we are building — nothing else

| # | Module | Owner |
|---|---|---|
| 1 | Admin & Access Control (RBAC) | Adithya (Lead) |
| 2 | Project Configuration & Lifecycle | Pragnya |
| 3 | DPR Submission & Approval Workflow | Shashank |
| 4 | Task Management | Jayanth |
| 5 | Stakeholder & Meeting Management | Kavya (Integration Owner) |
| 6 | Dashboard / MIS | Adithya (Lead) |

## 3. Explicitly out of scope — do not build, even if asked casually

- Pre-Investment Appraisal & Feasibility, Tendering & Bid Evaluation, Risk Monitoring
- Fund Release as its own system (it's just a status + a field inside DPR, not a module)
- PFMS Integration, Grievance Management, Project Closure, PMC/EPC Performance
- Satellite Imagery, Drone Media Management, Mobile Apps (Android/iOS)
- AI-Powered Knowledge Assistant Chatbot
- Cloud deployment, DR, high-availability setup
- Phases 2–4 of the project lifecycle (pre-construction, construction, post-construction)
- Any module or field not listed in Section 2 or in `DECISION_RULES.md`

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
HTTP client, any second ORM.

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
cross-module integration work.

---

## 6. Where to find more detail

- Full architecture, data model, API contract, timeline: the master project
  plan (`Sagarmala2_MVP_Project_Plan.md`)
- Locked technical decisions an agent must not silently revisit: `DECISION_RULES.md`
- Coding conventions and agent behavior expectations: `DEVELOPMENT_RULES.md`
- Your specific module's workflow: your individual team handbook file
