from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class StakeholderCreate(SQLModel):
    project_id: int
    name: str
    organization: str
    role: str
    contact_info: Optional[str] = None


class StakeholderUpdate(SQLModel):
    project_id: Optional[int] = None
    name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    contact_info: Optional[str] = None


class StakeholderRead(SQLModel):
    id: int
    project_id: int
    name: str
    organization: str
    role: str
    contact_info: Optional[str] = None
    is_active: bool


class MeetingCreate(SQLModel):
    project_id: int
    title: str
    date: datetime
    notes: Optional[str] = None


class MeetingUpdate(SQLModel):
    project_id: Optional[int] = None
    title: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None


class MeetingRead(SQLModel):
    id: int
    project_id: int
    title: str
    date: datetime
    notes: Optional[str] = None
    is_active: bool

