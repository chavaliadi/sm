"""Business logic and DB queries for Contract & Work Order Management.

Architecture rules followed:
  D1  — Route → Service → SQLModel Session. No repository layer.
  D2  — Soft delete via is_active = False. No hard deletes, no deleted_at.
  D11 — HTTPException always raised with {"code", "message", "field"} dict.
  D16 — This service only reads/writes contracts, work_orders, contract_audit_log.
        It does NOT import or write to tenders or any other module's tables.
"""

from datetime import datetime, date
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.contract import (
    Contract,
    ContractAuditLog,
    CONTRACT_TRANSITIONS,
    WorkOrder,
    WORK_ORDER_TRANSITIONS,
)
from app.models.tender import Tender
from app.schemas.contract import ContractCreate, ContractUpdate, WorkOrderCreate, WorkOrderUpdate


# ── Helpers ───────────────────────────────────────────────────────────

def _get_contract_or_404(session: Session, contract_id: int) -> Contract:
    contract = session.exec(
        select(Contract).where(Contract.id == contract_id, Contract.is_active == True)
    ).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    return contract


def _get_work_order_or_404(session: Session, work_order_id: int) -> WorkOrder:
    wo = session.exec(
        select(WorkOrder).where(WorkOrder.id == work_order_id, WorkOrder.is_active == True)
    ).first()
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Work order {work_order_id} not found", "field": None},
        )
    return wo


def _all_work_orders_completed(session: Session, contract_id: int) -> bool:
    """Returns True if every active work order under the contract is COMPLETED."""
    work_orders = session.exec(
        select(WorkOrder).where(WorkOrder.contract_id == contract_id, WorkOrder.is_active == True)
    ).all()
    if not work_orders:
        return True  # No work orders — treat as completed
    return all(wo.status == "COMPLETED" for wo in work_orders)


def _write_audit(
    session: Session,
    contract_id: int,
    actor_id: int,
    action: str,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    comment: Optional[str] = None,
) -> None:
    session.add(ContractAuditLog(
        contract_id=contract_id,
        actor_id=actor_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        comment=comment,
    ))


# ═══════════════════════════════════════════════════════════════════════
# Contract CRUD
# ═══════════════════════════════════════════════════════════════════════

def get_contract_by_number(session: Session, contract_number: str) -> Optional[Contract]:
    return session.exec(
        select(Contract).where(
            Contract.contract_number == contract_number,
            Contract.is_active == True,
        )
    ).first()


def get_contract_by_id(session: Session, contract_id: int) -> Optional[Contract]:
    return session.exec(
        select(Contract).where(Contract.id == contract_id, Contract.is_active == True)
    ).first()


def list_contracts(
    session: Session,
    page: int = 1,
    page_size: int = 20,
    project_id: Optional[int] = None,
    tender_id: Optional[int] = None,
    contract_status: Optional[str] = None,
) -> Tuple[List[Contract], int]:
    statement = select(Contract).where(Contract.is_active == True)
    if project_id:
        statement = statement.where(Contract.project_id == project_id)
    if tender_id:
        statement = statement.where(Contract.tender_id == tender_id)
    if contract_status:
        statement = statement.where(Contract.status == contract_status)

    total = len(session.exec(statement).all())
    contracts = session.exec(
        statement.offset((page - 1) * page_size).limit(page_size)
    ).all()
    return contracts, total


