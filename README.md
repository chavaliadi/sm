# Sagarmala 2.0 Portal — Project Scaffold

Full-stack skeleton: FastAPI backend + Vite/React/TypeScript frontend. No
business logic yet — this is Day 1–2 setup per the project plan. RBAC is the
first real module built on top of this.

## Verified working (see below for how to reproduce)

**Backend**
- [x] `uvicorn` starts
- [x] Swagger loads at `/docs`
- [x] `GET /health` returns `200 {"status": "ok"}`
- [x] CORS allows `http://localhost:5173`

**Frontend**
- [x] `npm install` succeeds
- [x] `npm run dev` succeeds
- [x] `npm run build` succeeds (includes a full TypeScript typecheck)
- [x] React loads without errors

**Integration**
- [x] Frontend successfully calls `GET /health` (see `HomePage.tsx` — shows a
      green "connected" status when both servers are running)

## Quick start (both halves)

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

```bash
# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 — you should see "Project scaffold running" with
a green connected health check.

## What's deliberately not here yet

- Database isn't provisioned or migrated (no models exist yet to migrate)
- No auth/RBAC (first real module — see the project plan)
- No shadcn/ui components installed (config is ready; `ui.shadcn.com` wasn't
  reachable from the sandbox this was built in, so run `npx shadcn add
  <component>` yourself once you're on a normal connection — see
  `frontend/README.md`)
- Repository layer intentionally omitted on the backend — this project uses
  Route → Service → SQLModel Session, not Route → Service → Repository → DB
  (see the project plan for why)

## Folder structure

```
SagarMala/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── db/
│   │   └── main.py
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/ui/
    │   ├── features/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── lib/
    │   ├── pages/
    │   ├── routes/
    │   ├── types/
    │   └── utils/
    ├── components.json
    ├── .env.example
    └── README.md
```
