# Sagarmala 2.0 Portal — Backend

FastAPI backend for the MVP. Scaffold only — no business logic yet; RBAC is
the first real module to be built on top of this (see the project plan).

## Structure

```
app/
├── api/         → FastAPI route handlers (thin — request/response only)
├── core/        → settings/config (app/core/config.py)
├── models/      → SQLModel table definitions
├── schemas/     → Pydantic request/response schemas
├── services/    → business logic + DB queries (no separate repository layer —
│                   see the project plan for why)
├── db/          → engine + session dependency (app/db/session.py)
└── main.py      → FastAPI app entrypoint
alembic/         → migrations (only the team lead runs `alembic revision`)
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit DATABASE_URL etc.
```

## Run

```bash
uvicorn app.main:app --reload
```

- API root: http://localhost:8000/
- Health check: http://localhost:8000/health
- Swagger docs: http://localhost:8000/docs

## Migrations

Once real models exist under `app/models/`, import them in `alembic/env.py`
(see the commented-out line there), then:

```bash
alembic revision --autogenerate -m "add <table>"
alembic upgrade head
```

Per the project plan: only one person on the team runs these two commands,
to avoid migration-chain conflicts when multiple people edit models in
parallel branches.
