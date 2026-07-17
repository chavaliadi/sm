from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    title: str
    description: Optional[str] = None
    priority: str  # LOW, MEDIUM, HIGH
    status: str  # TODO, IN_PROGRESS, DONE
    assigned_to: Optional[int] = Field(default=None, foreign_key="users.id")
    due_date: Optional[datetime] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
