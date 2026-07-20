from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel


class ProjectRead(SQLModel):
    id: int
    project_code: str
    name: str
    category: str
    state: str
    port_name: str
    stakeholder_info: Optional[str] = None
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
    funding_model: str
    estimated_cost: float
    approved_cost: Optional[float] = None
    lifecycle_stage: Optional[str] = "INITIATION"


class ProjectUpdate(SQLModel):
    project_code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    port_name: Optional[str] = None
    stakeholder_info: Optional[str] = None
    funding_model: Optional[str] = None
    estimated_cost: Optional[float] = None
    approved_cost: Optional[float] = None
    lifecycle_stage: Optional[str] = None
    is_active: Optional[bool] = None

