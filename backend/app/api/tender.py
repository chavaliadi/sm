from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import require_permission
from app.models.auth import User
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.schemas.tender import TenderRead, TenderCreate, TenderUpdate
from app.schemas.bid import BidRead, BidCreate, BidUpdate
from app.services import tender_service

router = APIRouter(prefix="/tenders", tags=["Tenders"])

@router.get("", response_model=PaginatedResponse[TenderRead])
def get_tenders(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_TENDERS")),
):
    tenders, total = tender_service.list_tenders(session, page, page_size)
    return PaginatedResponse(
        data=[TenderRead.model_validate(t) for t in tenders],
        meta=PaginationMeta(page=page, page_size=page_size, total=total)
    )

@router.get("/{tender_id}", response_model=SuccessResponse[TenderRead])
def get_tender(
    tender_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_TENDERS")),
):
    tender = tender_service.get_tender_by_id(session, tender_id)
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender with ID {tender_id} not found", "field": None},
        )
    return SuccessResponse(data=TenderRead.model_validate(tender))

@router.post("", response_model=SuccessResponse[TenderRead], status_code=status.HTTP_201_CREATED)
def create_tender(
    tender_in: TenderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_TENDERS")),
):
    existing = tender_service.get_tender_by_code(session, tender_in.tender_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_TENDER_CODE",
                "message": f"Tender with code '{tender_in.tender_code}' already exists",
                "field": "tender_code",
            },
        )
    tender = tender_service.create_tender(session, tender_in, current_user.id)
    return SuccessResponse(data=TenderRead.model_validate(tender))

@router.put("/{tender_id}", response_model=SuccessResponse[TenderRead])
def update_tender(
    tender_id: int,
    tender_in: TenderUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_TENDERS")),
):
    db_tender = tender_service.get_tender_by_id(session, tender_id)
    if not db_tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender {tender_id} not found", "field": None}
        )
    updated_tender = tender_service.update_tender(session, db_tender, tender_in, current_user.id)
    return SuccessResponse(data=TenderRead.model_validate(updated_tender))

@router.delete("/{tender_id}", response_model=SuccessResponse[TenderRead])
def delete_tender(
    tender_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_TENDERS")),
):
    db_tender = tender_service.get_tender_by_id(session, tender_id)
    if not db_tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender {tender_id} not found", "field": None}
        )
    deleted_tender = tender_service.delete_tender(session, db_tender, current_user.id)
    return SuccessResponse(data=TenderRead.model_validate(deleted_tender))

@router.get("/{tender_id}/bids", response_model=PaginatedResponse[BidRead])
def get_tender_bids(
    tender_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_TENDERS")),
):
    db_tender = tender_service.get_tender_by_id(session, tender_id)
    if not db_tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender {tender_id} not found", "field": None}
        )
    bids, total = tender_service.list_bids(session, tender_id, page, page_size)
    return PaginatedResponse(
        data=[BidRead.model_validate(b) for b in bids],
        meta=PaginationMeta(page=page, page_size=page_size, total=total)
    )

@router.post("/{tender_id}/bids", response_model=SuccessResponse[BidRead], status_code=status.HTTP_201_CREATED)
def create_bid(
    tender_id: int,
    bid_in: BidCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_BIDS")),
):
    db_tender = tender_service.get_tender_by_id(session, tender_id)
    if not db_tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender {tender_id} not found", "field": None}
        )
        
    if db_tender.status != "PUBLISHED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TENDER_STATUS", "message": "Bids can only be submitted for PUBLISHED tenders", "field": "status"}
        )
    
    bid_in.tender_id = tender_id
    bid = tender_service.create_bid(session, bid_in, current_user.id)
    return SuccessResponse(data=BidRead.model_validate(bid))

@router.put("/bids/{bid_id}", response_model=SuccessResponse[BidRead])
def update_bid(
    bid_id: int,
    bid_in: BidUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_BIDS")),
):
    db_bid = tender_service.get_bid_by_id(session, bid_id)
    if not db_bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Bid {bid_id} not found", "field": None}
        )
    
    updated_bid = tender_service.update_bid(session, db_bid, bid_in, current_user.id)
    return SuccessResponse(data=BidRead.model_validate(updated_bid))
