"""
Sagarmala 2.0 MVP Portal — Master Seed Script

Idempotent seed script to populate PostgreSQL database with realistic demo data:
- Roles & Permissions (Bootstrapped via bootstrap_rbac)
- Users across 4 roles (Admin, Port Authority, SMFCL, Ministry)
- 8 Projects across all 5 lifecycle stages (INITIATION, APPRAISAL_AND_SANCTION, SANCTIONED, UNDER_EXECUTION, COMPLETED)
- 15 DPRs across ALL 8 states (DRAFT, SUBMITTED, SMFCL_REVIEW, REJECTED_BY_SMFCL, FORWARDED_TO_MINISTRY, REJECTED_BY_MINISTRY, APPROVED, FUNDS_RELEASED)
- 40 Tasks across mixed statuses (TODO, IN_PROGRESS, DONE) and priorities (LOW, MEDIUM, HIGH)
- 10 Meetings with detailed notes
- 10 Stakeholders
- Notifications for audit state transitions

Usage:
    cd backend
    PYTHONPATH=. venv/bin/python seed.py
"""
import sys
from datetime import datetime, timedelta
from sqlmodel import Session, select, func, text

from app.db.session import engine
from app.models.auth import Role, Permission, RolePermission, User
from app.models.project import Project
from app.models.dpr import DPR, DPRAuditLog
from app.models.task import Task
from app.models.stakeholder import Stakeholder, Meeting
from app.models.notification import Notification
from app.models.tender import Tender, TenderAuditLog
from app.models.bid import Bid
from app.core.security import hash_password
import bootstrap_rbac


