# Jayanth — Task Management CRUD — Work Spec

**Module:** Task Management  
**Branch:** `feature/task-management`  
**Files you own:**
- `backend/app/schemas/task.py`
- `backend/app/services/tasks.py`
- `backend/app/api/tasks.py`

**Do NOT touch:** `alembic/`, `backend/app/models/task.py` (model is already done), any other module's files.

---

## Current State

- ✅ Model exists: `backend/app/models/task.py` — `Task` table with all fields
- ✅ Schema exists: `backend/app/schemas/task.py` — only `TaskRead` (output schema)
- ✅ API stub: `backend/app/api/tasks.py` — only `GET /tasks` (list)
- ✅ Service stub: `backend/app/services/tasks.py` — only `list_tasks()`
- ❌ Missing: Create, Retrieve single, Update, Status patch, Delete, RBAC, Filtering

---

## Task 1: Add Create, Update, and Status Schemas

**File:** `backend/app/schemas/task.py`

Add these schemas alongside the existing `TaskRead`:

```python
from enum import Enum

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class TaskCreate(SQLModel):
    project_id: int             # REQUIRED — FK to projects.id
    title: str                  # REQUIRED
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM   # defaults to MEDIUM
    assigned_to: Optional[int] = None              # FK to users.id (nullable)
    due_date: Optional[datetime] = None


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None


class TaskStatusUpdate(SQLModel):
    status: TaskStatus          # REQUIRED — TODO, IN_PROGRESS, or DONE
```

Also update `TaskRead` to add computed overdue field:

```python
class TaskRead(SQLModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    is_overdue: bool = False    # computed: True if due_date < now AND status != DONE
```

---

## Task 2: Implement Full Service Layer

**File:** `backend/app/services/tasks.py`

Implement these functions:

```python
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.task import Task
from app.models.project import Project


def list_tasks(
    session: Session,
    project_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    task_status: Optional[str] = None,
) -> list[Task]:
    """
    List all active tasks with optional filters.
    - Filter by project_id, assigned_to, status (exact match)
    - Always filter is_active == True
    - Order by due_date ascending (NULLs last), then created_at descending
    """


def get_task(session: Session, task_id: int) -> Task:
    """
    Get a single task by ID.
    Raise HTTP 404 if not found or not active.
    """


def create_task(session: Session, data, actor_id: Optional[int] = None) -> Task:
    """
    Create a new task.
    - Validate project_id exists and is active (raise 404 if not)
    - Set status = "TODO" if not provided
    - Set priority = "MEDIUM" if not provided
    """


def update_task(session: Session, task_id: int, data) -> Task:
    """
    Update a task. Only update fields that are not None in the input.
    - Raise HTTP 404 if not found or not active
    """


def update_task_status(session: Session, task_id: int, new_status: str) -> Task:
    """
    Quick status change endpoint.
    - Only update the status field
    - Validate new_status is one of: TODO, IN_PROGRESS, DONE
    - Raise HTTP 404 if not found or not active
    """


def delete_task(session: Session, task_id: int) -> tuple[bool, str]:
    """
    Soft-delete: set is_active = False.
    - Return (False, "Task not found") if missing
    - Return (True, "Task deleted successfully") on success
    """
```

**Important:** Also expose a helper for cross-module integration:

```python
def create_task_for_dpr(session: Session, project_id: int, title: str, description: str) -> Task:
    """
    Called by Shashank's DPR service when a DPR is approved.
    Creates a task without requiring auth context.
    """
    task = Task(
        project_id=project_id,
        title=title,
        description=description,
        priority="HIGH",
        status="TODO",
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

---

## Task 3: Implement Full API Routes

**File:** `backend/app/api/tasks.py`

Replace the current stub with full CRUD + status patch:

```
POST   /tasks                → create (requires MANAGE_TASKS permission)
GET    /tasks                → list with filters (requires VIEW_TASKS permission)
GET    /tasks/{id}           → retrieve one (requires VIEW_TASKS permission)
PUT    /tasks/{id}           → full update (requires MANAGE_TASKS permission)
PATCH  /tasks/{id}/status    → quick status change (requires MANAGE_TASKS permission)
DELETE /tasks/{id}           → soft-delete (requires MANAGE_TASKS permission)
```

**Key patterns to follow (look at `backend/app/api/dpr.py` as reference):**

1. Use `dependencies=[Depends(require_permission("MANAGE_TASKS"))]` for write routes
2. Use `dependencies=[Depends(require_permission("VIEW_TASKS"))]` for read routes
3. All responses use `SuccessResponse[TaskRead]` or `PaginatedResponse[TaskRead]`
4. POST returns `status_code=status.HTTP_201_CREATED`

**Imports you'll need:**
```python
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
```

**Query params for GET /tasks:**
```python
@router.get("")
def get_tasks(
    project_id: Optional[int] = Query(None),
    assigned_to: Optional[int] = Query(None),
    status: Optional[str] = Query(None, alias="status"),
    session: Session = Depends(get_session),
):
```

**PATCH route for status:**
```python
@router.patch("/{id}/status")
def update_task_status(
    id: int,
    body: TaskStatusUpdate,
    session: Session = Depends(get_session),
):
```

---

## Computing `is_overdue`

When building the list/retrieve responses, compute `is_overdue` before returning:

```python
from datetime import datetime

def _enrich_task(task: Task) -> dict:
    """Add computed is_overdue field to a task."""
    data = TaskRead.model_validate(task).model_dump()
    if task.due_date and task.due_date < datetime.utcnow() and task.status != "DONE":
        data["is_overdue"] = True
    return data
```

---

## Validation Rules

- `priority` must be one of: `LOW`, `MEDIUM`, `HIGH`
- `status` must be one of: `TODO`, `IN_PROGRESS`, `DONE`
- `project_id` must reference an existing active project
- `assigned_to` references `users.id` — nullable (unassigned tasks are valid)
- Soft-delete sets `is_active = False` — never hard delete
- All list queries filter `WHERE is_active = True`

---

## Testing Checklist

- [ ] `POST /tasks` with valid data → 201 + task returned with status=TODO
- [ ] `POST /tasks` with invalid project_id → 404
- [ ] `GET /tasks` → paginated list, only active tasks
- [ ] `GET /tasks?project_id=1` → filtered by project
- [ ] `GET /tasks?assigned_to=2` → filtered by assignee
- [ ] `GET /tasks?status=TODO` → filtered by status
- [ ] `GET /tasks/{id}` → single task
- [ ] `PUT /tasks/{id}` with partial data → only those fields updated
- [ ] `PATCH /tasks/{id}/status` with `{"status": "IN_PROGRESS"}` → status updated
- [ ] `PATCH /tasks/{id}/status` with `{"status": "INVALID"}` → 422 validation error
- [ ] `DELETE /tasks/{id}` → is_active set to False
- [ ] Task with past `due_date` and status != DONE → `is_overdue: true`
- [ ] All routes return 401 without auth token
- [ ] Write routes return 403 without MANAGE_TASKS permission
