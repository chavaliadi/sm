from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Tender(SQLModel, table=True):
    __tablename__ = "tenders"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    tender_code: str = Field(unique=True, index=True)
    title: str
    status: str = Field(default="DRAFT")
    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TenderAuditLog(SQLModel, table=True):
    __tablename__ = "tender_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    tender_id: int = Field(foreign_key="tenders.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
