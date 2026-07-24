from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

class TenderBase(BaseModel):
    project_id: int
    tender_code: str
    title: str
    description: Optional[str] = None
    spoc_id: Optional[int] = None
    bid_submission_deadline: Optional[datetime] = None

class TenderCreate(TenderBase):
    pass

class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    spoc_id: Optional[int] = None
    awarded_bid_id: Optional[int] = None
    award_date: Optional[date] = None
    contract_value: Optional[float] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    loa_reference: Optional[str] = None
    bid_submission_deadline: Optional[datetime] = None
    bid_closing_date: Optional[datetime] = None
    evaluation_completion_date: Optional[date] = None
    tender_completion_date: Optional[date] = None

class TenderRead(TenderBase):
    id: int
    status: str
    awarded_bid_id: Optional[int] = None
    award_date: Optional[date] = None
    contract_value: Optional[float] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    loa_reference: Optional[str] = None
    bid_closing_date: Optional[datetime] = None
    evaluation_completion_date: Optional[date] = None
    tender_completion_date: Optional[date] = None
    created_by: int
    updated_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
