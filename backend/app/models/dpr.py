from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DPR(SQLModel, table=True):
    __tablename__ = "dpr"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", unique=True, index=True)
    version: int = Field(default=1)
    status: str  # e.g., DRAFT, SUBMITTED, SMFCL_REVIEW, REJECTED_BY_SMFCL, FORWARDED_TO_MINISTRY, REJECTED_BY_MINISTRY, APPROVED, FUNDS_RELEASED
    submitted_by: int = Field(foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DPRAuditLog(SQLModel, table=True):
    __tablename__ = "dpr_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    dpr_id: int = Field(foreign_key="dpr.id")
    actor_id: int = Field(foreign_key="users.id")
    action: str  # e.g., SUBMIT, APPROVE, REJECT
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
