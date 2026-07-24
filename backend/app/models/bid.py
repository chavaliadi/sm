from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

ALLOWED_BID_EXTENSIONS = {".pdf", ".docx", ".doc", ".xlsx", ".zip"}
MAX_BID_FILE_MB = 20

BID_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "TECHNICALLY_QUALIFIED",
                "TECHNICALLY_DISQUALIFIED", "L1", "L2", "L3", "AWARDED", "REJECTED"]


class Bid(SQLModel, table=True):
    __tablename__ = "bids"

    id: Optional[int] = Field(default=None, primary_key=True)
    tender_id: int = Field(foreign_key="tenders.id", index=True)

    # Bidder identity
    bidder_name: str
    organization: Optional[str] = None
    contact_email: Optional[str] = None

    # Evaluation scores
    technical_score: Optional[float] = None
    financial_amount: Optional[float] = None

    # Ranking (set by evaluation engine)
    financial_rank: Optional[int] = None   # L1=1, L2=2, L3=3...
    is_l1: bool = Field(default=False)

    # Document & compliance
    document_ref: Optional[str] = None        # filename/path of uploaded doc
    document_mime: Optional[str] = None       # validated MIME type
    signature_status: str = Field(default="PENDING")  # PENDING / VERIFIED / INVALID

    # Dates
    submission_date: datetime = Field(default_factory=datetime.utcnow)

    status: str = Field(default="SUBMITTED")
    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
