from sqlmodel import Session, select
from app.models.task import Task


def list_tasks(session: Session) -> list[Task]:
    statement = select(Task).where(Task.is_active == True)
    return list(session.exec(statement).all())
