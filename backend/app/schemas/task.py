from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class TaskRead(SQLModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
