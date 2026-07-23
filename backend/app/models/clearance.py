from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Clearance(SQLModel, table=True):
    __tablename__ = "clearances"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    clearance_type: str = Field(index=True)  # LAND_ACQUISITION, CRZ, EC, FOREST, CTO, UTILITY_SHIFTING
    title: str
    authority_name: str
    status: str = Field(default="PENDING", index=True)  # PENDING, APPROVED, REJECTED, EXPIRED
    application_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool = Field(default=True)

    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

