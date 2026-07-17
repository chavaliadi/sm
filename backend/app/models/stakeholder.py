from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Stakeholder(SQLModel, table=True):
    __tablename__ = "stakeholders"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    name: str
    organization: str
    role: str
    contact_info: Optional[str] = None
    is_active: bool = Field(default=True)


class Meeting(SQLModel, table=True):
    __tablename__ = "meetings"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    title: str
    date: datetime
    notes: Optional[str] = None
    is_active: bool = Field(default=True)
