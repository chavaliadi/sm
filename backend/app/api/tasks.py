from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_current_user, require_permission
from app.db.session import get_session
from app.models.auth import User
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.schemas.task import TaskCreate, TaskRead, TaskStatus, TaskUpdate
from app.services.audit import log_action
from app.services import task as task_service

router = APIRouter(prefix="/tasks", tags=["Task Management"])


@router.get("", response_model=PaginatedResponse[TaskRead])
def get_tasks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    project_id: int | None = Query(default=None),
    assigned_to: int | None = Query(default=None),
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    session: Session = Depends(get_session),
    _: object = Depends(require_permission("VIEW_TASKS")),
):
    tasks, total = task_service.list_tasks(
        session,
        page=page,
        page_size=page_size,
        project_id=project_id,
        assigned_to=assigned_to,
        task_status=task_status,
    )
    return PaginatedResponse(
        data=[TaskRead.model_validate(task) for task in tasks],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post(
    "",
    response_model=SuccessResponse[TaskRead],
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    body: TaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    _: object = Depends(require_permission("MANAGE_TASKS")),
):
    task = task_service.create_task(session, body)
    log_action(
        session,
        user_id=current_user.id,
        action="TASK_CREATED",
        entity_type="Task",
        entity_id=task.id,
        new_value=task.status,
        performed_by=current_user.email,
    )
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.get("/{task_id}", response_model=SuccessResponse[TaskRead])
def get_task(
    task_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(require_permission("VIEW_TASKS")),
):
    task = task_service.get_task(session, task_id)
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.put("/{task_id}", response_model=SuccessResponse[TaskRead])
def update_task(
    task_id: int,
    body: TaskUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    _: object = Depends(require_permission("MANAGE_TASKS")),
):
    existing_task = task_service.get_task(session, task_id)
    old_status = existing_task.status
    task = task_service.update_task(session, task_id, body)
    log_action(
        session,
        user_id=current_user.id,
        action="TASK_STATUS_UPDATED",
        entity_type="Task",
        entity_id=task.id,
        old_value=old_status,
        new_value=task.status,
        performed_by=current_user.email,
    )
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.patch("/{task_id}/status", response_model=SuccessResponse[TaskRead])
def update_task_status(
    task_id: int,
    body: TaskUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    _: object = Depends(require_permission("MANAGE_TASKS")),
):
    if body.status is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATUS",
                "message": "A task status is required",
                "field": "status",
            },
        )
    existing_task = task_service.get_task(session, task_id)
    old_status = existing_task.status
    task = task_service.update_task(session, task_id, body)
    log_action(
        session,
        user_id=current_user.id,
        action="TASK_STATUS_UPDATED",
        entity_type="Task",
        entity_id=task.id,
        old_value=old_status,
        new_value=task.status,
        performed_by=current_user.email,
    )
    return SuccessResponse(data=TaskRead.model_validate(task))


@router.delete("/{task_id}", response_model=SuccessResponse[TaskRead])
def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
    _: object = Depends(require_permission("MANAGE_TASKS")),
):
    task = task_service.soft_delete_task(session, task_id)
    return SuccessResponse(data=TaskRead.model_validate(task))
