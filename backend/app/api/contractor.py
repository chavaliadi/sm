from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import require_permission, get_current_user
from app.models.auth import User
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.schemas.contractor import (
    ContractorRead,
    ContractorCreate,
    ContractorUpdate,
    ContractorStatusUpdate,
    ContractorSummary,
)
from app.services import contractor_service
from app.services.audit import log_action

router = APIRouter(prefix="/api/contractors", tags=["Contractors"])

# Permission constants for Contractor endpoints.
# Currently using Stakeholder permissions as a temporary fallback.
# TODO: Replace "VIEW_STAKEHOLDERS" with "VIEW_CONTRACTORS" when VIEW_CONTRACTORS permission is officially added to RBAC.
CONTRACTOR_VIEW_PERMISSION = "VIEW_CONTRACTORS"

# TODO: Replace "MANAGE_STAKEHOLDERS" with "MANAGE_CONTRACTORS" when MANAGE_CONTRACTORS permission is officially added to RBAC.
CONTRACTOR_MANAGE_PERMISSION = "MANAGE_CONTRACTORS"


@router.get("", response_model=PaginatedResponse[ContractorRead])
def list_contractors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (Registered, Verified, Empanelled)"),
    organization_type: Optional[str] = Query(None, description="Filter by organization type"),
    search: Optional[str] = Query(None, description="Search by name, reg no, contact person, or email"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission(CONTRACTOR_VIEW_PERMISSION)),  # TODO: Replace with VIEW_CONTRACTORS
):
    """
    List registered contractors with pagination, search, and filtering.
    """
    contractors, total = contractor_service.list_contractors(
        session=session,
        page=page,
        page_size=page_size,
        status_filter=status,
        organization_type=organization_type,
        search=search,
    )
    return PaginatedResponse(
        data=[ContractorRead.model_validate(c) for c in contractors],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/summary", response_model=SuccessResponse[ContractorSummary])
def get_contractor_summary(
    session: Session = Depends(get_session),
    _: User = Depends(require_permission(CONTRACTOR_VIEW_PERMISSION)),  # TODO: Replace with VIEW_CONTRACTORS
):
    """
    Retrieve empanelment status summary metrics for contractor KPI cards.
    """
    summary = contractor_service.get_contractor_summary(session)
    return SuccessResponse(data=summary)


@router.get("/{contractor_id}", response_model=SuccessResponse[ContractorRead])
def get_contractor(
    contractor_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission(CONTRACTOR_VIEW_PERMISSION)),  # TODO: Replace with VIEW_CONTRACTORS
):
    """
    Retrieve details of a single contractor by ID.
    """
    contractor = contractor_service.get_contractor_by_id(session, contractor_id)
    if not contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTRACTOR_NOT_FOUND", "message": f"Contractor with ID {contractor_id} not found"},
        )
    return SuccessResponse(data=ContractorRead.model_validate(contractor))


@router.post("", response_model=SuccessResponse[ContractorRead], status_code=status.HTTP_201_CREATED)
def create_contractor(
    contractor_in: ContractorCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission(CONTRACTOR_MANAGE_PERMISSION)),  # TODO: Replace with MANAGE_CONTRACTORS
):
    """
    Register a new contractor. Default status is 'Registered'.
    """
    contractor = contractor_service.create_contractor(
        session=session, contractor_in=contractor_in, current_user_id=current_user.id
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    log_action(
        session,
        user_id=current_user.id,
        action="CONTRACTOR_CREATED",
        entity_type="Contractor",
        entity_id=contractor.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=ContractorRead.model_validate(contractor))


@router.put("/{contractor_id}", response_model=SuccessResponse[ContractorRead])
def update_contractor(
    contractor_id: int,
    contractor_in: ContractorUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission(CONTRACTOR_MANAGE_PERMISSION)),  # TODO: Replace with MANAGE_CONTRACTORS
):
    """
    Update contractor profile information.
    """
    db_contractor = contractor_service.get_contractor_by_id(session, contractor_id)
    if not db_contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTRACTOR_NOT_FOUND", "message": f"Contractor with ID {contractor_id} not found"},
        )

    updated = contractor_service.update_contractor(
        session=session, db_contractor=db_contractor, contractor_in=contractor_in, current_user_id=current_user.id
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    log_action(
        session,
        user_id=current_user.id,
        action="CONTRACTOR_UPDATED",
        entity_type="Contractor",
        entity_id=updated.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=ContractorRead.model_validate(updated))


@router.patch("/{contractor_id}/status", response_model=SuccessResponse[ContractorRead])
def update_contractor_status(
    contractor_id: int,
    status_in: ContractorStatusUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission(CONTRACTOR_MANAGE_PERMISSION)),  # TODO: Replace with MANAGE_CONTRACTORS
):
    """
    Transition contractor empanelment status (Registered -> Verified -> Empanelled).
    """
    db_contractor = contractor_service.get_contractor_by_id(session, contractor_id)
    if not db_contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTRACTOR_NOT_FOUND", "message": f"Contractor with ID {contractor_id} not found"},
        )

    updated = contractor_service.update_contractor_status(
        session=session,
        db_contractor=db_contractor,
        new_status=status_in.status.value if hasattr(status_in.status, "value") else str(status_in.status),
        current_user_id=current_user.id,
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    log_action(
        session,
        user_id=current_user.id,
        action="CONTRACTOR_STATUS_CHANGED",
        entity_type="Contractor",
        entity_id=updated.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=ContractorRead.model_validate(updated))


@router.delete("/{contractor_id}", response_model=SuccessResponse[ContractorRead])
def delete_contractor(
    contractor_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission(CONTRACTOR_MANAGE_PERMISSION)),  # TODO: Replace with MANAGE_CONTRACTORS
):
    """
    Soft delete a contractor record.
    """
    db_contractor = contractor_service.get_contractor_by_id(session, contractor_id)
    if not db_contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTRACTOR_NOT_FOUND", "message": f"Contractor with ID {contractor_id} not found"},
        )

    deleted = contractor_service.delete_contractor(
        session=session, db_contractor=db_contractor, current_user_id=current_user.id
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    log_action(
        session,
        user_id=current_user.id,
        action="CONTRACTOR_DELETED",
        entity_type="Contractor",
        entity_id=contractor_id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=ContractorRead.model_validate(deleted))
