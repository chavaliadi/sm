from typing import List, Tuple, Optional
from sqlmodel import Session, select
from fastapi import HTTPException, status
from datetime import datetime
import os

from app.models.tender import Tender, TenderAuditLog, TENDER_TRANSITIONS
from app.models.bid import Bid, ALLOWED_BID_EXTENSIONS, MAX_BID_FILE_MB
from app.schemas.tender import TenderCreate, TenderUpdate
from app.schemas.bid import BidCreate, BidUpdate

# ── Helpers ──────────────────────────────────────────────────────────

def _get_tender(session: Session, tender_id: int) -> Tender:
    tender = session.exec(
        select(Tender).where(Tender.id == tender_id, Tender.is_active == True)
    ).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Tender {tender_id} not found"}
        )
    return tender

def _write_tender_audit(
    session: Session, tender_id: int, actor_id: int,
    action: str, old_status: Optional[str] = None,
    new_status: Optional[str] = None, comment: Optional[str] = None
) -> None:
    session.add(TenderAuditLog(
        tender_id=tender_id, actor_id=actor_id, action=action,
        old_status=old_status, new_status=new_status, comment=comment
    ))

def _validate_document(document_ref: Optional[str]) -> Optional[str]:
    """
    Basic file validation: check allowed extension.
    Returns the validated MIME guess or raises HTTPException.
    """
    if not document_ref:
        return None
    ext = os.path.splitext(document_ref)[-1].lower()
    if ext not in ALLOWED_BID_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_DOCUMENT_FORMAT",
                "message": f"File format '{ext}' not allowed. Allowed: {ALLOWED_BID_EXTENSIONS}"
            }
        )
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".zip": "application/zip",
    }
    return mime_map.get(ext, "application/octet-stream")

# ── Tender CRUD ───────────────────────────────────────────────────────

def get_tender_by_code(session: Session, tender_code: str) -> Optional[Tender]:
    return session.exec(
        select(Tender).where(Tender.tender_code == tender_code, Tender.is_active == True)
    ).first()

def get_tender_by_id(session: Session, tender_id: int) -> Optional[Tender]:
    return session.exec(
        select(Tender).where(Tender.id == tender_id, Tender.is_active == True)
    ).first()

def create_tender(session: Session, tender_in: TenderCreate, current_user_id: int) -> Tender:
    tender = Tender(**tender_in.model_dump(), created_by=current_user_id, status="DRAFT")
    session.add(tender)
    session.commit()
    session.refresh(tender)
    _write_tender_audit(session, tender.id, current_user_id, "CREATED", new_status="DRAFT", comment="Tender created")
    session.commit()
    return tender

def list_tenders(session: Session, page: int = 1, page_size: int = 20) -> Tuple[List[Tender], int]:
    statement = select(Tender).where(Tender.is_active == True)
    total = len(session.exec(statement).all())
    tenders = session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return tenders, total

def update_tender(session: Session, db_tender: Tender, tender_in: TenderUpdate, current_user_id: int) -> Tender:
    if tender_in.status and tender_in.status != db_tender.status:
        allowed = TENDER_TRANSITIONS.get(db_tender.status, [])
        if tender_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATE_TRANSITION",
                    "message": f"Cannot go from '{db_tender.status}' to '{tender_in.status}'. Allowed: {allowed}"
                }
            )
        old_status = db_tender.status
        db_tender.status = tender_in.status

        # When awarding, require the winning bid
        if tender_in.status == "AWARDED" and tender_in.awarded_bid_id:
            db_tender.awarded_bid_id = tender_in.awarded_bid_id

        # Set LOA date automatically when LOA is issued
        if tender_in.status == "LOA_ISSUED" and not db_tender.award_date:
            from datetime import date
            db_tender.award_date = date.today()

        _write_tender_audit(
            session, db_tender.id, current_user_id, "STATUS_CHANGED",
            old_status=old_status, new_status=tender_in.status,
            comment=f"Status changed to {tender_in.status}"
        )

    # Update all other fields if provided
    update_fields = tender_in.model_dump(exclude_unset=True, exclude={"status", "awarded_bid_id"})
    for field, value in update_fields.items():
        setattr(db_tender, field, value)

    db_tender.updated_by = current_user_id
    db_tender.updated_at = datetime.utcnow()
    session.add(db_tender)
    session.commit()
    session.refresh(db_tender)
    return db_tender

