"""
DPR Submission & Approval Workflow — API Routes.

Endpoints:
  POST   /dpr                        Create a DPR (DRAFT)
  GET    /dpr                        List all active DPRs
  GET    /dpr/{id}                   Retrieve single DPR
  GET    /dpr/{id}/audit-trail       Retrieve audit history
  PUT    /dpr/{id}/submit            DRAFT → SUBMITTED → SMFCL_REVIEW
  PUT    /dpr/{id}/smfcl-review      SMFCL approve / reject
  PUT    /dpr/{id}/ministry-review   Ministry approve / reject
  PUT    /dpr/{id}/smfcl-requeue     REJECTED_BY_MINISTRY → SMFCL_REVIEW
  PUT    /dpr/{id}/release-funds     APPROVED → FUNDS_RELEASED
  DELETE /dpr/{id}                   Soft-delete (DRAFT only)
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
from app.schemas.dpr import DPRCreate, DPRRead, DPRAuditLogRead, DPRReviewRequest
from app.schemas.responses import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import dpr as dpr_service

router = APIRouter(prefix="/dpr", tags=["DPR Submission & Approval Workflow"])


# ── Create ──────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=SuccessResponse[DPRRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("MANAGE_DPR"))],
)
def create_dpr(
    body: DPRCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Port Authority creates a new DPR in DRAFT status."""
    dpr = dpr_service.create_dpr(session, body.project_id, current_user.id)
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── List ────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=PaginatedResponse[DPRRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_dprs(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    session: Session = Depends(get_session),
):
    """List all active DPRs with optional project filter."""
    dprs = dpr_service.list_dprs(session, project_id=project_id)
    return PaginatedResponse(
        data=[DPRRead.model_validate(d) for d in dprs],
        meta=PaginationMeta(page=1, page_size=20, total=len(dprs)),
    )


# ── Retrieve ────────────────────────────────────────────────────────

@router.get(
    "/{id}",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_dpr(id: int, session: Session = Depends(get_session)):
    """Retrieve a single DPR by ID."""
    dpr = dpr_service.get_dpr(session, id)
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── Audit Trail ─────────────────────────────────────────────────────

@router.get(
    "/{id}/audit-trail",
    response_model=PaginatedResponse[DPRAuditLogRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_dpr_audit_trail(id: int, session: Session = Depends(get_session)):
    """Retrieve the complete audit trail for a DPR."""
    logs = dpr_service.get_dpr_audit_trail(session, id)
    return PaginatedResponse(
        data=[DPRAuditLogRead.model_validate(log) for log in logs],
        meta=PaginationMeta(page=1, page_size=100, total=len(logs)),
    )


# ── Submit (Port Authority) ────────────────────────────────────────

@router.put(
    "/{id}/submit",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("MANAGE_DPR"))],
)
def submit_dpr(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Port Authority submits a DRAFT DPR. Auto-advances to SMFCL_REVIEW."""
    dpr = dpr_service.submit_dpr(session, id, current_user.id)
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── SMFCL Review ────────────────────────────────────────────────────

@router.put(
    "/{id}/smfcl-review",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def smfcl_review(
    id: int,
    body: DPRReviewRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL reviews a DPR — approve (forward to Ministry) or reject."""
    dpr = dpr_service.smfcl_review(
        session, id, current_user.id, body.decision.value, body.comment,
    )
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── Ministry Review ─────────────────────────────────────────────────

@router.put(
    "/{id}/ministry-review",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def ministry_review(
    id: int,
    body: DPRReviewRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Ministry reviews a DPR — approve (final) or reject back to SMFCL."""
    dpr = dpr_service.ministry_review(
        session, id, current_user.id, body.decision.value, body.comment,
    )
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── SMFCL Requeue (after Ministry rejection) ────────────────────────

@router.put(
    "/{id}/smfcl-requeue",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def smfcl_requeue(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL re-queues a Ministry-rejected DPR for re-review."""
    dpr = dpr_service.smfcl_requeue_after_ministry_rejection(session, id, current_user.id)
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── Release Funds ───────────────────────────────────────────────────

@router.put(
    "/{id}/release-funds",
    response_model=SuccessResponse[DPRRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def release_funds(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL marks funds released for an APPROVED DPR."""
    dpr = dpr_service.release_funds(session, id, current_user.id)
    return SuccessResponse(data=DPRRead.model_validate(dpr))


# ── Soft Delete ─────────────────────────────────────────────────────

@router.delete(
    "/{id}",
    response_model=SuccessResponse[dict],
    dependencies=[Depends(require_permission("MANAGE_DPR"))],
)
def delete_dpr(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a DPR. Only allowed in DRAFT status."""
    success, message = dpr_service.delete_dpr(session, id, current_user.id)
    if not success:
        code = "NOT_FOUND" if message == "DPR not found" else "INVALID_STATE_TRANSITION"
        status_code = (
            status.HTTP_404_NOT_FOUND if message == "DPR not found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail={"code": code, "message": message})
    return SuccessResponse(data={"message": message})
