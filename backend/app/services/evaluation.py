"""
Project Evaluation — Service Layer.

Evaluations score a project/study on 4 criteria (1-10 each) and make a
recommendation:
  APPROVE_FOR_DPR  → project.lifecycle_stage = "cleared_for_dpr"
  REVISE_STUDY     → back to study revision cycle
  REJECT           → project.lifecycle_stage = "rejected"

DPR creation is gated on lifecycle_stage == "cleared_for_dpr".
"""
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.evaluation import ProjectEvaluation
from app.models.project import Project
from app.models.study import FeasibilityStudy
from app.schemas.evaluation import EvaluationRecommendation
from app.services.notifications import create_notification


# ── Public API ───────────────────────────────────────────────────────

def list_evaluations(session: Session, project_id: Optional[int] = None) -> list[ProjectEvaluation]:
    stmt = select(ProjectEvaluation).where(ProjectEvaluation.is_active == True)
    if project_id is not None:
        stmt = stmt.where(ProjectEvaluation.project_id == project_id)
    stmt = stmt.order_by(ProjectEvaluation.created_at.desc())
    return list(session.exec(stmt).all())


def get_evaluation(session: Session, eval_id: int) -> ProjectEvaluation:
    evaluation = session.get(ProjectEvaluation, eval_id)
    if not evaluation or not evaluation.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Evaluation not found"},
        )
    return evaluation


def create_evaluation(
    session: Session,
    project_id: int,
    evaluator_id: int,
    criteria_scores: dict,
    study_id: Optional[int] = None,
    comments: Optional[str] = None,
) -> ProjectEvaluation:
    """
    Create an evaluation with scoring. Validates:
    - Project exists and is active
    - Project lifecycle is at least "study_completed"
    - Study exists if study_id provided
    - Criteria scores are 1-10
    """
    project = session.get(Project, project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"},
        )

    # Gate: project must have completed study phase
    allowed_stages = ["study_completed", "cleared_for_dpr"]
    if project.lifecycle_stage not in allowed_stages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "LIFECYCLE_GATE",
                "message": f"Project must be in 'study_completed' stage for evaluation. Current: {project.lifecycle_stage}",
            },
        )

    if study_id:
        study = session.get(FeasibilityStudy, study_id)
        if not study or not study.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Referenced study not found"},
            )

    # Validate scores are 1-10
    score_fields = ["technical_feasibility", "financial_viability", "environmental_impact", "strategic_priority"]
    scores = criteria_scores if isinstance(criteria_scores, dict) else criteria_scores.model_dump()
    for field in score_fields:
        val = scores.get(field)
        if val is None or not (1 <= val <= 10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": f"{field} must be between 1 and 10",
                    "field": field,
                },
            )

    overall = sum(scores[f] for f in score_fields) / len(score_fields)

    evaluation = ProjectEvaluation(
        project_id=project_id,
        study_id=study_id,
        evaluator_id=evaluator_id,
        criteria_scores=scores,
        overall_score=round(overall, 2),
        comments=comments,
    )
    session.add(evaluation)
    session.commit()
    session.refresh(evaluation)
    return evaluation


def decide_evaluation(
    session: Session, eval_id: int, actor_id: int,
    recommendation: str, comments: Optional[str] = None,
) -> ProjectEvaluation:
    """
    Set the recommendation on an evaluation:
      APPROVE_FOR_DPR  → project.lifecycle_stage = "cleared_for_dpr"
      REVISE_STUDY     → sends the project back for study revision
      REJECT           → project.lifecycle_stage = "rejected"
    """
    evaluation = get_evaluation(session, eval_id)

    if evaluation.recommendation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ALREADY_DECIDED", "message": "This evaluation already has a recommendation"},
        )

    valid_recs = [EvaluationRecommendation.APPROVE_FOR_DPR,
                  EvaluationRecommendation.REVISE_STUDY,
                  EvaluationRecommendation.REJECT]
    if recommendation not in valid_recs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_RECOMMENDATION",
                "message": f"Must be one of: {valid_recs}",
            },
        )

    evaluation.recommendation = recommendation
    evaluation.comments = comments or evaluation.comments
    evaluation.evaluated_at = datetime.utcnow()
    evaluation.updated_at = datetime.utcnow()
    session.add(evaluation)

    project = session.get(Project, evaluation.project_id)

    if recommendation == EvaluationRecommendation.APPROVE_FOR_DPR:
        if project:
            project.lifecycle_stage = "cleared_for_dpr"
            project.updated_at = datetime.utcnow()
            session.add(project)
        notif_title = "Project Cleared for DPR"
        notif_msg = f"Project '{project.name}' has been evaluated (score: {evaluation.overall_score}/10) and cleared for DPR submission."

    elif recommendation == EvaluationRecommendation.REVISE_STUDY:
        if project:
            project.lifecycle_stage = "study_in_progress"
            project.updated_at = datetime.utcnow()
            session.add(project)
        notif_title = "Study Revision Required"
        notif_msg = f"Evaluation for project '{project.name}' recommends revising the feasibility study. Reason: {comments or 'N/A'}"

    elif recommendation == EvaluationRecommendation.REJECT:
        if not comments or not comments.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "COMMENT_REQUIRED", "message": "A reason must be provided when rejecting a project."},
            )
        if project:
            project.lifecycle_stage = "rejected"
            project.updated_at = datetime.utcnow()
            session.add(project)
        notif_title = "Project Rejected"
        notif_msg = f"Project '{project.name}' has been rejected during evaluation. Reason: {comments}"

    session.commit()
    session.refresh(evaluation)

    # Notify project creator
    if project and project.created_by:
        create_notification(session, project.created_by, notif_title, notif_msg)

    return evaluation
