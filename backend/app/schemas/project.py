from datetime import datetime
from typing import Optional
from pydantic import field_validator
from sqlmodel import SQLModel


class ProjectRead(SQLModel):
    id: int
    project_code: str
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
    is_active: bool
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ProjectCreate(SQLModel):
    project_code: str
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
    lifecycle_stage: Optional[str] = "INITIATION"

    @field_validator("project_code", "name", "category", "state", "port_name", "funding_model", mode="before")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                raise ValueError("Field cannot be empty or whitespace only")
            return v_stripped
        return v

    @field_validator("estimated_cost", "approved_cost", mode="before")
    @classmethod
    def validate_cost_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Cost cannot be negative")
        return v


class ProjectUpdate(SQLModel):
    project_code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    port_name: Optional[str] = None
    stakeholder_info: Optional[str] = None
    objectives: Optional[str] = None
    milestones: Optional[str] = None
    funding_model: Optional[str] = None
    estimated_cost: Optional[float] = None
    approved_cost: Optional[float] = None
    lifecycle_stage: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("project_code", "name", "category", "state", "port_name", "funding_model", mode="before")
    @classmethod
    def validate_non_empty_optional(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                raise ValueError("Field cannot be empty or whitespace only")
            return v_stripped
        return v

    @field_validator("estimated_cost", "approved_cost", mode="before")
    @classmethod
    def validate_cost_non_negative_optional(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Cost cannot be negative")
        return v


