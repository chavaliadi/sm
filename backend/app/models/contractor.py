from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Contractor(SQLModel, table=True):
    __tablename__ = "contractors"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    registration_number: str = Field(index=True)
    organization_type: Optional[str] = Field(default=None, index=True)
    contact_person: str
    email: str
    phone: str
    address: Optional[str] = None
    verification_document_url: Optional[str] = None
    status: str = Field(default="Registered", index=True)
    is_active: bool = Field(default=True)

    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
