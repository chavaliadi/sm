from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class BidBase(BaseModel):
    tender_id: int
    bidder_name: str

class BidCreate(BidBase):
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None

class BidUpdate(BaseModel):
    bidder_name: Optional[str] = None
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    status: Optional[str] = None

class BidRead(BidBase):
    id: int
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    status: str
    created_by: int
    updated_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
