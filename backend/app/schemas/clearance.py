from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel

class ClearanceType(str, Enum):
    LAND_ACQUISITION = "LAND_ACQUISITION"
    CRZ = "CRZ"
    EC = "EC"
    FOREST = "FOREST"
    CTO = "CTO"
    UTILITY_SHIFTING = "UTILITY_SHIFTING"

class ClearanceStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class ClearanceCreate(SQLModel):
    project_id: int
    clearance_type: ClearanceType
    title: str
    authority_name: str
    status: Optional[ClearanceStatus] = ClearanceStatus.PENDING
    application_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    remarks: Optional[str] = None

class ClearanceUpdate(SQLModel):
    title: Optional[str] = None
    authority_name: Optional[str] = None
    status: Optional[ClearanceStatus] = None
    application_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    remarks: Optional[str] = None

class ClearanceRead(SQLModel):
    id: int
    project_id: int
    clearance_type: str
    title: str
    authority_name: str
    status: str
    application_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    document_url: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

class ClearanceExpirySummary(SQLModel):
    total_clearances: int
    expiring_soon_30_days: int
    expired_count: int
    approved_count: int
    pending_count: int