def create_contract(
    session: Session, contract_in: ContractCreate, current_user_id: int
) -> Contract:
    tender = session.exec(
        select(Tender).where(Tender.id == contract_in.tender_id, Tender.is_active == True)
    ).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "TENDER_NOT_FOUND",
                "message": f"Tender {contract_in.tender_id} does not exist.",
                "field": "tender_id",
            },
        )
    if tender.status != "AWARDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "TENDER_NOT_AWARDED",
                "message": (
                    f"Tender {contract_in.tender_id} must be AWARDED before a contract can "
                    f"be created (current status: {tender.status})."
                ),
                "field": "tender_id",
            },
        )

    # ── LOA Date Rules (D3 — backend must mirror frontend guards) ──────
    # Rule 1: start_date must exactly match the LOA commencement date
    if tender.contract_start_date and contract_in.start_date:
        if str(contract_in.start_date) != str(tender.contract_start_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "START_DATE_MISMATCH",
                    "message": (
                        f"Contract start date ({contract_in.start_date}) must match "
                        f"the LOA commencement date ({tender.contract_start_date})."
                    ),
                    "field": "start_date",
                },
            )

    # Rule 2: end_date must be >= LOA target completion date
    if tender.contract_end_date and contract_in.end_date:
        if str(contract_in.end_date) < str(tender.contract_end_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "END_DATE_BEFORE_LOA",
                    "message": (
                        f"Contract end date ({contract_in.end_date}) cannot be earlier than "
                        f"the LOA target completion date ({tender.contract_end_date}). "
                        f"It must be equal to or later."
                    ),
                    "field": "end_date",
                },
            )

    contract = Contract(
        **contract_in.model_dump(),
        created_by=current_user_id,
        status="DRAFT",
    )
    session.add(contract)
    session.commit()
    session.refresh(contract)

    _write_audit(
        session, contract.id, current_user_id,
        "CREATED", new_status="DRAFT", comment="Contract created",
    )
    session.commit()
    return contract


def update_contract(
    session: Session,
    db_contract: Contract,
    contract_in: ContractUpdate,
    current_user_id: int,
) -> Contract:
    # ── Immutability: CLOSED contracts cannot be edited ────────────────
    if db_contract.status == "CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CONTRACT_CLOSED",
                "message": "This contract is CLOSED and cannot be edited.",
                "field": "status",
            },
        )

    # ── Status transition validation ──────────────────────────────────
    if contract_in.status and contract_in.status != db_contract.status:
        allowed = CONTRACT_TRANSITIONS.get(db_contract.status, [])
        if contract_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATE_TRANSITION",
                    "message": (
                        f"Cannot move contract from '{db_contract.status}' to "
                        f"'{contract_in.status}'. Allowed: {allowed}"
                    ),
                    "field": "status",
                },
            )

        # ── Closure rules when transitioning to CLOSED ────────────────
        if contract_in.status == "CLOSED":
            today = date.today()
            is_natural_closure = (
                db_contract.end_date is not None
                and today >= db_contract.end_date
                and _all_work_orders_completed(session, db_contract.id)
            )

            if is_natural_closure:
                # Auto-set closure reason — no remarks required
                contract_in.closure_reason = "COMPLETED"
            else:
                # Manual early closure — requires reason + remarks
                if not contract_in.closure_reason:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "code": "CLOSURE_REASON_REQUIRED",
                            "message": (
                                "A closure reason is required for manual early closure. "
                                "Choose from: TERMINATED_DEFAULT, SHORT_CLOSED_MUTUAL, FORCE_MAJEURE."
                            ),
                            "field": "closure_reason",
                        },
                    )
                if not contract_in.closure_remarks or len(contract_in.closure_remarks.strip()) < 10:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "code": "CLOSURE_REMARKS_REQUIRED",
                            "message": (
                                "Closure remarks are mandatory for manual early closure "
                                "and must be at least 10 characters."
                            ),
                            "field": "closure_remarks",
                        },
                    )

        old_status = db_contract.status
        db_contract.status = contract_in.status
        _write_audit(
            session, db_contract.id, current_user_id,
            "STATUS_CHANGED", old_status=old_status, new_status=contract_in.status,
            comment=f"Status changed to {contract_in.status}",
        )

    # Apply all other fields
    update_fields = contract_in.model_dump(exclude_unset=True, exclude={"status"})
    for field, value in update_fields.items():
        setattr(db_contract, field, value)

    db_contract.updated_by = current_user_id
    db_contract.updated_at = datetime.utcnow()
    session.add(db_contract)
    session.commit()
    session.refresh(db_contract)
    return db_contract


def delete_contract(
    session: Session, db_contract: Contract, current_user_id: int
) -> Contract:
    if db_contract.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DELETE_NOT_ALLOWED",
                "message": "Only DRAFT contracts can be deleted.",
                "field": "status",
            },
        )
    db_contract.is_active = False
    db_contract.updated_by = current_user_id
    db_contract.updated_at = datetime.utcnow()
    _write_audit(
        session, db_contract.id, current_user_id,
        "DELETED", comment="Contract soft deleted",
    )
    session.add(db_contract)
    session.commit()
    return db_contract


