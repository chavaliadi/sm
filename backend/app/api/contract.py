"""API route handlers for Contract & Work Order Management.

Prefix  : /contracts
Tags    : Contracts

Permissions used (tell Adithya to add these to permissions.py):
  VIEW_CONTRACTS      — read contracts and work orders
  MANAGE_CONTRACTS    — create / update / delete contracts
  MANAGE_WORK_ORDERS  — create / update / delete work orders
  VIEW_AUDIT_LOG      — read contract audit trail (reuses existing permission)

Rules followed:
  D5  — require_permission() only, never role string checks
  D7  — standard data/meta/error envelope via PaginatedResponse / SuccessResponse
  D11 — HTTPException always with {"code", "message", "field"}
  D12 — routes always return *Read schemas, never raw SQLModel objects
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import require_permission
from app.db.session import get_session
from app.models.auth import User
from app.schemas.contract import (
    ContractAuditLogRead,
    ContractCreate,
    ContractRead,
    ContractUpdate,
    WorkOrderCreate,
    WorkOrderRead,
    WorkOrderUpdate,
)
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.services import contract_service

router = APIRouter(prefix="/contracts", tags=["Contracts"])


# ═══════════════════════════════════════════════════════════════════════
# Contract endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.get("", response_model=PaginatedResponse[ContractRead])
def get_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[int] = Query(default=None),
    tender_id: Optional[int] = Query(default=None),
    contract_status: Optional[str] = Query(default=None, alias="status"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_CONTRACTS")),
):
    contracts, total = contract_service.list_contracts(
        session,
        page=page,
        page_size=page_size,
        project_id=project_id,
        tender_id=tender_id,
        contract_status=contract_status,
    )
    return PaginatedResponse(
        data=[ContractRead.model_validate(c) for c in contracts],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/{contract_id}", response_model=SuccessResponse[ContractRead])
def get_contract(
    contract_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_CONTRACTS")),
):
    contract = contract_service.get_contract_by_id(session, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    return SuccessResponse(data=ContractRead.model_validate(contract))


@router.post("", response_model=SuccessResponse[ContractRead], status_code=status.HTTP_201_CREATED)
def create_contract(
    contract_in: ContractCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_CONTRACTS")),
):
    if contract_service.get_contract_by_number(session, contract_in.contract_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_CONTRACT_NUMBER",
                "message": f"Contract number '{contract_in.contract_number}' already exists.",
                "field": "contract_number",
            },
        )
    contract = contract_service.create_contract(session, contract_in, current_user.id)
    return SuccessResponse(data=ContractRead.model_validate(contract))


@router.put("/{contract_id}", response_model=SuccessResponse[ContractRead])
def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_CONTRACTS")),
):
    db_contract = contract_service.get_contract_by_id(session, contract_id)
    if not db_contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    updated = contract_service.update_contract(session, db_contract, contract_in, current_user.id)
    return SuccessResponse(data=ContractRead.model_validate(updated))


@router.delete("/{contract_id}", response_model=SuccessResponse[ContractRead])
def delete_contract(
    contract_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_CONTRACTS")),
):
    db_contract = contract_service.get_contract_by_id(session, contract_id)
    if not db_contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    deleted = contract_service.delete_contract(session, db_contract, current_user.id)
    return SuccessResponse(data=ContractRead.model_validate(deleted))


@router.get("/{contract_id}/audit", response_model=PaginatedResponse[ContractAuditLogRead])
def get_contract_audit(
    contract_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_AUDIT_LOG")),
):
    logs = contract_service.get_contract_audit_trail(session, contract_id)
    return PaginatedResponse(
        data=[ContractAuditLogRead.model_validate(log) for log in logs],
        meta=PaginationMeta(page=1, page_size=len(logs), total=len(logs)),
    )


# ═══════════════════════════════════════════════════════════════════════
# Work Order endpoints (nested under /contracts/{contract_id}/work-orders)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/{contract_id}/work-orders", response_model=PaginatedResponse[WorkOrderRead])
def get_work_orders(
    contract_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_CONTRACTS")),
):
    # Ensure parent contract exists
    db_contract = contract_service.get_contract_by_id(session, contract_id)
    if not db_contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    work_orders, total = contract_service.list_work_orders(session, contract_id, page, page_size)
    return PaginatedResponse(
        data=[WorkOrderRead.model_validate(wo) for wo in work_orders],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post(
    "/{contract_id}/work-orders",
    response_model=SuccessResponse[WorkOrderRead],
    status_code=status.HTTP_201_CREATED,
)
def create_work_order(
    contract_id: int,
    wo_in: WorkOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_WORK_ORDERS")),
):
    # Ensure parent contract exists
    db_contract = contract_service.get_contract_by_id(session, contract_id)
    if not db_contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Contract {contract_id} not found", "field": None},
        )
    if contract_service.get_work_order_by_number(session, wo_in.work_order_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_WORK_ORDER_NUMBER",
                "message": f"Work order number '{wo_in.work_order_number}' already exists.",
                "field": "work_order_number",
            },
        )
    # Force contract_id from URL path — don't trust request body
    wo_in.contract_id = contract_id
    wo = contract_service.create_work_order(session, wo_in, current_user.id)
    return SuccessResponse(data=WorkOrderRead.model_validate(wo))


@router.put(
    "/{contract_id}/work-orders/{work_order_id}",
    response_model=SuccessResponse[WorkOrderRead],
)
def update_work_order(
    contract_id: int,
    work_order_id: int,
    wo_in: WorkOrderUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_WORK_ORDERS")),
):
    db_wo = contract_service.get_work_order_by_id(session, work_order_id)
    if not db_wo or db_wo.contract_id != contract_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Work order {work_order_id} not found", "field": None},
        )
    updated = contract_service.update_work_order(session, db_wo, wo_in, current_user.id)
    return SuccessResponse(data=WorkOrderRead.model_validate(updated))


@router.delete(
    "/{contract_id}/work-orders/{work_order_id}",
    response_model=SuccessResponse[WorkOrderRead],
)
def delete_work_order(
    contract_id: int,
    work_order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_WORK_ORDERS")),
):
    db_wo = contract_service.get_work_order_by_id(session, work_order_id)
    if not db_wo or db_wo.contract_id != contract_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Work order {work_order_id} not found", "field": None},
        )
    deleted = contract_service.delete_work_order(session, db_wo, current_user.id)
    return SuccessResponse(data=WorkOrderRead.model_validate(deleted))
