from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class DPRRead(SQLModel):
    id: int
    project_id: int
    version: int
    status: str
    submitted_by: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DPRAuditLogRead(SQLModel):
    id: int
    dpr_id: int
    actor_id: int
    action: str
    comment: Optional[str] = None
    timestamp: datetime
