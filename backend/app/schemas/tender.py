from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TenderBase(BaseModel):
    project_id: int
    tender_code: str
    title: str

class TenderCreate(TenderBase):
    pass

class TenderUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    awarded_bid_id: Optional[int] = None

class TenderRead(TenderBase):
    id: int
    status: str
    awarded_bid_id: Optional[int] = None
    created_by: int
    updated_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TenderAuditLogRead(BaseModel):
    id: int
    tender_id: int
    actor_id: int
    action: str
    old_status: Optional[str]
    new_status: Optional[str]
    comment: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
