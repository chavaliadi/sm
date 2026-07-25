"""Task CRUD services using the Route to Service to Session flow."""

from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from app.models.task import Task
from app.models.notification import Notification
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


def check_task_due_reminders(
    session: Session, threshold_days: int = 3
) -> list[Notification]:
    """
    Query tasks where due_date is within next threshold_days AND status != DONE.
    Creates an idempotent notification for each assigned user.
    """
    from datetime import datetime, timedelta
    from app.models.notification import Notification
    from app.services.notifications import create_notification

    now = datetime.utcnow()
    threshold_dt = now + timedelta(days=threshold_days)

    # Query active tasks due within threshold and assigned to a user
    stmt = select(Task).where(
        Task.is_active == True,
        Task.status != "DONE",
        Task.assigned_to != None,
        Task.due_date != None,
        Task.due_date <= threshold_dt,
    )
    due_tasks = list(session.exec(stmt).all())

    created_notifications = []

    for task in due_tasks:
        if not task.assigned_to or not task.due_date:
            continue

        # Idempotency check: see if a reminder notification for this task already exists
        task_marker = f"Task #{task.id} "
        existing = session.exec(
            select(Notification).where(
                Notification.user_id == task.assigned_to,
                Notification.message.contains(task_marker),
            )
        ).first()

        if existing:
            continue

        # Calculate remaining days
        due_date_str = task.due_date.strftime("%Y-%m-%d")
        if task.due_date < now:
            days_str = "overdue"
        else:
            delta_days = (task.due_date - now).days
            days_str = f"{delta_days} day(s) remaining"

        title = f"Task Due Reminder: {task.title}"
        message = f"Task #{task.id} '{task.title}' is due on {due_date_str} — {days_str}."

        notif = create_notification(
            session,
            user_id=task.assigned_to,
            title=title,
            message=message,
        )
        created_notifications.append(notif)

    return created_notifications
