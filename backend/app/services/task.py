"""Task CRUD services using the Route to Service to Session flow."""

from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskStatus, TaskUpdate


def list_tasks(
    session: Session,
    page: int = 1,
    page_size: int = 20,
    project_id: int | None = None,
    assigned_to: int | None = None,
    task_status: TaskStatus | None = None,
) -> tuple[list[Task], int]:
    """Return active tasks and the total number of active task records."""
    filters = [Task.is_active == True]
    if project_id is not None:
        filters.append(Task.project_id == project_id)
    if assigned_to is not None:
        filters.append(Task.assigned_to == assigned_to)
    if task_status is not None:
        filters.append(Task.status == task_status)

    total = session.exec(select(func.count(Task.id)).where(*filters)).one()
    offset = (page - 1) * page_size
    tasks = list(
        session.exec(
            select(Task)
            .where(*filters)
            .order_by(Task.due_date)
            .offset(offset)
            .limit(page_size)
        ).all()
    )
    return tasks, total


def create_task(session: Session, task_create: TaskCreate) -> Task:
    """Create and return a task."""
    task = Task(**task_create.model_dump())
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_task(session: Session, task_id: int) -> Task:
    """Return an active task or raise the standard not found error."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.is_active == True)
    ).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "TASK_NOT_FOUND",
                "message": "Task not found",
                "field": "id",
            },
        )
    return task


def update_task(session: Session, task_id: int, task_update: TaskUpdate) -> Task:
    """Update supplied task fields and return the refreshed task."""
    task = get_task(session, task_id)
    update_data = task_update.model_dump(exclude_unset=True)
    next_status = update_data.get("status", task.status)
    next_evidence_url = update_data.get("evidence_url", task.evidence_url)
    if next_status == "DONE" and not next_evidence_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EVIDENCE_REQUIRED",
                "message": "You must provide an evidence URL to mark this task as DONE",
                "field": "evidence_url",
            },
        )

    for field, value in update_data.items():
        setattr(task, field, value)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def soft_delete_task(session: Session, task_id: int) -> Task:
    """Soft delete a task by marking it inactive."""
    task = get_task(session, task_id)
    task.is_active = False
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def create_task_for_dpr(session: Session, project_id: int, title: str, description: str) -> Task:
    """Auto-create a task when a DPR is approved."""
    task_in = TaskCreate(
        project_id=project_id,
        title=title,
        description=description,
        priority="HIGH",
        status="TODO",
    )
    return create_task(session, task_in)
