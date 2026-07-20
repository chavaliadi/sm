# Kavya — Stakeholder & Meeting CRUD + Integration Owner — Work Spec

**Module:** Stakeholder & Meeting Management  
**Branch:** `feature/stakeholders-meetings`  
**Files you own:**
- `backend/app/schemas/stakeholder.py`
- `backend/app/services/stakeholders.py`
- `backend/app/api/stakeholders.py`
- `backend/seed.py` (Integration Owner responsibility)

**Do NOT touch:** `alembic/`, `backend/app/models/stakeholder.py` (model is already done), any other module's files.

---

## Current State

- ✅ Model exists: `backend/app/models/stakeholder.py` — `Stakeholder` + `Meeting` tables
- ✅ Schema exists: `backend/app/schemas/stakeholder.py` — only `StakeholderRead` + `MeetingRead`
- ✅ API stub: `backend/app/api/stakeholders.py` — only `GET /stakeholders` + `GET /stakeholders/meetings`
- ✅ Service stub: `backend/app/services/stakeholders.py` — only `list_stakeholders()` + `list_meetings()`
- ❌ Missing: Create, Retrieve single, Update, Delete for both entities, RBAC, seed.py

---

## Part A: Stakeholder & Meeting CRUD

### Task 1: Add Create & Update Schemas

**File:** `backend/app/schemas/stakeholder.py`

Add these schemas alongside the existing Read schemas:

```python
class StakeholderCreate(SQLModel):
    project_id: int         # REQUIRED — FK to projects.id
    name: str               # REQUIRED
    organization: str       # REQUIRED
    role: str               # REQUIRED (e.g., "Director", "Engineer", "Consultant")
    contact_info: Optional[str] = None


class StakeholderUpdate(SQLModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    contact_info: Optional[str] = None


class MeetingCreate(SQLModel):
    project_id: int         # REQUIRED — FK to projects.id
    title: str              # REQUIRED
    date: datetime          # REQUIRED
    notes: Optional[str] = None


class MeetingUpdate(SQLModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
```

---

### Task 2: Implement Full Service Layer

**File:** `backend/app/services/stakeholders.py`

Implement these functions:

```python
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.stakeholder import Stakeholder, Meeting
from app.models.project import Project


# ── Stakeholder CRUD ──────────────────────────────────────────

def list_stakeholders(
    session: Session,
    project_id: Optional[int] = None,
) -> list[Stakeholder]:
    """List all active stakeholders, optionally filtered by project."""


def get_stakeholder(session: Session, stakeholder_id: int) -> Stakeholder:
    """Get single stakeholder. Raise 404 if not found or not active."""


def create_stakeholder(session: Session, data) -> Stakeholder:
    """
    Create a stakeholder.
    - Validate project_id exists and is active (raise 404 if not)
    """


def update_stakeholder(session: Session, stakeholder_id: int, data) -> Stakeholder:
    """Update stakeholder. Only update non-None fields. Raise 404 if missing."""


def delete_stakeholder(session: Session, stakeholder_id: int) -> tuple[bool, str]:
    """Soft-delete: set is_active = False."""


# ── Meeting CRUD ──────────────────────────────────────────────

def list_meetings(
    session: Session,
    project_id: Optional[int] = None,
) -> list[Meeting]:
    """List all active meetings, optionally filtered by project. Order by date desc."""


def get_meeting(session: Session, meeting_id: int) -> Meeting:
    """Get single meeting. Raise 404 if not found or not active."""


def create_meeting(session: Session, data) -> Meeting:
    """
    Create a meeting.
    - Validate project_id exists and is active (raise 404 if not)
    """


def update_meeting(session: Session, meeting_id: int, data) -> Meeting:
    """Update meeting. Only update non-None fields. Raise 404 if missing."""


def delete_meeting(session: Session, meeting_id: int) -> tuple[bool, str]:
    """Soft-delete: set is_active = False."""
```

---

### Task 3: Implement Full API Routes

**File:** `backend/app/api/stakeholders.py`

Replace the current stub with full CRUD for BOTH entities:

**Stakeholder routes:**
```
POST   /stakeholders              → create (requires MANAGE_STAKEHOLDERS)
GET    /stakeholders              → list, filter by ?project_id (requires VIEW_STAKEHOLDERS)
GET    /stakeholders/{id}         → retrieve one (requires VIEW_STAKEHOLDERS)
PUT    /stakeholders/{id}         → update (requires MANAGE_STAKEHOLDERS)
DELETE /stakeholders/{id}         → soft-delete (requires MANAGE_STAKEHOLDERS)
```

**Meeting routes:**
```
POST   /meetings                  → create (requires MANAGE_STAKEHOLDERS)
GET    /meetings                  → list, filter by ?project_id (requires VIEW_STAKEHOLDERS)
GET    /meetings/{id}             → retrieve one (requires VIEW_STAKEHOLDERS)
PUT    /meetings/{id}             → update (requires MANAGE_STAKEHOLDERS)
DELETE /meetings/{id}             → soft-delete (requires MANAGE_STAKEHOLDERS)
```

**Important:** Meetings should get their OWN router, separate from stakeholders:

```python
router = APIRouter(prefix="/stakeholders", tags=["Stakeholder Management"])
meetings_router = APIRouter(prefix="/meetings", tags=["Meeting Management"])
```

Then register `meetings_router` in `backend/app/main.py` alongside the stakeholders router.

**Key patterns to follow (look at `backend/app/api/dpr.py` as reference):**

