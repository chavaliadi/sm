# Pragnya — Project Configuration CRUD — Work Spec

**Module:** Project Configuration & Lifecycle  
**Branch:** `feature/project-configuration`  
**Files you own:**
- `backend/app/schemas/project.py`
- `backend/app/services/projects.py`
- `backend/app/api/projects.py`

**Do NOT touch:** `alembic/`, `backend/app/models/project.py` (model is already done), any other module's files.

---

## Current State

- ✅ Model exists: `backend/app/models/project.py` — `Project` table with all fields
- ✅ Schema exists: `backend/app/schemas/project.py` — only `ProjectRead` (output schema)
- ✅ API stub: `backend/app/api/projects.py` — only `GET /projects` (list)
- ✅ Service stub: `backend/app/services/projects.py` — only `list_projects()`
- ❌ Missing: Create, Retrieve single, Update, Delete, RBAC, Filtering

---

## Task 1: Add Create & Update Schemas

**File:** `backend/app/schemas/project.py`

Add these schemas alongside the existing `ProjectRead`:

```python
class ProjectCreate(SQLModel):
    project_code: str          # REQUIRED, must be unique
    name: str                  # REQUIRED
    category: str              # REQUIRED
    state: str                 # REQUIRED (Indian state name)
    port_name: str             # REQUIRED
    stakeholder_info: Optional[str] = None
    funding_model: str         # REQUIRED (e.g., "PPP", "Government", "Mixed")
    estimated_cost: float      # REQUIRED, must be > 0
    approved_cost: Optional[float] = None


class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    port_name: Optional[str] = None
    stakeholder_info: Optional[str] = None
    funding_model: Optional[str] = None
    estimated_cost: Optional[float] = None
    approved_cost: Optional[float] = None
    lifecycle_stage: Optional[str] = None
```

---

## Task 2: Implement Full Service Layer

**File:** `backend/app/services/projects.py`

Implement these functions:

```python
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.project import Project


def list_projects(
    session: Session,
    category: Optional[str] = None,
    state: Optional[str] = None,
    lifecycle_stage: Optional[str] = None,
    search: Optional[str] = None,
) -> list[Project]:
    """
    List all active projects with optional filters.
    - Filter by category, state, lifecycle_stage (exact match)
    - Search by name (case-insensitive contains)
    - Always filter is_active == True
    - Order by created_at descending
    """


def get_project(session: Session, project_id: int) -> Project:
    """
    Get a single project by ID.
    Raise HTTP 404 if not found or not active.
    """


def create_project(session: Session, data, actor_id: int) -> Project:
    """
    Create a new project.
    - Set lifecycle_stage = "appraisal" always (ignore any input value)
    - Set created_by = actor_id, updated_by = actor_id
    - Check project_code uniqueness — if duplicate, raise HTTP 409:
      detail={"code": "DUPLICATE_PROJECT_CODE", "message": "Project code already exists", "field": "project_code"}
    """


def update_project(session: Session, project_id: int, data, actor_id: int) -> Project:
    """
    Update a project. Only update fields that are not None in the input.
    - Set updated_by = actor_id
    - Set updated_at = datetime.utcnow()
    - Raise HTTP 404 if not found or not active
    - Do NOT allow changing project_code (ignore it if sent)
    """


def delete_project(session: Session, project_id: int) -> tuple[bool, str]:
    """
    Soft-delete: set is_active = False.
    - Raise HTTP 404 if not found or already deleted
    - Return (True, "Project deleted successfully") on success
    """
```

---

## Task 3: Implement Full API Routes

**File:** `backend/app/api/projects.py`

Replace the current stub with full CRUD routes:

```
POST   /projects              → create (requires MANAGE_PROJECTS permission)
GET    /projects              → list with filters (requires VIEW_PROJECTS permission)
GET    /projects/{id}         → retrieve one (requires VIEW_PROJECTS permission)
PUT    /projects/{id}         → update (requires MANAGE_PROJECTS permission)
DELETE /projects/{id}         → soft-delete (requires MANAGE_PROJECTS permission)
```

**Key patterns to follow (look at `backend/app/api/dpr.py` as reference):**

1. Use `dependencies=[Depends(require_permission("MANAGE_PROJECTS"))]` for write routes
2. Use `dependencies=[Depends(require_permission("VIEW_PROJECTS"))]` for read routes
3. Use `current_user: User = Depends(get_current_user)` to get the actor for audit fields
4. All responses use `SuccessResponse[ProjectRead]` or `PaginatedResponse[ProjectRead]`
5. POST returns `status_code=status.HTTP_201_CREATED`
6. Errors use `HTTPException` with `detail={"code": "...", "message": "...", "field": "..."}`

**Imports you'll need:**
```python
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
```

**Query params for GET /projects:**
```python
@router.get("")
def get_projects(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    lifecycle_stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search by project name"),
    session: Session = Depends(get_session),
):
```

---

## Validation Rules

- `project_code` must be unique — return proper error with `"field": "project_code"`
- `estimated_cost` and `approved_cost` must be numbers (Pydantic handles this via type annotation)
- `lifecycle_stage` starts as `"appraisal"` on creation — hardcode this, ignore user input
- Soft-delete sets `is_active = False` — never hard delete
- All list queries filter `WHERE is_active = True`

---

## Testing Checklist (verify these after building)

- [ ] `POST /projects` with valid data → 201 + project returned
- [ ] `POST /projects` with duplicate `project_code` → 409 DUPLICATE_PROJECT_CODE
- [ ] `GET /projects` → paginated list, only active projects
- [ ] `GET /projects?category=Port` → filtered results
- [ ] `GET /projects?search=harbor` → name search works
- [ ] `GET /projects/{id}` → single project
- [ ] `GET /projects/99999` → 404 NOT_FOUND
- [ ] `PUT /projects/{id}` with partial data → only those fields updated
- [ ] `DELETE /projects/{id}` → is_active set to False
- [ ] `DELETE /projects/{id}` again → 404 (already deleted)
- [ ] All routes return 401 without auth token
- [ ] All write routes return 403 without MANAGE_PROJECTS permission
