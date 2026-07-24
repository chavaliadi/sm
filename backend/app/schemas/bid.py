from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class BidBase(BaseModel):
    tender_id: int
    bidder_name: str
    organization: Optional[str] = None
    contact_email: Optional[str] = None

class BidCreate(BidBase):
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    document_ref: Optional[str] = None

class BidUpdate(BaseModel):
    bidder_name: Optional[str] = None
    organization: Optional[str] = None
    contact_email: Optional[str] = None
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    document_ref: Optional[str] = None
    document_mime: Optional[str] = None
    signature_status: Optional[str] = None
    status: Optional[str] = None

class BidRead(BidBase):
    id: int
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    financial_rank: Optional[int] = None
    is_l1: bool
    document_ref: Optional[str] = None
    document_mime: Optional[str] = None
    signature_status: str
    submission_date: datetime
    status: str
    created_by: int
    updated_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
