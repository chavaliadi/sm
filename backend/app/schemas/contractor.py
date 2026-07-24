from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel

class ContractorStatus(str, Enum):
    REGISTERED = "Registered"
    VERIFIED = "Verified"
    EMPANELLED = "Empanelled"

class OrganizationType(str, Enum):
    PRIVATE_LIMITED = "Private Limited"
    PARTNERSHIP = "Partnership"
    SOLE_PROPRIETORSHIP = "Sole Proprietorship"
    JOINT_VENTURE = "Joint Venture"
    PSU = "PSU"

class ContractorCreate(SQLModel):
    name: str
    registration_number: str
    organization_type: Optional[str] = None
    contact_person: str
    email: str
    phone: str
    address: Optional[str] = None
    verification_document_url: Optional[str] = None

class ContractorUpdate(SQLModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    organization_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    verification_document_url: Optional[str] = None

class ContractorStatusUpdate(SQLModel):
    status: ContractorStatus

class ContractorRead(SQLModel):
    id: int
    name: str
    registration_number: str
    organization_type: Optional[str] = None
    contact_person: str
    email: str
    phone: str
    address: Optional[str] = None
    verification_document_url: Optional[str] = None
    status: str
    is_active: bool
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class ContractorSummary(SQLModel):
    total_contractors: int
    registered_count: int
    verified_count: int
    empanelled_count: int
