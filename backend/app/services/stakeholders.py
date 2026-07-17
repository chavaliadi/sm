from sqlmodel import Session, select
from app.models.stakeholder import Stakeholder, Meeting


def list_stakeholders(session: Session) -> list[Stakeholder]:
    statement = select(Stakeholder).where(Stakeholder.is_active == True)
    return list(session.exec(statement).all())


def list_meetings(session: Session) -> list[Meeting]:
    statement = select(Meeting).where(Meeting.is_active == True)
    return list(session.exec(statement).all())
