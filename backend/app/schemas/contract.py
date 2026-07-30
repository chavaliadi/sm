"""Pydantic schemas for the Contract & Work Order Management API.

Rules followed:
  D7  — every route returns data/meta/error envelopes (handled in api/contract.py)
  D12 — routes always return *Read schemas, never raw SQLModel objects
  D10 — types mirror backend fields field-for-field so frontend TS stays in sync
"""

from datetime import datetime, date
from typing import Literal, Optional

ClosureReason = Literal[
    "COMPLETED",
    "TERMINATED_DEFAULT",
    "SHORT_CLOSED_MUTUAL",
    "FORCE_MAJEURE",
]
from pydantic import BaseModel


# ── Literals ──────────────────────────────────────────────────────────
ContractStatus = Literal["DRAFT", "ISSUED", "ACTIVE", "CLOSED"]
WorkOrderStatus = Literal["DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
CancellationReason = Literal[
    "SCOPE_CHANGE",
    "CONTRACTOR_DEFAULT",
    "MUTUAL_AGREEMENT",
    "OTHER",
]


# ═══════════════════════════════════════════════════════════════════════
# Contract schemas
# ═══════════════════════════════════════════════════════════════════════

class ContractBase(BaseModel):
    tender_id: int
    project_id: int
    contract_number: str
    title: str
    description: Optional[str] = None
    contract_value: Optional[float] = None
    loa_reference: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    issued_date: Optional[date] = None
    milestone_terms: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ContractStatus] = None
    contract_value: Optional[float] = None
    loa_reference: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    issued_date: Optional[date] = None
    milestone_terms: Optional[str] = None
    closure_reason: Optional[ClosureReason] = None
    closure_remarks: Optional[str] = None


class ContractRead(ContractBase):
    id: int
    status: ContractStatus
    is_active: bool
    closure_reason: Optional[ClosureReason] = None
    closure_remarks: Optional[str] = None
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════
# Work Order schemas
# ═══════════════════════════════════════════════════════════════════════

class WorkOrderBase(BaseModel):
    contract_id: int
    work_order_number: str
    title: str
    description: Optional[str] = None
    scope_of_work: Optional[str] = None
    work_order_value: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkOrderStatus] = None
    scope_of_work: Optional[str] = None
    work_order_value: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    completion_remarks: Optional[str] = None
    cancellation_reason: Optional[CancellationReason] = None
    cancellation_remarks: Optional[str] = None


class WorkOrderRead(WorkOrderBase):
    id: int
    status: WorkOrderStatus
    is_active: bool
    completion_remarks: Optional[str] = None
    cancellation_reason: Optional[CancellationReason] = None
    cancellation_remarks: Optional[str] = None
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Audit log read schema ─────────────────────────────────────────────
class ContractAuditLogRead(BaseModel):
    id: int
    contract_id: int
    actor_id: int
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
