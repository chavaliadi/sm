"""
Feasibility Study — API Routes.

POST   /studies                  → Create study
GET    /studies                  → List studies
GET    /studies/{id}             → Get single study
GET    /studies/{id}/audit-trail → Audit history
PUT    /studies/{id}/submit      → DRAFT → UNDER_REVIEW
PUT    /studies/{id}/review      → UNDER_REVIEW → COMPLETED / REJECTED
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
from app.schemas.study import StudyCreate, StudyRead, StudyAuditLogRead, StudyReviewRequest
from app.schemas.responses import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import study as study_service

router = APIRouter(prefix="/studies", tags=["Feasibility Studies"])


@router.post(
    "",
    response_model=SuccessResponse[StudyRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("MANAGE_DPR"))],
)
def create_study(
    body: StudyCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Port Authority creates a feasibility study for a project."""
    study = study_service.create_study(
        session, body.project_id, body.study_type.value, current_user.id,
        body.report_file_url, body.estimated_cost, body.estimated_duration_months,
    )
    return SuccessResponse(data=StudyRead.model_validate(study))


@router.get(
    "",
    response_model=PaginatedResponse[StudyRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def list_studies(
    project_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    studies = study_service.list_studies(session, project_id=project_id)
    return PaginatedResponse(
        data=[StudyRead.model_validate(s) for s in studies],
        meta=PaginationMeta(page=1, page_size=20, total=len(studies)),
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[StudyRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_study(id: int, session: Session = Depends(get_session)):
    study = study_service.get_study(session, id)
    return SuccessResponse(data=StudyRead.model_validate(study))


@router.get(
    "/{id}/audit-trail",
    response_model=PaginatedResponse[StudyAuditLogRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_study_audit_trail(id: int, session: Session = Depends(get_session)):
    logs = study_service.get_study_audit_trail(session, id)
    return PaginatedResponse(
        data=[StudyAuditLogRead.model_validate(log) for log in logs],
        meta=PaginationMeta(page=1, page_size=100, total=len(logs)),
    )


@router.put(
    "/{id}/submit",
    response_model=SuccessResponse[StudyRead],
    dependencies=[Depends(require_permission("MANAGE_DPR"))],
)
def submit_study(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Port Authority submits a study for review."""
    study = study_service.submit_study(session, id, current_user.id)
    return SuccessResponse(data=StudyRead.model_validate(study))


@router.put(
    "/{id}/review",
    response_model=SuccessResponse[StudyRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def review_study(
    id: int,
    body: StudyReviewRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL reviews a study — complete or reject."""
    study = study_service.review_study(session, id, current_user.id, body.decision, body.comment)
    return SuccessResponse(data=StudyRead.model_validate(study))
