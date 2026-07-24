"""Business logic and DB queries for Contract & Work Order Management.

Architecture rules followed:
  D1  — Route → Service → SQLModel Session. No repository layer.
  D2  — Soft delete via is_active = False. No hard deletes, no deleted_at.
  D11 — HTTPException always raised with {"code", "message", "field"} dict.
  D16 — This service only reads/writes contracts, work_orders, contract_audit_log.
        It does NOT import or write to tenders or any other module's tables.
"""

from datetime import datetime
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
    # Validate and apply status transition
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


def create_work_order(
    session: Session, wo_in: WorkOrderCreate, current_user_id: int
) -> WorkOrder:
    # Ensure parent contract exists and is active
    _get_contract_or_404(session, wo_in.contract_id)

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