def delete_tender(session: Session, db_tender: Tender, current_user_id: int) -> Tender:
    db_tender.is_active = False
    db_tender.updated_by = current_user_id
    db_tender.updated_at = datetime.utcnow()
    _write_tender_audit(session, db_tender.id, current_user_id, "DELETED", comment="Tender soft deleted")
    session.add(db_tender)
    session.commit()
    return db_tender

def get_tender_audit_trail(session: Session, tender_id: int) -> List[TenderAuditLog]:
    _get_tender(session, tender_id)
    return list(session.exec(
        select(TenderAuditLog).where(TenderAuditLog.tender_id == tender_id)
        .order_by(TenderAuditLog.timestamp.asc())
    ).all())

# ── Bid CRUD ──────────────────────────────────────────────────────────

def get_bid_by_id(session: Session, bid_id: int) -> Optional[Bid]:
    return session.exec(select(Bid).where(Bid.id == bid_id, Bid.is_active == True)).first()

def list_bids(
    session: Session, tender_id: Optional[int] = None,
    page: int = 1, page_size: int = 20
) -> Tuple[List[Bid], int]:
    statement = select(Bid).where(Bid.is_active == True)
    if tender_id:
        statement = statement.where(Bid.tender_id == tender_id)
    total = len(session.exec(statement).all())
    bids = session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return bids, total

def create_bid(session: Session, bid_in: BidCreate, current_user_id: int) -> Bid:
    # Validate document format
    validated_mime = _validate_document(bid_in.document_ref)
    bid = Bid(
        **bid_in.model_dump(),
        created_by=current_user_id,
        status="SUBMITTED",
        document_mime=validated_mime,
    )
    session.add(bid)
    session.commit()
    session.refresh(bid)
    return bid

def update_bid(session: Session, db_bid: Bid, bid_in: BidUpdate, current_user_id: int) -> Bid:
    if bid_in.document_ref:
        bid_in.document_mime = _validate_document(bid_in.document_ref)
    update_data = bid_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_bid, key, value)
    db_bid.updated_by = current_user_id
    db_bid.updated_at = datetime.utcnow()
    session.add(db_bid)
    session.commit()
    session.refresh(db_bid)
    return db_bid

def delete_bid(session: Session, db_bid: Bid, current_user_id: int) -> Bid:
    db_bid.is_active = False
    db_bid.updated_by = current_user_id
    db_bid.updated_at = datetime.utcnow()
    session.add(db_bid)
    session.commit()
    return db_bid

# ── L1/L2/L3 Evaluation Engine ────────────────────────────────────────

def run_bid_evaluation(session: Session, tender_id: int, current_user_id: int) -> List[Bid]:
    """
    Rank all submitted bids for a tender by financial_amount ascending (L1 = lowest).
    Updates financial_rank and is_l1 on each bid.
    Only runs when tender is in TECHNICAL_EVALUATION or FINANCIAL_EVALUATION stage.
    """
    tender = _get_tender(session, tender_id)
    if tender.status not in ("TECHNICAL_EVALUATION", "FINANCIAL_EVALUATION", "FINAL_EVALUATION"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EVALUATION_NOT_READY",
                "message": f"Evaluation can only be run in TECHNICAL_EVALUATION, FINANCIAL_EVALUATION, or FINAL_EVALUATION stage. Current: {tender.status}"
            }
        )

    bids = session.exec(
        select(Bid)
        .where(Bid.tender_id == tender_id, Bid.is_active == True)
        .where(Bid.financial_amount != None)
    ).all()

    if not bids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_BIDS", "message": "No bids with financial amounts found for this tender"}
        )

    # Sort ascending by financial amount (L1 = lowest price)
    sorted_bids = sorted(bids, key=lambda b: b.financial_amount)
    for rank, bid in enumerate(sorted_bids, start=1):
        bid.financial_rank = rank
        bid.is_l1 = (rank == 1)
        bid.status = f"L{min(rank, 3)}" if rank <= 3 else bid.status
        session.add(bid)

    _write_tender_audit(
        session, tender_id, current_user_id, "EVALUATION_RUN",
        comment=f"L1/L2/L3 ranking applied to {len(sorted_bids)} bids. L1 bidder: {sorted_bids[0].bidder_name} @ ₹{sorted_bids[0].financial_amount:,.0f}"
    )
    session.commit()

    # Refresh and return
    return [session.get(Bid, b.id) for b in sorted_bids]
