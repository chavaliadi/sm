from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class FeasibilityStudy(SQLModel, table=True):
    __tablename__ = "feasibility_studies"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    study_type: str  # technical / financial / environmental / techno_economic
    status: str = Field(default="DRAFT")
    report_file_url: Optional[str] = None
    estimated_cost: Optional[float] = None
    estimated_duration_months: Optional[int] = None
    submitted_by: int = Field(foreign_key="users.id")
    version: int = Field(default=1)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StudyAuditLog(SQLModel, table=True):
    __tablename__ = "study_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    study_id: int = Field(foreign_key="feasibility_studies.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
