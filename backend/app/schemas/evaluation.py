from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class EvaluationRecommendation:
    APPROVE_FOR_DPR = "APPROVE_FOR_DPR"
    REVISE_STUDY = "REVISE_STUDY"
    REJECT = "REJECT"


class EvaluationRead(SQLModel):
    id: int
    project_id: int
    study_id: Optional[int] = None
    evaluator_id: int
    criteria_scores: Optional[dict] = None
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    comments: Optional[str] = None
    is_active: bool
    evaluated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CriteriaScores(SQLModel):
    technical_feasibility: float  # 1-10
    financial_viability: float    # 1-10
    environmental_impact: float   # 1-10
    strategic_priority: float     # 1-10


class EvaluationCreate(SQLModel):
    project_id: int
    study_id: Optional[int] = None
    criteria_scores: CriteriaScores
    comments: Optional[str] = None


class EvaluationDecision(SQLModel):
    recommendation: str  # APPROVE_FOR_DPR / REVISE_STUDY / REJECT
    comments: Optional[str] = None
