from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import require_permission
from app.models.auth import User
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.schemas.clearance import (
    ClearanceRead,
    ClearanceCreate,
    ClearanceUpdate,
    ClearanceDocumentRead,
    ClearanceDocumentCreate,
    ClearanceExpirySummary
)
from app.services import clearance_service

router = APIRouter(prefix="/api/clearances", tags=["Land Acquisition & Clearances"])


@router.get("", response_model=PaginatedResponse[ClearanceRead])
def list_clearances(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    clearance_type: Optional[str] = Query(None, description="Filter by clearance type"),
    status: Optional[str] = Query(None, description="Filter by clearance status"),
    expiring_soon: bool = Query(False, description="Filter clearances expiring within 30 days"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    List all statutory clearances with pagination and filtering.
    """
    clearances, total = clearance_service.list_clearances(
        session=session,
        page=page,
        page_size=page_size,
        project_id=project_id,
        clearance_type=clearance_type,
        status_filter=status,
        expiring_soon=expiring_soon,
    )
    return PaginatedResponse(
        data=[ClearanceRead.model_validate(c) for c in clearances],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/summary", response_model=SuccessResponse[ClearanceExpirySummary])
def get_clearance_expiry_summary(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    Retrieve expiry and status summary metrics for clearance monitoring.
    """
    summary = clearance_service.get_expiry_summary(session, project_id=project_id)
    return SuccessResponse(data=summary)


@router.get("/{clearance_id}", response_model=SuccessResponse[ClearanceRead])
def get_clearance(
    clearance_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    Retrieve details of a single clearance by ID.
    """
    clearance = clearance_service.get_clearance_by_id(session, clearance_id)
    if not clearance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Clearance with ID {clearance_id} not found"},
        )
    return SuccessResponse(data=ClearanceRead.model_validate(clearance))


@router.post("", response_model=SuccessResponse[ClearanceRead], status_code=status.HTTP_201_CREATED)
def create_clearance(
    clearance_in: ClearanceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Create a new land acquisition / statutory clearance tracking record.
    """
    clearance = clearance_service.create_clearance(
        session=session, clearance_in=clearance_in, current_user_id=current_user.id
    )
    return SuccessResponse(data=ClearanceRead.model_validate(clearance))


@router.put("/{clearance_id}", response_model=SuccessResponse[ClearanceRead])
def update_clearance(
    clearance_id: int,
    clearance_in: ClearanceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Update clearance status, approval date, or expiry date.
    """
    db_clearance = clearance_service.get_clearance_by_id(session, clearance_id)
    if not db_clearance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Clearance with ID {clearance_id} not found"},
        )

    updated = clearance_service.update_clearance(
        session=session, db_clearance=db_clearance, clearance_in=clearance_in, current_user_id=current_user.id
    )
    return SuccessResponse(data=ClearanceRead.model_validate(updated))


@router.delete("/{clearance_id}", response_model=SuccessResponse[ClearanceRead])
def delete_clearance(
    clearance_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Soft delete a clearance record.
    """
    db_clearance = clearance_service.get_clearance_by_id(session, clearance_id)
    if not db_clearance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Clearance with ID {clearance_id} not found"},
        )

    deleted = clearance_service.delete_clearance(
        session=session, db_clearance=db_clearance, current_user_id=current_user.id
    )
    return SuccessResponse(data=ClearanceRead.model_validate(deleted))


@router.post("/{clearance_id}/documents", response_model=SuccessResponse[ClearanceDocumentRead], status_code=status.HTTP_201_CREATED)
def add_clearance_document(
    clearance_id: int,
    doc_in: ClearanceDocumentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Attach a supporting clearance document reference.
    """
    if doc_in.clearance_id != clearance_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISMATCH_ID", "message": "Path clearance_id and payload clearance_id do not match"},
        )

    doc = clearance_service.add_clearance_document(
        session=session, doc_in=doc_in, current_user_id=current_user.id
    )
    return SuccessResponse(data=ClearanceDocumentRead.model_validate(doc))


@router.get("/{clearance_id}/documents", response_model=SuccessResponse[List[ClearanceDocumentRead]])
def list_clearance_documents(
    clearance_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    List all attached supporting documents for a clearance.
    """
    docs = clearance_service.list_clearance_documents(session, clearance_id)
    return SuccessResponse(data=[ClearanceDocumentRead.model_validate(d) for d in docs])
