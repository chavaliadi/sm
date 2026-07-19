from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel


# ── DPR Status Enum ─────────────────────────────────────────────────
class DPRStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    SMFCL_REVIEW = "SMFCL_REVIEW"
    REJECTED_BY_SMFCL = "REJECTED_BY_SMFCL"
    FORWARDED_TO_MINISTRY = "FORWARDED_TO_MINISTRY"
    REJECTED_BY_MINISTRY = "REJECTED_BY_MINISTRY"
    APPROVED = "APPROVED"
    FUNDS_RELEASED = "FUNDS_RELEASED"


# ── Valid Transitions (strict state machine) ────────────────────────
VALID_TRANSITIONS: dict[str, list[str]] = {
    DPRStatus.DRAFT: [DPRStatus.SUBMITTED],
    DPRStatus.SUBMITTED: [DPRStatus.SMFCL_REVIEW],
    DPRStatus.SMFCL_REVIEW: [DPRStatus.REJECTED_BY_SMFCL, DPRStatus.FORWARDED_TO_MINISTRY],
    DPRStatus.REJECTED_BY_SMFCL: [DPRStatus.SUBMITTED],
    DPRStatus.FORWARDED_TO_MINISTRY: [DPRStatus.REJECTED_BY_MINISTRY, DPRStatus.APPROVED],
    DPRStatus.REJECTED_BY_MINISTRY: [DPRStatus.SMFCL_REVIEW],
    DPRStatus.APPROVED: [DPRStatus.FUNDS_RELEASED],
    DPRStatus.FUNDS_RELEASED: [],
}


# ── Read Schemas (API output) ──────────────────────────────────────

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
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime


# ── Create / Update Schemas (API input) ─────────────────────────────

class DPRCreate(SQLModel):
    project_id: int


class ReviewDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"


class DPRReviewRequest(SQLModel):
    decision: ReviewDecision
    comment: Optional[str] = None
