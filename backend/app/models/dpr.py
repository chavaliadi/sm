from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DPR(SQLModel, table=True):
    __tablename__ = "dpr"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    version: int = Field(default=1)
    status: str = Field(default="DRAFT")
    submitted_by: int = Field(foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DPRAuditLog(SQLModel, table=True):
    __tablename__ = "dpr_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    dpr_id: int = Field(foreign_key="dpr.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    action: str  # e.g., CREATED, SUBMITTED, SMFCL_APPROVED, SMFCL_REJECTED, etc.
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
