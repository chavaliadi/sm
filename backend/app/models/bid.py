from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Bid(SQLModel, table=True):
    __tablename__ = "bids"

    id: Optional[int] = Field(default=None, primary_key=True)
    tender_id: int = Field(foreign_key="tenders.id", index=True)
    bidder_name: str
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None
    status: str = Field(default="SUBMITTED")
    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
