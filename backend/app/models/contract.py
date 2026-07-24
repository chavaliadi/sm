"""SQLModel table definitions for Contract & Work Order Management (Phase 2, Module 4).

Tables owned by this module:
  - contracts
  - work_orders
  - contract_audit_log

DO NOT run alembic here. Adithya (Integration Lead) runs the batched migration
after all 4 Phase 2 modules' models land on develop.
"""

from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field


# ── Contract status machine ────────────────────────────────────────────
# DRAFT      → contract created after tender award, not yet formally issued
# ISSUED     → contract document formally issued to contractor (LOA signed)
# ACTIVE     → work has commenced, contract is live
# CLOSED     → contract completed or terminated
CONTRACT_STATUSES = ["DRAFT", "ISSUED", "ACTIVE", "CLOSED"]

CONTRACT_TRANSITIONS = {
    "DRAFT":  ["ISSUED"],
    "ISSUED": ["ACTIVE", "CLOSED"],
    "ACTIVE": ["CLOSED"],
    "CLOSED": [],
}

# ── Work order status ──────────────────────────────────────────────────
WORK_ORDER_STATUSES = ["DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

WORK_ORDER_TRANSITIONS = {
    "DRAFT":       ["ISSUED"],
    "ISSUED":      ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
    "COMPLETED":   [],
    "CANCELLED":   [],
}


# ── Contract ──────────────────────────────────────────────────────────
class Contract(SQLModel, table=True):
    __tablename__ = "contracts"

    id: Optional[int] = Field(default=None, primary_key=True)

    # FK to the awarded tender (D14 — FK only, never import tender service/model)
    tender_id: int = Field(foreign_key="tenders.id", index=True)

    # FK to project (for dashboard/filtering convenience — same project as tender)
    project_id: int = Field(foreign_key="projects.id", index=True)

    # Contract identity
    contract_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None

    # Financial terms (sourced from the tender award payload at freeze)
    contract_value: Optional[float] = None   # ₹ value from tender award
    loa_reference: Optional[str] = None      # Letter of Award reference number

    # Dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    issued_date: Optional[date] = None       # date the contract was formally issued

    # Milestone terms (Phase 2 — definition only; execution tracking is Phase 3)
    milestone_terms: Optional[str] = None    # free-text / JSON blob describing milestones

    status: str = Field(default="DRAFT")
    is_active: bool = Field(default=True)

    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ── Work Order ────────────────────────────────────────────────────────
class WorkOrder(SQLModel, table=True):
    __tablename__ = "work_orders"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Parent contract
    contract_id: int = Field(foreign_key="contracts.id", index=True)

    # Work order identity
    work_order_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None

    # Scope & value
    scope_of_work: Optional[str] = None
    work_order_value: Optional[float] = None  # subset of contract value

    # Dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    status: str = Field(default="DRAFT")
    is_active: bool = Field(default=True)

    created_by: int = Field(foreign_key="users.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ── Contract Audit Log ────────────────────────────────────────────────
class ContractAuditLog(SQLModel, table=True):
    __tablename__ = "contract_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_id: int = Field(foreign_key="contracts.id", index=True)
    actor_id: int = Field(foreign_key="users.id")
    action: str                             # CREATED, STATUS_CHANGED, UPDATED, DELETED
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