1. Use `dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))]`
2. Use `dependencies=[Depends(require_permission("VIEW_STAKEHOLDERS"))]`
3. All responses use `SuccessResponse` or `PaginatedResponse`
4. POST returns `status_code=status.HTTP_201_CREATED`

**Imports you'll need:**
```python
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
```

---

## Part B: Integration Owner — Seed Script

### Task 4: Create `seed.py`

**File:** `backend/seed.py`

Create a single script that populates the database with demo data. **Must be idempotent** (safe to run multiple times).

```python
"""
Demo Data Seed Script — run with: PYTHONPATH=. python seed.py
Creates a complete demo-ready database state.
"""

# What to seed:

# 1. Users (6 total) — use bootstrap_rbac.py's pattern
#    - 1 Admin (already created by bootstrap_rbac.py)
#    - 2 Port Authority users
#    - 2 SMFCL users  
#    - 1 Ministry user
#    Password for all demo users: "password123"

# 2. Projects (8 total) — different categories and stages
#    Categories: "Port Modernization", "Coastal Development", 
#                "Maritime Connectivity", "Shipbuilding"
#    States: "Maharashtra", "Gujarat", "Tamil Nadu", "Kerala", 
#            "Andhra Pradesh", "Karnataka", "Odisha", "West Bengal"
#    Ports: "Mumbai Port", "Kandla Port", "Chennai Port", "Kochi Port",
#           "Visakhapatnam Port", "Mangalore Port", "Paradip Port", "Kolkata Port"

# 3. DPRs (15 total) — across ALL states in the state machine
#    Use the DPR service functions to create them properly:
#    - 2 in DRAFT
#    - 2 in SMFCL_REVIEW  
#    - 1 REJECTED_BY_SMFCL
#    - 3 FORWARDED_TO_MINISTRY
#    - 1 REJECTED_BY_MINISTRY
#    - 3 APPROVED
#    - 3 FUNDS_RELEASED
#    Each DPR should go through proper state transitions (not directly inserted)
#    so that the audit trail is populated correctly.

# 4. Tasks (40 total) — mixed statuses and priorities
#    - Spread across projects
#    - Mix of TODO, IN_PROGRESS, DONE
#    - Mix of LOW, MEDIUM, HIGH priority
#    - Some assigned, some unassigned
#    - Some with past due_dates (to show overdue)

# 5. Stakeholders (10 total)
#    - 1-2 per project
#    - Mix of organizations

# 6. Meetings (10 total)
#    - 1-2 per project
#    - Some past, some future dates
#    - With notes

# 7. Notifications (handful)
#    - Created automatically by DPR transitions above
```

**How to create DPRs in proper states with audit trails:**

```python
from app.services.dpr import create_dpr, submit_dpr, smfcl_review, ministry_review, release_funds

# Example: Create a FUNDS_RELEASED DPR (goes through full flow)
dpr = create_dpr(session, project_id=1, actor_id=port_authority_user.id)
dpr = submit_dpr(session, dpr.id, actor_id=port_authority_user.id)
dpr = smfcl_review(session, dpr.id, actor_id=smfcl_user.id, decision="approve", comment="Looks good")
dpr = ministry_review(session, dpr.id, actor_id=ministry_user.id, decision="approve", comment="Approved")
dpr = release_funds(session, dpr.id, actor_id=smfcl_user.id, comment="Funds disbursed")

# Example: Create a REJECTED_BY_SMFCL DPR
dpr = create_dpr(session, project_id=2, actor_id=port_authority_user.id)
dpr = submit_dpr(session, dpr.id, actor_id=port_authority_user.id)
dpr = smfcl_review(session, dpr.id, actor_id=smfcl_user.id, decision="reject", comment="Cost estimates need revision")
```

---

## Part C: Smoke Testing (after all modules land)

### Task 5: End-to-end smoke test

After all PRs are merged into `develop`, verify:

- [ ] `seed.py` runs on a clean database without errors
- [ ] All `GET` list endpoints return proper paginated responses
- [ ] All `POST` endpoints create records correctly
- [ ] All `PUT` endpoints update records correctly  
- [ ] All `DELETE` endpoints soft-delete correctly
- [ ] DPR full workflow: DRAFT → SUBMITTED → SMFCL_REVIEW → FORWARDED_TO_MINISTRY → APPROVED → FUNDS_RELEASED
- [ ] DPR reject path 1: SMFCL rejects → Port Authority resubmits → version increments
- [ ] DPR reject path 2: Ministry rejects → SMFCL re-reviews
- [ ] All routes return 401 without auth token
- [ ] Write routes return 403 without proper permission
- [ ] Dashboard shows correct counts from real data

---

## Testing Checklist (your module)

- [ ] `POST /stakeholders` with valid data → 201
- [ ] `POST /stakeholders` with invalid project_id → 404
- [ ] `GET /stakeholders?project_id=1` → filtered results
- [ ] `GET /stakeholders/{id}` → single stakeholder
- [ ] `PUT /stakeholders/{id}` → updates correctly
- [ ] `DELETE /stakeholders/{id}` → soft-delete
- [ ] `POST /meetings` with valid data → 201
- [ ] `GET /meetings?project_id=1` → filtered results
- [ ] `GET /meetings/{id}` → single meeting
- [ ] `PUT /meetings/{id}` → updates correctly
- [ ] `DELETE /meetings/{id}` → soft-delete
- [ ] All routes return 401/403 without proper auth
