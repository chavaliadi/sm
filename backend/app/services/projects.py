from sqlmodel import Session, select
from app.models.project import Project


def list_projects(session: Session) -> list[Project]:
    statement = select(Project).where(Project.is_active == True)
    return list(session.exec(statement).all())
