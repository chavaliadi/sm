from sqlmodel import Session, select
from app.models.auth import User


def list_users(session: Session) -> list[User]:
    statement = select(User)
    return list(session.exec(statement).all())
