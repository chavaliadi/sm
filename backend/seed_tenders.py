import os
import sys
from sqlmodel import Session, select

from app.db.session import engine
from app.models.auth import User
from app.models.project import Project
from app.models.tender import Tender, TenderAuditLog
from app.models.bid import Bid

def seed_tenders():
    with Session(engine) as session:
        pa = session.exec(select(User).where(User.email == 'port1@sagarmala.gov.in')).first()
        admin = session.exec(select(User).where(User.email == 'admin@sagarmala.gov.in')).first()
        
        pa_id = pa.id if pa else 1
        admin_id = admin.id if admin else 1
        
        proj_map = {}
        for p in session.exec(select(Project)).all():
            proj_map[p.project_code] = p.id
            
        tenders_def = [
            {
                "project_code": "SG-2026-003",
                "tender_code": "TND-2026-003-01",
                "title": "Paradip Coal Cargo Mechanization - Civil Works Contract",
                "status": "PUBLISHED",
                "bids": [
                    {"bidder": "Larsen & Toubro Infrastructure", "tech": 88.5, "amount": 298_000_000},
                    {"bidder": "Afcons Infrastructure Ltd", "tech": 82.0, "amount": 305_000_000},
                ],
                "awarded_bid_idx": None,
            },
            {
                "project_code": "SG-2026-008",
                "tender_code": "TND-2026-008-01",
                "title": "Kamarajar Liquid Cargo Jetty - EPC Turnkey Contract",
                "status": "PUBLISHED",
                "bids": [
                    {"bidder": "Tata Projects Limited", "tech": 91.0, "amount": 275_000_000},
                    {"bidder": "NCC Limited", "tech": 85.5, "amount": 282_000_000},
                ],
                "awarded_bid_idx": None,
            },
            {
                "project_code": "SG-2026-004",
                "tender_code": "TND-2026-004-01",
                "title": "Cochin Ro-Ro Waterway Terminal - Civil & Mechanical",
                "status": "AWARDED",
                "bids": [
                    {"bidder": "KEC International", "tech": 94.0, "amount": 138_000_000},
                    {"bidder": "Shapoorji Pallonji", "tech": 89.0, "amount": 141_500_000},
                ],
                "awarded_bid_idx": 0,
            },
        ]

        for tdef in tenders_def:
            pid = proj_map.get(tdef["project_code"])
            if not pid:
                continue
            existing_t = session.exec(
                select(Tender).where(Tender.tender_code == tdef["tender_code"])
            ).first()
            if existing_t:
                continue

            tender = Tender(
                project_id=pid,
                tender_code=tdef["tender_code"],
                title=tdef["title"],
                status=tdef["status"],
                created_by=pa_id,
                updated_by=admin_id,
                is_active=True,
            )
            session.add(tender)
            session.commit()
            session.refresh(tender)

            session.add(TenderAuditLog(
                tender_id=tender.id, actor_id=pa_id,
                action="CREATED", new_status="DRAFT", comment="Tender created"
            ))
            session.add(TenderAuditLog(
                tender_id=tender.id, actor_id=admin_id,
                action="STATUS_CHANGED", old_status="DRAFT",
                new_status=tdef["status"], comment=f"Moved to {tdef['status']}"
            ))
            session.commit()

            bid_objs = []
            for biddata in tdef["bids"]:
                bid = Bid(
                    tender_id=tender.id,
                    bidder_name=biddata["bidder"],
                    technical_score=biddata["tech"],
                    financial_amount=biddata["amount"],
                    status="SUBMITTED",
                    created_by=pa_id,
                    is_active=True,
                )
                session.add(bid)
                session.commit()
                session.refresh(bid)
                bid_objs.append(bid)

            if tdef["awarded_bid_idx"] is not None:
                winning_bid = bid_objs[tdef["awarded_bid_idx"]]
                tender.awarded_bid_id = winning_bid.id
                session.add(tender)
                session.commit()
                
            print(f"Added tender {tender.tender_code}")

if __name__ == '__main__':
    seed_tenders()
