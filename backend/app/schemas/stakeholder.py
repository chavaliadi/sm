from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class StakeholderRead(SQLModel):
    id: int
    project_id: int
    name: str
    organization: str
    role: str
    contact_info: Optional[str] = None
    is_active: bool


class MeetingRead(SQLModel):
    id: int
    project_id: int
    title: str
    date: datetime
    notes: Optional[str] = None
    is_active: bool
