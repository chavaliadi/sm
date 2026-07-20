from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel


# ── Study Status + Transitions ──────────────────────────────────────

class StudyStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


STUDY_TRANSITIONS: dict[str, list[str]] = {
    StudyStatus.DRAFT: [StudyStatus.SUBMITTED],
    StudyStatus.SUBMITTED: [StudyStatus.UNDER_REVIEW],
    StudyStatus.UNDER_REVIEW: [StudyStatus.COMPLETED, StudyStatus.REJECTED],
    StudyStatus.COMPLETED: [],  # terminal
    StudyStatus.REJECTED: [StudyStatus.DRAFT],  # resubmit cycle
}


class StudyType(str, Enum):
    TECHNICAL = "technical"
    FINANCIAL = "financial"
    ENVIRONMENTAL = "environmental"
    TECHNO_ECONOMIC = "techno_economic"


# ── Read Schemas ────────────────────────────────────────────────────

class StudyRead(SQLModel):
    id: int
    project_id: int
    study_type: str
    status: str
    report_file_url: Optional[str] = None
    estimated_cost: Optional[float] = None
    estimated_duration_months: Optional[int] = None
    submitted_by: int
    version: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudyAuditLogRead(SQLModel):
    id: int
    study_id: int
    actor_id: int
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime


# ── Create / Update Schemas ─────────────────────────────────────────

class StudyCreate(SQLModel):
    project_id: int
    study_type: StudyType
    report_file_url: Optional[str] = None
    estimated_cost: Optional[float] = None
    estimated_duration_months: Optional[int] = None


class StudyReviewRequest(SQLModel):
    decision: str  # "complete" or "reject"
    comment: Optional[str] = None
