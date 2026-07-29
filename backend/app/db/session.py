"""
Database engine and session dependency.

Per the project plan: no Repository layer. Services import `get_session`
directly and do their own SQLModel queries — this is the one place that
knows how a connection is created.
"""
from sqlmodel import Session, create_engine

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session

