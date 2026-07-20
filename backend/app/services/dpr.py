"""
DPR Submission & Approval Workflow — Service Layer.

Implements the strict state machine:
  DRAFT → SUBMITTED → SMFCL_REVIEW
    → REJECTED_BY_SMFCL → SUBMITTED (version increments)
    → FORWARDED_TO_MINISTRY
        → REJECTED_BY_MINISTRY → SMFCL_REVIEW
        → APPROVED → FUNDS_RELEASED

Every transition writes to dpr_audit_log and fires notifications
on reject / approve / funds-released.
"""
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.dpr import DPR, DPRAuditLog
from app.models.project import Project
from app.schemas.dpr import DPRStatus, VALID_TRANSITIONS
from app.services.notifications import create_notification


# ── Helpers ──────────────────────────────────────────────────────────

def _get_active_dpr(session: Session, dpr_id: int) -> DPR:
    """Fetch a DPR by ID; raise 404 if not found or soft-deleted."""
    dpr = session.get(DPR, dpr_id)
    if not dpr or not dpr.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "DPR not found"},
        )
    return dpr


def _validate_transition(current_status: str, target_status: str) -> None:
    """Raise 400 if the transition is illegal per the state machine."""
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATE_TRANSITION",
                "message": (
                    f"Cannot transition from {current_status} to {target_status}. "
                    f"Allowed transitions: {allowed}"
                ),
            },
        )


def _write_audit(
    session: Session,
    dpr_id: int,
    actor_id: int,
    action: str,
    old_status: Optional[str],
    new_status: Optional[str],
    comment: Optional[str] = None,
) -> DPRAuditLog:
    """Write one row to dpr_audit_log."""
    entry = DPRAuditLog(
        dpr_id=dpr_id,
        actor_id=actor_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        comment=comment,
    )
    session.add(entry)
    return entry


def _transition(
    session: Session,
    dpr: DPR,
    target_status: str,
    actor_id: int,
    action_label: str,
    comment: Optional[str] = None,
) -> DPR:
    """Execute a state transition: validate → update → audit → commit."""
    old_status = dpr.status
    _validate_transition(old_status, target_status)

    dpr.status = target_status
    dpr.updated_at = datetime.utcnow()
    session.add(dpr)

    _write_audit(session, dpr.id, actor_id, action_label, old_status, target_status, comment)

    session.commit()
    session.refresh(dpr)
    return dpr


# ── Public API ───────────────────────────────────────────────────────

def list_dprs(session: Session, project_id: Optional[int] = None) -> list[DPR]:
    """List all active DPRs, optionally filtered by project."""
    stmt = select(DPR).where(DPR.is_active == True)
    if project_id is not None:
        stmt = stmt.where(DPR.project_id == project_id)
    stmt = stmt.order_by(DPR.created_at.desc())
    return list(session.exec(stmt).all())


def get_dpr(session: Session, dpr_id: int) -> DPR:
    """Retrieve a single DPR by ID."""
    return _get_active_dpr(session, dpr_id)


def get_dpr_audit_trail(session: Session, dpr_id: int) -> list[DPRAuditLog]:
    """Retrieve audit trail for a specific DPR."""
    # Verify DPR exists
    _get_active_dpr(session, dpr_id)
    stmt = (
        select(DPRAuditLog)
        .where(DPRAuditLog.dpr_id == dpr_id)
        .order_by(DPRAuditLog.timestamp.asc())
    )
    return list(session.exec(stmt).all())