def get_contract_audit_trail(
    session: Session, contract_id: int
) -> List[ContractAuditLog]:
    _get_contract_or_404(session, contract_id)
    return list(session.exec(
        select(ContractAuditLog)
        .where(ContractAuditLog.contract_id == contract_id)
        .order_by(ContractAuditLog.timestamp.asc())
    ).all())


# ═══════════════════════════════════════════════════════════════════════
# Work Order CRUD
# ═══════════════════════════════════════════════════════════════════════

def get_work_order_by_number(session: Session, work_order_number: str) -> Optional[WorkOrder]:
    return session.exec(
        select(WorkOrder).where(
            WorkOrder.work_order_number == work_order_number,
            WorkOrder.is_active == True,
        )
    ).first()


def get_work_order_by_id(session: Session, work_order_id: int) -> Optional[WorkOrder]:
    return session.exec(
        select(WorkOrder).where(WorkOrder.id == work_order_id, WorkOrder.is_active == True)
    ).first()


def list_work_orders(
    session: Session,
    contract_id: int,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[WorkOrder], int]:
    statement = (
        select(WorkOrder)
        .where(WorkOrder.contract_id == contract_id, WorkOrder.is_active == True)
    )
    total = len(session.exec(statement).all())
    work_orders = session.exec(
        statement.offset((page - 1) * page_size).limit(page_size)
    ).all()
    return work_orders, total


def _validate_work_order_constraints(
    session: Session,
    contract: Contract,
    work_order_value: Optional[float],
    start_date,
    end_date,
    exclude_wo_id: Optional[int] = None,
) -> None:
    """Enforce all 3 work order constraint rules against the parent contract."""

    # Rule 1: Parent contract must be ISSUED or ACTIVE
    if contract.status not in ("ISSUED", "ACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CONTRACT_NOT_OPEN",
                "message": (
                    f"Work orders can only be created or modified when the parent contract "
                    f"is ISSUED or ACTIVE (current status: {contract.status})."
                ),
                "field": "contract_id",
            },
        )

    # Rule 2: Financial budget cap — sum of all active WO values ≤ contract_value
    if work_order_value is not None and contract.contract_value is not None:
        existing_wos = session.exec(
            select(WorkOrder).where(
                WorkOrder.contract_id == contract.id,
                WorkOrder.is_active == True,
                WorkOrder.status.not_in(["CANCELLED"]),  # type: ignore[attr-defined]
            )
        ).all()
        existing_total = sum(
            (wo.work_order_value or 0)
            for wo in existing_wos
            if wo.id != exclude_wo_id  # exclude self when updating
        )
        if existing_total + work_order_value > contract.contract_value:
            remaining = contract.contract_value - existing_total
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EXCEEDS_CONTRACT_VALUE",
                    "message": (
                        f"Work order value (₹{work_order_value:,.2f}) exceeds the remaining "
                        f"contract budget (₹{remaining:,.2f}). "
                        f"Total contract value: ₹{contract.contract_value:,.2f}."
                    ),
                    "field": "work_order_value",
                },
            )

    # Rule 3: Date boundaries — WO dates must fall within contract start/end dates
    if start_date and contract.start_date:
        if start_date < contract.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "WO_START_BEFORE_CONTRACT",
                    "message": (
                        f"Work order start date ({start_date}) cannot be before "
                        f"the contract start date ({contract.start_date})."
                    ),
                    "field": "start_date",
                },
            )
    if end_date and contract.end_date:
        if end_date > contract.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "WO_END_AFTER_CONTRACT",
                    "message": (
                        f"Work order end date ({end_date}) cannot be after "
                        f"the contract end date ({contract.end_date})."
                    ),
                    "field": "end_date",
                },
            )
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "WO_END_BEFORE_START",
                "message": "Work order end date cannot be before its start date.",
                "field": "end_date",
            },
        )


