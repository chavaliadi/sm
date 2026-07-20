from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class ProjectEvaluation(SQLModel, table=True):
    __tablename__ = "project_evaluations"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    study_id: Optional[int] = Field(default=None, foreign_key="feasibility_studies.id")
    evaluator_id: int = Field(foreign_key="users.id")

    # Scoring criteria (JSON): technical_feasibility, financial_viability,
    # environmental_impact, strategic_priority — each 1-10
    criteria_scores: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    overall_score: Optional[float] = None

    # APPROVE_FOR_DPR / REVISE_STUDY / REJECT
    recommendation: Optional[str] = None
    comments: Optional[str] = None

    is_active: bool = Field(default=True)
    evaluated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
