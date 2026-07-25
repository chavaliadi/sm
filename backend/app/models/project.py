from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_code: str = Field(unique=True, index=True)
    name: str
    category: str
    state: str
    port_name: str
    stakeholder_info: Optional[str] = None
    objectives: Optional[str] = None
    milestones: Optional[str] = None
    funding_model: str
    estimated_cost: float
    approved_cost: Optional[float] = None
    lifecycle_stage: str
    is_active: bool = Field(default=True)

    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
