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