def seed_all():
    print("==========================================================================")
    print("         SAGARMALA 2.0 MVP PORTAL — MASTER SEED SCRIPT                     ")
    print("==========================================================================")

    # 1. Run RBAC Bootstrap (Roles, Permissions, Mappings, Admin User)
    bootstrap_rbac.main()

    with Session(engine) as session:
        # Load Roles
        role_map = {}
        for r in session.exec(select(Role)).all():
            role_map[r.name] = r.id

        # 2. Seed Users
        print("\n[1/7] Seeding Users...")
        users_def = [
            ("Admin User", "admin@sagarmala.gov.in", "admin123", "Admin"),
            ("Port Authority Officer", "port1@sagarmala.gov.in", "password123", "Port Authority"),
            ("Port Nodal Officer", "port2@sagarmala.gov.in", "password123", "Port Authority"),
            ("SMFCL Lead Appraiser", "smfcl1@sagarmala.gov.in", "password123", "SMFCL"),
            ("SMFCL Financial Analyst", "smfcl2@sagarmala.gov.in", "password123", "SMFCL"),
            ("Ministry Joint Secretary", "ministry@sagarmala.gov.in", "password123", "Ministry"),
        ]
        user_map = {}
        for name, email, password, role_name in users_def:
            u = session.exec(select(User).where(User.email == email)).first()
            if not u:
                u = User(
                    name=name,
                    email=email,
                    password_hash=hash_password(password),
                    role_id=role_map[role_name],
                    is_active=True,
                )
                session.add(u)
                session.commit()
                session.refresh(u)
                print(f"  + Created User '{email}' ({role_name})")
            else:
                print(f"  . User '{email}' already exists.")
            user_map[email] = u.id

        pa_id = user_map["port1@sagarmala.gov.in"]
        port2_id = user_map["port2@sagarmala.gov.in"]
        smfcl_id = user_map["smfcl1@sagarmala.gov.in"]
        min_id = user_map["ministry@sagarmala.gov.in"]
        admin_id = user_map["admin@sagarmala.gov.in"]

        # 3. Seed Projects (8 projects across all 5 lifecycle stages)
        print("\n[2/7] Seeding Projects...")
        projects_def = [
            {
                "code": "SG-2026-001",
                "name": "Visakhapatnam Port Berth 5 Modernization",
                "category": "Port Modernization",
                "state": "Andhra Pradesh",
                "port_name": "Visakhapatnam Port",
                "funding_model": "MoPSW Grant-in-aid",
                "estimated_cost": 240.5,
                "approved_cost": None,
                "stage": "INITIATION",
            },
            {
                "code": "SG-2026-002",
                "name": "JNPT Outer Harbor Deepening & Dredging",
                "category": "Port Modernization",
                "state": "Maharashtra",
                "port_name": "Jawaharlal Nehru Port",
                "funding_model": "PPP Concession",
                "estimated_cost": 580.0,
                "approved_cost": 550.0,
                "stage": "APPRAISAL_AND_SANCTION",
            },
            {
                "code": "SG-2026-003",
                "name": "Paradip Coal Cargo Mechanization Terminal",
                "category": "Connectivity Infrastructure",
                "state": "Odisha",
                "port_name": "Paradip Port",
                "funding_model": "Grant-in-aid",
                "estimated_cost": 320.0,
                "approved_cost": 310.0,
                "stage": "SANCTIONED",
            },
            {
                "code": "SG-2026-004",
                "name": "Cochin Ro-Ro Waterway Terminal Link",
                "category": "Coastal Shipping",
                "state": "Kerala",
                "port_name": "Cochin Port",
                "funding_model": "Sagarmala Grant",
                "estimated_cost": 145.0,
                "approved_cost": 140.0,
                "stage": "UNDER_EXECUTION",
            },
            {
                "code": "SG-2026-005",
                "name": "Deendayal Smart Port Industrial Node",
                "category": "Port-led Industrialization",
                "state": "Gujarat",
                "port_name": "Deendayal Port",
                "funding_model": "PPP Model",
                "estimated_cost": 750.0,
                "approved_cost": 750.0,
                "stage": "COMPLETED",
            },
            {
                "code": "SG-2026-006",
                "name": "Chennai Port Elevated Rail Freight Link",
                "category": "Connectivity Infrastructure",
                "state": "Tamil Nadu",
                "port_name": "Chennai Port",
                "funding_model": "Joint Venture",
                "estimated_cost": 210.0,
                "approved_cost": None,
                "stage": "INITIATION",
            },
            {
                "code": "SG-2026-007",
                "name": "Mormugao Berth 8 Bulk Handling Upgrade",
                "category": "Port Modernization",
                "state": "Goa",
                "port_name": "Mormugao Port",
                "funding_model": "MoPSW Grant",
                "estimated_cost": 185.0,
                "approved_cost": 175.0,
                "stage": "APPRAISAL_AND_SANCTION",
            },
            {
                "code": "SG-2026-008",
                "name": "Kamarajar Liquid Cargo Jetty Phase II",
                "category": "Port Modernization",
                "state": "Tamil Nadu",
                "port_name": "Kamarajar Port",
                "funding_model": "Grant-in-aid",
                "estimated_cost": 290.0,
                "approved_cost": 290.0,
                "stage": "SANCTIONED",
            },
        ]

        proj_map = {}
        for pdata in projects_def:
            p = session.exec(select(Project).where(Project.project_code == pdata["code"])).first()
            if not p:
                p = Project(
                    project_code=pdata["code"],
                    name=pdata["name"],
                    category=pdata["category"],
                    state=pdata["state"],
                    port_name=pdata["port_name"],
                    funding_model=pdata["funding_model"],
                    estimated_cost=pdata["estimated_cost"],
                    approved_cost=pdata["approved_cost"],
                    lifecycle_stage=pdata["stage"],
                    created_by=admin_id,
                    updated_by=admin_id,
                )
                session.add(p)
                session.commit()
                session.refresh(p)
                print(f"  + Created Project '{pdata['code']}' ({pdata['stage']})")
            else:
                print(f"  . Project '{pdata['code']}' already exists.")
            proj_map[pdata["code"]] = p.id

        # 4. Seed DPRs & Audit Logs (15 DPRs across ALL 8 states)
        print("\n[3/7] Seeding 15 DPRs Across All 8 States...")
        dprs_def = [
            {"code": "SG-2026-001", "ver": 1, "status": "DRAFT", "actor": pa_id, "comment": "Initial draft prepared"},
            {"code": "SG-2026-001", "ver": 1, "status": "SUBMITTED", "actor": pa_id, "comment": "Submitted for review"},
            {"code": "SG-2026-002", "ver": 1, "status": "SMFCL_REVIEW", "actor": pa_id, "comment": "Under SMFCL technical review"},
            {"code": "SG-2026-002", "ver": 1, "status": "REJECTED_BY_SMFCL", "actor": smfcl_id, "comment": "Missing soil stability report"},
            {"code": "SG-2026-003", "ver": 2, "status": "FORWARDED_TO_MINISTRY", "actor": smfcl_id, "comment": "SMFCL approved; forwarded to Ministry"},
            {"code": "SG-2026-003", "ver": 1, "status": "REJECTED_BY_MINISTRY", "actor": min_id, "comment": "Cost allocation exceeds limit"},
            {"code": "SG-2026-004", "ver": 1, "status": "APPROVED", "actor": min_id, "comment": "Final sanction approved by Ministry"},
            {"code": "SG-2026-004", "ver": 1, "status": "FUNDS_RELEASED", "actor": smfcl_id, "comment": "First installment released"},
            {"code": "SG-2026-006", "ver": 1, "status": "DRAFT", "actor": pa_id, "comment": "Scoping study draft"},
            {"code": "SG-2026-006", "ver": 1, "status": "SUBMITTED", "actor": pa_id, "comment": "Submitted for approval"},
            {"code": "SG-2026-007", "ver": 2, "status": "SMFCL_REVIEW", "actor": pa_id, "comment": "Resubmitted after revisions"},
            {"code": "SG-2026-007", "ver": 1, "status": "REJECTED_BY_SMFCL", "actor": smfcl_id, "comment": "Environmental clearance pending"},
            {"code": "SG-2026-008", "ver": 1, "status": "FORWARDED_TO_MINISTRY", "actor": smfcl_id, "comment": "Recommended for approval"},
            {"code": "SG-2026-008", "ver": 2, "status": "APPROVED", "actor": min_id, "comment": "Approved on resubmission"},
            {"code": "SG-2026-005", "ver": 2, "status": "FUNDS_RELEASED", "actor": smfcl_id, "comment": "Final funds disbursed"},
        ]

        for idx, ddef in enumerate(dprs_def, 1):
            pid = proj_map[ddef["code"]]
            existing_dpr = session.exec(
                select(DPR).where(DPR.project_id == pid, DPR.version == ddef["ver"], DPR.status == ddef["status"])
            ).first()

            if not existing_dpr:
                dpr = DPR(
                    project_id=pid,
                    version=ddef["ver"],
                    status=ddef["status"],
                    submitted_by=ddef["actor"],
                    is_active=True,
                )
                session.add(dpr)
                session.commit()
                session.refresh(dpr)

                log = DPRAuditLog(
                    dpr_id=dpr.id,
                    actor_id=ddef["actor"],
                    action=f"ACTION_{ddef['status']}",
                    old_status="DRAFT" if ddef["status"] != "DRAFT" else None,
                    new_status=ddef["status"],
                    comment=ddef["comment"],
                )
                session.add(log)
                session.commit()
                print(f"  + Created DPR #{idx:02d} (Project={ddef['code']}, State={ddef['status']}, v{ddef['ver']})")
            else:
                print(f"  . DPR #{idx:02d} ({ddef['code']} {ddef['status']}) already exists.")

        # 5. Seed Tasks (40 tasks across 8 projects: 5 tasks per project)
        print("\n[4/7] Seeding 40 Tasks Across Mixed Statuses & Priorities...")
        task_templates = [
            ("Environmental Impact Assessment", "HIGH", "DONE", "https://evidence.sagarmala.gov.in/eia-report.pdf"),
            ("Geotechnical Soil Testing", "HIGH", "DONE", "https://evidence.sagarmala.gov.in/soil-test.pdf"),
            ("Coastal Regulation Zone Clearance", "HIGH", "IN_PROGRESS", None),
            ("Land Acquisition Clearance", "MEDIUM", "IN_PROGRESS", None),
            ("Port Railway Siding Survey", "LOW", "TODO", None),
        ]

        # Clean prior tasks for seed projects if present to ensure exactly 40 tasks
        for pcode, pid in proj_map.items():
            session.exec(text("DELETE FROM tasks WHERE project_id = :pid AND title LIKE '%(SG-2026-%'").bindparams(pid=pid))
            session.commit()

        task_count = 0
        for pcode, pid in proj_map.items():
            for t_idx, (t_title, priority, status_val, evidence) in enumerate(task_templates, 1):
                full_title = f"{t_title} ({pcode})"
                existing_t = session.exec(
                    select(Task).where(Task.project_id == pid, Task.title == full_title)
                ).first()
                if not existing_t:
                    due_dt = datetime.utcnow() + timedelta(days=(task_count % 30) + 5)
                    task = Task(
                        project_id=pid,
                        title=full_title,
                        description=f"Detailed execution milestone for project {pcode}.",
                        priority=priority,
                        status=status_val,
                        evidence_url=evidence,
                        assigned_to=pa_id if task_count % 2 == 0 else port2_id,
                        due_date=due_dt,
                        is_active=True,
                    )
                    session.add(task)
                    session.commit()
                    task_count += 1
        print(f"  + 40 Tasks ensured across projects.")

        # 6. Seed Meetings (10 meetings with notes)
        print("\n[5/7] Seeding 10 Meetings...")
        meeting_titles = [
            "Project Kickoff & Scope Alignment",
            "SMFCL Technical Appraisal Review",
            "Ministry Financial Sanction Meeting",
            "Environmental Clearance Review",
            "State Nodal Coordination Conference",
            "Port Infrastructure Progress Meeting",
            "Contractor Procurement Readiness",
            "Fund Disbursement Approval Session",
            "Quarterly Review Committee Meeting",
            "Final Handover Readiness Meeting",
        ]
        for idx, (pcode, pid) in enumerate(proj_map.items()):
            if idx >= 10:
                break
            m_title = meeting_titles[idx]
            existing_m = session.exec(
                select(Meeting).where(Meeting.project_id == pid, Meeting.title == m_title)
            ).first()
            if not existing_m:
                m = Meeting(
                    project_id=pid,
                    title=m_title,
                    date=datetime.utcnow() - timedelta(days=10 - idx),
                    notes=f"Minutes of meeting for {m_title} on project {pcode}. Key action items assigned.",
                    is_active=True,
                )
                session.add(m)
                session.commit()
                print(f"  + Created Meeting #{idx+1}: '{m_title}'")

        # 7. Seed Stakeholders
        print("\n[6/7] Seeding Stakeholders...")
        sh_def = [
            ("Visakhapatnam Port Authority", "VPT Trustee Board", "Port Authority"),
            ("Jawaharlal Nehru Port Trust", "JNPT Chairman Office", "Port Authority"),
            ("Paradip Port Authority", "PPA Engineering Wing", "Port Authority"),
            ("Ministry of Ports, Shipping and Waterways", "MoPSW Secretariat", "Ministry"),
            ("SMFCL Nodal Directorate", "SMFCL Cell", "SMFCL"),
        ]
        for idx, (pcode, pid) in enumerate(list(proj_map.items())[:5]):
            s_name, s_org, s_role = sh_def[idx]
            existing_s = session.exec(
                select(Stakeholder).where(Stakeholder.project_id == pid, Stakeholder.name == s_name)
            ).first()
            if not existing_s:
                stk = Stakeholder(
                    project_id=pid,
                    name=s_name,
                    organization=s_org,
                    role=s_role,
                    contact_info="contact@sagarmala.gov.in",
                    is_active=True,
                )
                session.add(stk)
                session.commit()
                print(f"  + Created Stakeholder '{s_name}'")

        # 8. Seed Notifications
        print("\n[7/7] Seeding Notifications...")
        notifs_def = [
            (pa_id, "DPR Status Update", "DPR for Visakhapatnam Port has been moved to SMFCL_REVIEW."),
            (smfcl_id, "Pending Review Notice", "New DPR submitted for JNPT Outer Harbor Dredging."),
            (min_id, "Ministry Approval Required", "DPR for Paradip Terminal forwarded to Ministry queue."),
            (pa_id, "Funds Disbursement Alert", "Funds released for Cochin Ro-Ro Waterway Link."),
        ]
        for u_id, n_title, n_msg in notifs_def:
            n = Notification(user_id=u_id, title=n_title, message=n_msg, read=False)
            session.add(n)
        session.commit()
        print("  + Notifications seeded.")

        # 8. Seed Tenders & Bids for SANCTIONED / UNDER_EXECUTION projects
        print("\n[8/8] Seeding Tenders & Bids...")
        tenders_def = [
            {
                "project_code": "SG-2026-003",
                "tender_code": "TND-2026-003-01",
                "title": "Paradip Coal Cargo Mechanization – Civil Works Contract",
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
                "title": "Kamarajar Liquid Cargo Jetty – EPC Turnkey Contract",
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
                "title": "Cochin Ro-Ro Waterway Terminal – Civil & Mechanical",
                "status": "AWARDED",
                "bids": [
                    {"bidder": "KEC International", "tech": 94.0, "amount": 138_000_000},
                    {"bidder": "Shapoorji Pallonji", "tech": 89.0, "amount": 141_500_000},
                ],
                "awarded_bid_idx": 0,  # KEC International won
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
                print(f"  . Tender '{tdef['tender_code']}' already exists.")
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

            # Audit log
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

            # Seed bids
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

            # If awarded, set the winning bid
            if tdef["awarded_bid_idx"] is not None:
                winning_bid = bid_objs[tdef["awarded_bid_idx"]]
                tender.awarded_bid_id = winning_bid.id
                session.add(tender)
                session.commit()

            print(f"  + Tender '{tdef['tender_code']}' ({tdef['status']}) with {len(tdef['bids'])} bids")

    print("\n==========================================================================")
    print("         MASTER SEED EXECUTION COMPLETED SUCCESSFULLY!                    ")
    print("==========================================================================")


if __name__ == "__main__":
    seed_all()
