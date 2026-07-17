"""
Database engine and session dependency.

Per the project plan: no Repository layer. Services import `get_session`
directly and do their own SQLModel queries — this is the one place that
knows how a connection is created.
"""
from sqlmodel import Session, create_engine

from app.core.config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session():
    with Session(engine) as session:
        yield session