def create_dpr(session: Session, project_id: int, actor_id: int) -> DPR:
    """
    Create a new DPR in DRAFT status for a given project.
    Validates that the project exists and is active.
    """
    project = session.get(Project, project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"},
        )

    # Gate DPR creation on Evaluation recommendation
    if project.lifecycle_stage != "cleared_for_dpr":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "LIFECYCLE_GATE",
                "message": f"Project must be in 'cleared_for_dpr' stage to create a DPR. Current: {project.lifecycle_stage}",
            },
        )

    dpr = DPR(
        project_id=project_id,
        status=DPRStatus.DRAFT,
        submitted_by=actor_id,
    )
    session.add(dpr)
    session.flush()  # get dpr.id before audit write

    _write_audit(session, dpr.id, actor_id, "CREATED", None, DPRStatus.DRAFT, "DPR created")

    session.commit()
    session.refresh(dpr)
    return dpr


def submit_dpr(session: Session, dpr_id: int, actor_id: int) -> DPR:
    """
    DRAFT → SUBMITTED → SMFCL_REVIEW (two-step auto-advance).
    Port Authority submits the DPR for review.
    """
    dpr = _get_active_dpr(session, dpr_id)

    # If resubmitting after SMFCL rejection, version increments
    if dpr.status == DPRStatus.REJECTED_BY_SMFCL:
        dpr.version += 1
        old_status = dpr.status
        _validate_transition(old_status, DPRStatus.SUBMITTED)
        dpr.status = DPRStatus.SUBMITTED
        dpr.updated_at = datetime.utcnow()
        session.add(dpr)
        _write_audit(
            session, dpr.id, actor_id, "RESUBMITTED",
            old_status, DPRStatus.SUBMITTED,
            f"Resubmitted after SMFCL rejection (version {dpr.version})",
        )
    else:
        # Normal first submission: DRAFT → SUBMITTED
        _validate_transition(dpr.status, DPRStatus.SUBMITTED)
        old = dpr.status
        dpr.status = DPRStatus.SUBMITTED
        dpr.updated_at = datetime.utcnow()
        session.add(dpr)
        _write_audit(session, dpr.id, actor_id, "SUBMITTED", old, DPRStatus.SUBMITTED)

    # Auto-advance: SUBMITTED → SMFCL_REVIEW
    _validate_transition(DPRStatus.SUBMITTED, DPRStatus.SMFCL_REVIEW)
    dpr.status = DPRStatus.SMFCL_REVIEW
    dpr.updated_at = datetime.utcnow()
    session.add(dpr)
    _write_audit(
        session, dpr.id, actor_id, "MOVED_TO_SMFCL_REVIEW",
        DPRStatus.SUBMITTED, DPRStatus.SMFCL_REVIEW,
        "Auto-advanced to SMFCL review queue",
    )

    session.commit()
    session.refresh(dpr)
    return dpr


def smfcl_review(
    session: Session, dpr_id: int, actor_id: int, decision: str, comment: Optional[str] = None,
) -> DPR:
    """
    SMFCL reviews the DPR:
      approve → FORWARDED_TO_MINISTRY
      reject  → REJECTED_BY_SMFCL
    """
    dpr = _get_active_dpr(session, dpr_id)

    if decision == "approve":
        target = DPRStatus.FORWARDED_TO_MINISTRY
        action = "SMFCL_APPROVED"
        notif_title = "DPR Forwarded to Ministry"
        notif_msg = f"DPR #{dpr.id} has been recommended by SMFCL and forwarded to the Ministry for review."
    elif decision == "reject":
        if not comment or not comment.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "COMMENT_REQUIRED", "message": "A reason must be provided when rejecting a DPR."},
            )
        target = DPRStatus.REJECTED_BY_SMFCL
        action = "SMFCL_REJECTED"
        notif_title = "DPR Rejected by SMFCL"
        notif_msg = f"DPR #{dpr.id} has been rejected by SMFCL. Observations: {comment}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_DECISION", "message": "Decision must be 'approve' or 'reject'"},
        )

    dpr = _transition(session, dpr, target, actor_id, action, comment)

    # Notify the submitter
    create_notification(session, dpr.submitted_by, notif_title, notif_msg)

    return dpr


