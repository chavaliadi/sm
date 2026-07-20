"""
Project Evaluation — API Routes.

POST   /evaluations            → Create evaluation with scores
GET    /evaluations            → List evaluations
GET    /evaluations/{id}       → Get single evaluation
PUT    /evaluations/{id}/decide → Set recommendation (APPROVE_FOR_DPR / REVISE_STUDY / REJECT)
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user, require_permission
from app.models.auth import User
from app.schemas.evaluation import EvaluationCreate, EvaluationRead, EvaluationDecision
from app.schemas.responses import SuccessResponse, PaginatedResponse, PaginationMeta
from app.services import evaluation as eval_service

router = APIRouter(prefix="/evaluations", tags=["Project Evaluations"])


@router.post(
    "",
    response_model=SuccessResponse[EvaluationRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def create_evaluation(
    body: EvaluationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL creates an evaluation with criteria scores."""
    scores = body.criteria_scores.model_dump()
    evaluation = eval_service.create_evaluation(
        session, body.project_id, current_user.id, scores,
        study_id=body.study_id, comments=body.comments,
    )
    return SuccessResponse(data=EvaluationRead.model_validate(evaluation))


@router.get(
    "",
    response_model=PaginatedResponse[EvaluationRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def list_evaluations(
    project_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    evals = eval_service.list_evaluations(session, project_id=project_id)
    return PaginatedResponse(
        data=[EvaluationRead.model_validate(e) for e in evals],
        meta=PaginationMeta(page=1, page_size=20, total=len(evals)),
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[EvaluationRead],
    dependencies=[Depends(require_permission("VIEW_DPR"))],
)
def get_evaluation(id: int, session: Session = Depends(get_session)):
    evaluation = eval_service.get_evaluation(session, id)
    return SuccessResponse(data=EvaluationRead.model_validate(evaluation))


@router.put(
    "/{id}/decide",
    response_model=SuccessResponse[EvaluationRead],
    dependencies=[Depends(require_permission("REVIEW_DPR"))],
)
def decide_evaluation(
    id: int,
    body: EvaluationDecision,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """SMFCL sets the evaluation recommendation — gates DPR creation."""
    evaluation = eval_service.decide_evaluation(
        session, id, current_user.id, body.recommendation, body.comments,
    )
    return SuccessResponse(data=EvaluationRead.model_validate(evaluation))
