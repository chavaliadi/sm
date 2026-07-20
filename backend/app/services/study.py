"""
Feasibility Study Workflow — Service Layer.

State machine:
  DRAFT → SUBMITTED → UNDER_REVIEW → COMPLETED  (or REJECTED → DRAFT, version+1)

When a study reaches COMPLETED, the project lifecycle_stage advances to
"study_completed". This unblocks the Evaluation stage.
"""
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.study import FeasibilityStudy, StudyAuditLog
from app.models.project import Project
from app.schemas.study import StudyStatus, STUDY_TRANSITIONS
from app.services.notifications import create_notification


# ── Helpers ──────────────────────────────────────────────────────────

def _get_active_study(session: Session, study_id: int) -> FeasibilityStudy:
    study = session.get(FeasibilityStudy, study_id)
    if not study or not study.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Study not found"},
        )
    return study


def _validate_study_transition(current: str, target: str) -> None:
    allowed = STUDY_TRANSITIONS.get(current, [])
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATE_TRANSITION",
                "message": f"Cannot transition from {current} to {target}. Allowed: {allowed}",
            },
        )


def _write_study_audit(
    session: Session, study_id: int, actor_id: int,
    action: str, old_status: Optional[str], new_status: Optional[str],
    comment: Optional[str] = None,
) -> StudyAuditLog:
    entry = StudyAuditLog(
        study_id=study_id, actor_id=actor_id, action=action,
        old_status=old_status, new_status=new_status, comment=comment,
    )
    session.add(entry)
    return entry


# ── Public API ───────────────────────────────────────────────────────

def list_studies(session: Session, project_id: Optional[int] = None) -> list[FeasibilityStudy]:
    stmt = select(FeasibilityStudy).where(FeasibilityStudy.is_active == True)
    if project_id is not None:
        stmt = stmt.where(FeasibilityStudy.project_id == project_id)
    stmt = stmt.order_by(FeasibilityStudy.created_at.desc())
    return list(session.exec(stmt).all())


def get_study(session: Session, study_id: int) -> FeasibilityStudy:
    return _get_active_study(session, study_id)


def get_study_audit_trail(session: Session, study_id: int) -> list[StudyAuditLog]:
    _get_active_study(session, study_id)
    stmt = (
        select(StudyAuditLog)
        .where(StudyAuditLog.study_id == study_id)
        .order_by(StudyAuditLog.timestamp.asc())
    )
    return list(session.exec(stmt).all())


def create_study(
    session: Session, project_id: int, study_type: str, actor_id: int,
    report_file_url: Optional[str] = None,
    estimated_cost: Optional[float] = None,
    estimated_duration_months: Optional[int] = None,
) -> FeasibilityStudy:
    project = session.get(Project, project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"},
        )

    study = FeasibilityStudy(
        project_id=project_id,
        study_type=study_type,
        status=StudyStatus.DRAFT,
        submitted_by=actor_id,
        report_file_url=report_file_url,
        estimated_cost=estimated_cost,
        estimated_duration_months=estimated_duration_months,
    )
    session.add(study)
    session.flush()

    _write_study_audit(session, study.id, actor_id, "CREATED", None, StudyStatus.DRAFT, "Study created")

    # Advance project lifecycle if still at appraisal
    if project.lifecycle_stage == "appraisal":
        project.lifecycle_stage = "study_in_progress"
        project.updated_at = datetime.utcnow()
        session.add(project)

    session.commit()
    session.refresh(study)
    return study


def submit_study(session: Session, study_id: int, actor_id: int) -> FeasibilityStudy:
    """DRAFT → SUBMITTED → UNDER_REVIEW (auto-advance)."""
    study = _get_active_study(session, study_id)

    if study.status == StudyStatus.REJECTED:
        study.version += 1
        _validate_study_transition(study.status, StudyStatus.DRAFT)
        old = study.status
        study.status = StudyStatus.DRAFT
        study.updated_at = datetime.utcnow()
        session.add(study)
        _write_study_audit(
            session, study.id, actor_id, "REVISION_STARTED",
            old, StudyStatus.DRAFT,
            f"Revision started after rejection (version {study.version})",
        )

    # DRAFT → SUBMITTED
    _validate_study_transition(study.status, StudyStatus.SUBMITTED)
    old = study.status
    study.status = StudyStatus.SUBMITTED
    study.updated_at = datetime.utcnow()
    session.add(study)
    _write_study_audit(session, study.id, actor_id, "SUBMITTED", old, StudyStatus.SUBMITTED)

    # SUBMITTED → UNDER_REVIEW (auto-advance)
    _validate_study_transition(StudyStatus.SUBMITTED, StudyStatus.UNDER_REVIEW)
    study.status = StudyStatus.UNDER_REVIEW
    study.updated_at = datetime.utcnow()
    session.add(study)
    _write_study_audit(
        session, study.id, actor_id, "MOVED_TO_REVIEW",
        StudyStatus.SUBMITTED, StudyStatus.UNDER_REVIEW,
        "Auto-advanced to review queue",
    )

    session.commit()
    session.refresh(study)
    return study


def review_study(
    session: Session, study_id: int, actor_id: int,
    decision: str, comment: Optional[str] = None,
) -> FeasibilityStudy:
    """
    UNDER_REVIEW → COMPLETED or REJECTED.
    On COMPLETED, project lifecycle advances to "study_completed".
    """
    study = _get_active_study(session, study_id)
    _validate_study_transition(study.status, StudyStatus.COMPLETED if decision == "complete" else StudyStatus.REJECTED)

    old = study.status
    if decision == "complete":
        study.status = StudyStatus.COMPLETED
        action = "STUDY_COMPLETED"
        notif_title = "Study Completed"
        notif_msg = f"Feasibility study #{study.id} ({study.study_type}) has been marked complete."

        # Advance project lifecycle
        project = session.get(Project, study.project_id)
        if project:
            project.lifecycle_stage = "study_completed"
            project.updated_at = datetime.utcnow()
            session.add(project)

    elif decision == "reject":
        if not comment or not comment.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "COMMENT_REQUIRED", "message": "A reason must be provided when rejecting a study."},
            )
        study.status = StudyStatus.REJECTED
        action = "STUDY_REJECTED"
        notif_title = "Study Rejected"
        notif_msg = f"Feasibility study #{study.id} has been rejected. Reason: {comment}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_DECISION", "message": "Decision must be 'complete' or 'reject'"},
        )

    study.updated_at = datetime.utcnow()
    session.add(study)
    _write_study_audit(session, study.id, actor_id, action, old, study.status, comment)

    session.commit()
    session.refresh(study)

    create_notification(session, study.submitted_by, notif_title, notif_msg)

    return study