def create_work_order(
    session: Session, wo_in: WorkOrderCreate, current_user_id: int
) -> WorkOrder:
    # Fetch parent contract (ensures it exists and is active)
    contract = _get_contract_or_404(session, wo_in.contract_id)

    # Enforce all 3 work order constraints
    _validate_work_order_constraints(
        session,
        contract,
        work_order_value=wo_in.work_order_value,
        start_date=wo_in.start_date,
        end_date=wo_in.end_date,
    )

    wo = WorkOrder(
        **wo_in.model_dump(),
        created_by=current_user_id,
        status="DRAFT",
    )
    session.add(wo)
    session.commit()
    session.refresh(wo)
    return wo


def update_work_order(
    session: Session,
    db_wo: WorkOrder,
    wo_in: WorkOrderUpdate,
    current_user_id: int,
) -> WorkOrder:
    # Fetch parent contract to run constraint checks
    contract = _get_contract_or_404(session, db_wo.contract_id)

    # Determine what is actually changing
    is_status_only_update = (
        wo_in.status is not None
        and wo_in.work_order_value is None
        and wo_in.start_date is None
        and wo_in.end_date is None
        and wo_in.title is None
        and wo_in.scope_of_work is None
    )

    if not is_status_only_update:
        # Re-run all constraints for value/date changes
        new_value = wo_in.work_order_value if wo_in.work_order_value is not None else db_wo.work_order_value
        new_start = wo_in.start_date if wo_in.start_date is not None else db_wo.start_date
        new_end = wo_in.end_date if wo_in.end_date is not None else db_wo.end_date

        _validate_work_order_constraints(
            session,
            contract,
            work_order_value=new_value,
            start_date=new_start,
            end_date=new_end,
            exclude_wo_id=db_wo.id,
        )

    # Validate and apply status transition
    if wo_in.status and wo_in.status != db_wo.status:
        allowed = WORK_ORDER_TRANSITIONS.get(db_wo.status, [])
        if wo_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATE_TRANSITION",
                    "message": (
                        f"Cannot move work order from '{db_wo.status}' to "
                        f"'{wo_in.status}'. Allowed: {allowed}"
                    ),
                    "field": "status",
                },
            )

        # ── COMPLETED: require completion_remarks ─────────────────────
        if wo_in.status == "COMPLETED":
            if not wo_in.completion_remarks or len(wo_in.completion_remarks.strip()) < 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "COMPLETION_REMARKS_REQUIRED",
                        "message": (
                            "Completion remarks are mandatory when marking a work order as COMPLETED "
                            "and must be at least 10 characters."
                        ),
                        "field": "completion_remarks",
                    },
                )

        # ── CANCELLED: require reason + remarks ───────────────────────
        if wo_in.status == "CANCELLED":
            if not wo_in.cancellation_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "CANCELLATION_REASON_REQUIRED",
                        "message": "A cancellation reason is required when cancelling a work order.",
                        "field": "cancellation_reason",
                    },
                )
            if not wo_in.cancellation_remarks or len(wo_in.cancellation_remarks.strip()) < 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "CANCELLATION_REMARKS_REQUIRED",
                        "message": (
                            "Cancellation remarks are mandatory and must be at least 10 characters."
                        ),
                        "field": "cancellation_remarks",
                    },
                )

        db_wo.status = wo_in.status

    update_fields = wo_in.model_dump(exclude_unset=True, exclude={"status"})
    for field, value in update_fields.items():
        setattr(db_wo, field, value)

    db_wo.updated_by = current_user_id
    db_wo.updated_at = datetime.utcnow()
    session.add(db_wo)
    session.commit()
    session.refresh(db_wo)
    return db_wo


def delete_work_order(
    session: Session, db_wo: WorkOrder, current_user_id: int
) -> WorkOrder:
    if db_wo.status not in ("DRAFT", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DELETE_NOT_ALLOWED",
                "message": "Only DRAFT or CANCELLED work orders can be deleted.",
                "field": "status",
            },
        )
    db_wo.is_active = False
    db_wo.updated_by = current_user_id
    db_wo.updated_at = datetime.utcnow()
    session.add(db_wo)
    session.commit()
    return db_wo
