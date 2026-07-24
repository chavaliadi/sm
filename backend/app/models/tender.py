from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

# Full 14-stage tender lifecycle per RFP 4.6.3.4
TENDER_STATUSES = [
    "DRAFT",
    "INTERNAL_APPROVAL",
    "PUBLISHED",
    "CORRIGENDUM",
    "BID_SUBMISSION",
    "BID_CLOSING",
    "TECHNICAL_EVALUATION",
    "FINANCIAL_EVALUATION",
    "FINAL_EVALUATION",
    "APPROVAL",
    "LOA_ISSUED",
    "CONTRACT_GENERATED",
    "AWARDED",
    "CLOSED",
]

TENDER_TRANSITIONS = {
    "DRAFT":               ["INTERNAL_APPROVAL"],
    "INTERNAL_APPROVAL":   ["PUBLISHED", "DRAFT"],
    "PUBLISHED":           ["CORRIGENDUM", "BID_SUBMISSION"],
    "CORRIGENDUM":         ["BID_SUBMISSION"],
    "BID_SUBMISSION":      ["BID_CLOSING"],
    "BID_CLOSING":         ["TECHNICAL_EVALUATION"],
    "TECHNICAL_EVALUATION":["FINANCIAL_EVALUATION"],
    "FINANCIAL_EVALUATION":["FINAL_EVALUATION"],
    "FINAL_EVALUATION":    ["APPROVAL"],
    "APPROVAL":            ["LOA_ISSUED"],
    "LOA_ISSUED":          ["CONTRACT_GENERATED"],
    "CONTRACT_GENERATED":  ["AWARDED"],
    "AWARDED":             ["CLOSED"],
    "CLOSED":              [],
}


class Tender(SQLModel, table=True):
    __tablename__ = "tenders"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    tender_code: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    status: str = Field(default="DRAFT")

    # SPOC assignment
    spoc_id: Optional[int] = Field(default=None, foreign_key="users.id")

    # Award management fields
    awarded_bid_id: Optional[int] = Field(default=None, foreign_key="bids.id")
    award_date: Optional[date] = None
    contract_value: Optional[float] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    loa_reference: Optional[str] = None

    # Key milestone dates
    bid_submission_deadline: Optional[datetime] = None
    bid_closing_date: Optional[datetime] = None
    evaluation_completion_date: Optional[date] = None
    tender_completion_date: Optional[date] = None

    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TenderAuditLog(SQLModel, table=True):
    __tablename__ = "tender_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    tender_id: int = Field(foreign_key="tenders.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