def ministry_review(
    session: Session, dpr_id: int, actor_id: int, decision: str, comment: Optional[str] = None,
) -> DPR:
    """
    Ministry reviews the DPR:
      approve → APPROVED
      reject  → REJECTED_BY_MINISTRY
    """
    dpr = _get_active_dpr(session, dpr_id)

    if decision == "approve":
        target = DPRStatus.APPROVED
        action = "MINISTRY_APPROVED"
        notif_title = "DPR Approved by Ministry"
        notif_msg = f"DPR #{dpr.id} has received final approval from the Ministry."

        # Integration Phase 2 Task 1: Update project lifecycle stage
        project = session.get(Project, dpr.project_id)
        if project:
            project.lifecycle_stage = "sanctioned"
            project.updated_at = datetime.utcnow()
            session.add(project)

        # Integration Phase 2 Task 2: Auto-create Task on DPR Approval
        from app.services.task import create_task_for_dpr
        create_task_for_dpr(
            session,
            project_id=dpr.project_id,
            title=f"Funds Disbursement — DPR #{dpr.id}",
            description=f"Process fund release for approved DPR #{dpr.id}. Ministry approval received.",
        )
    elif decision == "reject":
        if not comment or not comment.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "COMMENT_REQUIRED", "message": "A reason must be provided when rejecting a DPR."},
            )
        target = DPRStatus.REJECTED_BY_MINISTRY
        action = "MINISTRY_REJECTED"
        notif_title = "DPR Rejected by Ministry"
        notif_msg = f"DPR #{dpr.id} has been rejected by the Ministry. Reason: {comment}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_DECISION", "message": "Decision must be 'approve' or 'reject'"},
        )

    dpr = _transition(session, dpr, target, actor_id, action, comment)

    # Notify the submitter
    create_notification(session, dpr.submitted_by, notif_title, notif_msg)

    return dpr


def smfcl_requeue_after_ministry_rejection(
    session: Session, dpr_id: int, actor_id: int, comment: Optional[str] = None,
) -> DPR:
    """
    REJECTED_BY_MINISTRY → SMFCL_REVIEW.
    SMFCL re-takes the DPR for further review after Ministry rejection.
    """
    dpr = _get_active_dpr(session, dpr_id)
    return _transition(
        session, dpr, DPRStatus.SMFCL_REVIEW, actor_id,
        "REQUEUED_BY_SMFCL", comment,
    )


def release_funds(session: Session, dpr_id: int, actor_id: int, comment: Optional[str] = None) -> DPR:
    """APPROVED → FUNDS_RELEASED. SMFCL marks funds released."""
    dpr = _get_active_dpr(session, dpr_id)
    dpr = _transition(session, dpr, DPRStatus.FUNDS_RELEASED, actor_id, "FUNDS_RELEASED", comment)

    # Integration Phase 2 Task 1: Update project lifecycle stage again
    project = session.get(Project, dpr.project_id)
    if project:
        project.lifecycle_stage = "funded"
        project.updated_at = datetime.utcnow()
        session.add(project)

    # Notify the submitter
    create_notification(
        session, dpr.submitted_by,
        "Funds Released",
        f"Funds for DPR #{dpr.id} have been released. The project may proceed to execution.",
    )

    return dpr


def delete_dpr(session: Session, dpr_id: int, actor_id: int) -> tuple[bool, str]:
    """Soft-delete a DPR — only allowed while in DRAFT status."""
    dpr = session.get(DPR, dpr_id)
    if not dpr or not dpr.is_active:
        return False, "DPR not found"
    if dpr.status != DPRStatus.DRAFT:
        return False, "Only DRAFT DPRs can be deleted"

    dpr.is_active = False
    dpr.updated_at = datetime.utcnow()
    session.add(dpr)

    _write_audit(session, dpr.id, actor_id, "SOFT_DELETED", dpr.status, None, "DPR soft-deleted")

    session.commit()
    return True, "DPR deleted successfully"
