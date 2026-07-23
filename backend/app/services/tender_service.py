from typing import List, Tuple, Optional
from sqlmodel import Session, select
from fastapi import HTTPException, status
from datetime import datetime

from app.models.tender import Tender, TenderAuditLog
from app.models.bid import Bid
from app.schemas.tender import TenderCreate, TenderUpdate
from app.schemas.bid import BidCreate, BidUpdate

def get_tender_by_code(session: Session, tender_code: str) -> Optional[Tender]:
    return session.exec(select(Tender).where(Tender.tender_code == tender_code, Tender.is_active == True)).first()

def get_tender_by_id(session: Session, tender_id: int) -> Optional[Tender]:
    return session.exec(select(Tender).where(Tender.id == tender_id, Tender.is_active == True)).first()

def create_tender(session: Session, tender_in: TenderCreate, current_user_id: int) -> Tender:
    tender = Tender(
        **tender_in.model_dump(),
        created_by=current_user_id,
        status="DRAFT"
    )
    session.add(tender)
    session.commit()
    session.refresh(tender)

    audit = TenderAuditLog(
        tender_id=tender.id,
        actor_id=current_user_id,
        action="CREATED",
        new_status="DRAFT",
        comment="Tender created"
    )
    session.add(audit)
    session.commit()
    return tender

def list_tenders(session: Session, page: int = 1, page_size: int = 20) -> Tuple[List[Tender], int]:
    statement = select(Tender).where(Tender.is_active == True)
    total = len(session.exec(statement).all())
    tenders = session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return tenders, total

def update_tender(session: Session, db_tender: Tender, tender_in: TenderUpdate, current_user_id: int) -> Tender:
    if tender_in.status and tender_in.status != db_tender.status:
        valid_transitions = {
            "DRAFT": ["PUBLISHED"],
            "PUBLISHED": ["UNDER EVALUATION"],
            "UNDER EVALUATION": ["AWARDED"]
        }
        allowed = valid_transitions.get(db_tender.status, [])
        if tender_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_STATE_TRANSITION", "message": f"Cannot transition from {db_tender.status} to {tender_in.status}", "field": "status"}
            )
            
        old_status = db_tender.status
        db_tender.status = tender_in.status

        # When awarding, record which bid won
        if tender_in.status == "AWARDED" and tender_in.awarded_bid_id is not None:
            db_tender.awarded_bid_id = tender_in.awarded_bid_id

        audit = TenderAuditLog(
            tender_id=db_tender.id,
            actor_id=current_user_id,
            action="STATUS_CHANGED",
            old_status=old_status,
            new_status=tender_in.status,
            comment=f"Status updated to {tender_in.status}"
        )
        session.add(audit)
        
    if tender_in.title is not None:
        db_tender.title = tender_in.title
        
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
    
    audit = TenderAuditLog(
        tender_id=db_tender.id,
        actor_id=current_user_id,
        action="DELETED",
        comment="Tender soft deleted"
    )
    session.add(audit)
    session.add(db_tender)
    session.commit()
    return db_tender

def get_bid_by_id(session: Session, bid_id: int) -> Optional[Bid]:
    return session.exec(select(Bid).where(Bid.id == bid_id, Bid.is_active == True)).first()

def list_bids(session: Session, tender_id: Optional[int] = None, page: int = 1, page_size: int = 20) -> Tuple[List[Bid], int]:
    statement = select(Bid).where(Bid.is_active == True)
    if tender_id:
        statement = statement.where(Bid.tender_id == tender_id)
    total = len(session.exec(statement).all())
    bids = session.exec(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return bids, total

def create_bid(session: Session, bid_in: BidCreate, current_user_id: int) -> Bid:
    bid = Bid(
        **bid_in.model_dump(),
        created_by=current_user_id,
        status="SUBMITTED"
    )
    session.add(bid)
    session.commit()
    session.refresh(bid)
    return bid

def update_bid(session: Session, db_bid: Bid, bid_in: BidUpdate, current_user_id: int) -> Bid:
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
