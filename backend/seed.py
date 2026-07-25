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
from datetime import datetime, timedelta, date
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
from app.models.clearance import Clearance
from app.models.contract import Contract, WorkOrder, ContractAuditLog
from app.models.contractor import Contractor
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
        print("\n[1/11] Seeding Users...")
        users_def = [
            ("Admin User", "admin@sagarmala.gov.in", "admin123", "Admin"),
            ("Port Authority Officer", "port1@sagarmala.gov.in", "password123", "Port Authority"),
            ("Port Nodal Officer", "port2@sagarmala.gov.in", "password123", "Port Authority"),
            ("SMFCL Lead Appraiser", "smfcl1@sagarmala.gov.in", "password123", "SMFCL"),
            ("SMFCL Financial Analyst", "smfcl2@sagarmala.gov.in", "password123", "SMFCL"),
            ("Ministry Joint Secretary", "ministry@sagarmala.gov.in", "password123", "Ministry"),
            ("Tender Officer", "tender_creator@sagarmala.gov.in", "password123", "Tender Creator"),
            ("Infrastructure Bidder", "bidder1@sagarmala.gov.in", "password123", "Bidder"),
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
        print("\n[2/11] Seeding Projects...")
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
        print("\n[3/11] Seeding 15 DPRs Across All 8 States...")
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
        print("\n[4/11] Seeding 40 Tasks Across Mixed Statuses & Priorities...")
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
        print("\n[5/11] Seeding 10 Meetings...")
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
        print("\n[6/11] Seeding Stakeholders...")
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
        print("\n[7/11] Seeding Notifications...")
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

        # 8. Seed Clearances
        print("\n[8/11] Seeding Clearances...")
        now = datetime.utcnow()
        clearances_def = [
            {
                "project_code": "SG-2026-001",
                "clearance_type": "CRZ",
                "title": "CRZ Clearance Stage 1 NOC",
                "authority_name": "State Coastal Zone Management Authority",
                "status": "APPROVED",
                "application_date": now - timedelta(days=120),
                "approval_date": now - timedelta(days=60),
                "expiry_date": now + timedelta(days=365 * 2),
                "document_url": "https://evidence.sagarmala.gov.in/docs/crz-vpt.pdf",
                "remarks": "Stage 1 clearance issued with environmental conditions.",
            },
            {
                "project_code": "SG-2026-002",
                "clearance_type": "EC",
                "title": "Environmental Clearance for Dredging",
                "authority_name": "MoEFCC",
                "status": "PENDING",
                "application_date": now - timedelta(days=45),
                "approval_date": None,
                "expiry_date": None,
                "document_url": None,
                "remarks": "Submitted for Expert Appraisal Committee review.",
            },
            {
                "project_code": "SG-2026-003",
                "clearance_type": "FOREST",
                "title": "Forest Diversion Clearance Phase II",
                "authority_name": "State Forest Department",
                "status": "APPROVED",
                "application_date": now - timedelta(days=400),
                "approval_date": now - timedelta(days=365),
                "expiry_date": now - timedelta(days=30),  # Expired for testing expiry monitoring!
                "document_url": "https://evidence.sagarmala.gov.in/docs/forest-paradip.pdf",
                "remarks": "Temporary diversion permit expired; renewal pending.",
            },
            {
                "project_code": "SG-2026-004",
                "clearance_type": "CTO",
                "title": "Consent to Operate Waterway Link",
                "authority_name": "State Pollution Control Board",
                "status": "APPROVED",
                "application_date": now - timedelta(days=90),
                "approval_date": now - timedelta(days=30),
                "expiry_date": now + timedelta(days=365),
                "document_url": "https://evidence.sagarmala.gov.in/docs/cto-cochin.pdf",
                "remarks": "Valid CTO for phase 1 operation.",
            },
            {
                "project_code": "SG-2026-005",
                "clearance_type": "LAND_ACQUISITION",
                "title": "Industrial Node Land Handover NOC",
                "authority_name": "Kutch District Collectorate",
                "status": "APPROVED",
                "application_date": now - timedelta(days=500),
                "approval_date": now - timedelta(days=450),
                "expiry_date": now + timedelta(days=365 * 3),
                "document_url": "https://evidence.sagarmala.gov.in/docs/land-deendayal.pdf",
                "remarks": "Full possession granted.",
            },
            {
                "project_code": "SG-2026-006",
                "clearance_type": "UTILITY_SHIFTING",
                "title": "Railway Siding High-Tension Line Relocation",
                "authority_name": "State Electricity Board",
                "status": "PENDING",
                "application_date": now - timedelta(days=20),
                "approval_date": None,
                "expiry_date": None,
                "document_url": None,
                "remarks": "Cost estimate provided, NOC pending payment.",
            },
            {
                "project_code": "SG-2026-007",
                "clearance_type": "CRZ",
                "title": "Berth 8 Marine Bio-Survey NOC",
                "authority_name": "Goa State Coastal Zone Management Authority",
                "status": "REJECTED",
                "application_date": now - timedelta(days=80),
                "approval_date": None,
                "expiry_date": None,
                "document_url": None,
                "remarks": "Resubmission required with updated seasonal marine survey.",
            },
        ]

        for cdef in clearances_def:
            pid = proj_map.get(cdef["project_code"])
            if not pid:
                continue
            existing_c = session.exec(
                select(Clearance).where(Clearance.project_id == pid, Clearance.title == cdef["title"])
            ).first()
            if existing_c:
                print(f"  . Clearance '{cdef['title']}' already exists.")
                continue

            clearance = Clearance(
                project_id=pid,
                clearance_type=cdef["clearance_type"],
                title=cdef["title"],
                authority_name=cdef["authority_name"],
                status=cdef["status"],
                application_date=cdef["application_date"],
                approval_date=cdef["approval_date"],
                expiry_date=cdef["expiry_date"],
                document_url=cdef["document_url"],
                remarks=cdef["remarks"],
                created_by=admin_id,
                updated_by=admin_id,
                is_active=True,
            )
            session.add(clearance)
            session.commit()
            print(f"  + Created Clearance '{cdef['title']}' ({cdef['status']})")

        # 9. Seed Tenders & Bids
        print("\n[9/11] Seeding Tenders & Bids...")
        tenders_def = [
            {
                "project_code": "SG-2026-003",
                "tender_code": "TND-2026-003-01",
                "title": "Paradip Coal Cargo Mechanization – Civil Works Contract",
                "status": "AWARDED",
                "contract_value": 298_000_000.0,
                "loa_reference": "LOA-PPA-2026-001",
                "award_date": date(2026, 3, 15),
                "bids": [
                    {
                        "bidder": "Larsen & Toubro Infrastructure Ltd",
                        "org": "L&T Construction",
                        "email": "bids@lnt.com",
                        "tech": 92.5,
                        "amount": 298_000_000.0,
                        "rank": 1,
                        "is_l1": True,
                        "status": "AWARDED",
                    },
                    {
                        "bidder": "Afcons Infrastructure Ltd",
                        "org": "Afcons Ltd",
                        "email": "tenders@afcons.com",
                        "tech": 88.0,
                        "amount": 305_000_000.0,
                        "rank": 2,
                        "is_l1": False,
                        "status": "L2",
                    },
                    {
                        "bidder": "NCC Limited",
                        "org": "NCC Infrastructure",
                        "email": "info@nccltd.in",
                        "tech": 81.5,
                        "amount": 312_000_000.0,
                        "rank": 3,
                        "is_l1": False,
                        "status": "L3",
                    },
                ],
                "awarded_bid_idx": 0,
            },
            {
                "project_code": "SG-2026-004",
                "tender_code": "TND-2026-004-01",
                "title": "Cochin Ro-Ro Waterway Terminal – Civil & Mechanical",
                "status": "AWARDED",
                "contract_value": 138_000_000.0,
                "loa_reference": "LOA-CPT-2026-004",
                "award_date": date(2026, 4, 1),
                "bids": [
                    {
                        "bidder": "KEC International Limited",
                        "org": "RPG Group KEC",
                        "email": "bids@kecrpg.com",
                        "tech": 94.0,
                        "amount": 138_000_000.0,
                        "rank": 1,
                        "is_l1": True,
                        "status": "AWARDED",
                    },
                    {
                        "bidder": "Shapoorji Pallonji",
                        "org": "SP Engineering",
                        "email": "infra@shapoorji.com",
                        "tech": 89.0,
                        "amount": 141_500_000.0,
                        "rank": 2,
                        "is_l1": False,
                        "status": "L2",
                    },
                    {
                        "bidder": "ITD Cementation India",
                        "org": "ITD Cem",
                        "email": "tenders@itdcem.co.in",
                        "tech": 86.0,
                        "amount": 145_000_000.0,
                        "rank": 3,
                        "is_l1": False,
                        "status": "L3",
                    },
                ],
                "awarded_bid_idx": 0,
            },
            {
                "project_code": "SG-2026-008",
                "tender_code": "TND-2026-008-01",
                "title": "Kamarajar Liquid Cargo Jetty – EPC Turnkey Contract",
                "status": "TECHNICAL_EVALUATION",
                "contract_value": None,
                "loa_reference": None,
                "award_date": None,
                "bids": [
                    {
                        "bidder": "Tata Projects Limited",
                        "org": "Tata Group",
                        "email": "infra@tataprojects.com",
                        "tech": 91.0,
                        "amount": 275_000_000.0,
                        "rank": None,
                        "is_l1": False,
                        "status": "UNDER_REVIEW",
                    },
                    {
                        "bidder": "Hindustan Construction Co",
                        "org": "HCC Ltd",
                        "email": "bids@hccindia.com",
                        "tech": 87.5,
                        "amount": 280_000_000.0,
                        "rank": None,
                        "is_l1": False,
                        "status": "UNDER_REVIEW",
                    },
                ],
                "awarded_bid_idx": None,
            },
            {
                "project_code": "SG-2026-002",
                "tender_code": "TND-2026-002-01",
                "title": "JNPT Outer Harbor Channel Capital Dredging Package",
                "status": "PUBLISHED",
                "contract_value": None,
                "loa_reference": None,
                "award_date": None,
                "bids": [
                    {
                        "bidder": "Dredging Corporation of India Ltd",
                        "org": "DCI Ltd",
                        "email": "tender@dci.gov.in",
                        "tech": None,
                        "amount": 540_000_000.0,
                        "rank": None,
                        "is_l1": False,
                        "status": "SUBMITTED",
                    },
                    {
                        "bidder": "Adani Ports Dredging",
                        "org": "APSEZ",
                        "email": "dredging@adani.com",
                        "tech": None,
                        "amount": 525_000_000.0,
                        "rank": None,
                        "is_l1": False,
                        "status": "SUBMITTED",
                    },
                ],
                "awarded_bid_idx": None,
            },
            {
                "project_code": "SG-2026-001",
                "tender_code": "TND-2026-001-01",
                "title": "Visakhapatnam Berth 5 Conveyor & Crane Retrofit",
                "status": "DRAFT",
                "contract_value": None,
                "loa_reference": None,
                "award_date": None,
                "bids": [],
                "awarded_bid_idx": None,
            },
        ]

        awarded_tender_map = {}
        for tdef in tenders_def:
            pid = proj_map.get(tdef["project_code"])
            if not pid:
                continue
            tender = session.exec(
                select(Tender).where(Tender.tender_code == tdef["tender_code"])
            ).first()

            if not tender:
                tender = Tender(
                    project_id=pid,
                    tender_code=tdef["tender_code"],
                    title=tdef["title"],
                    status=tdef["status"],
                    contract_value=tdef["contract_value"],
                    loa_reference=tdef["loa_reference"],
                    award_date=tdef["award_date"],
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
                if tdef["status"] != "DRAFT":
                    session.add(TenderAuditLog(
                        tender_id=tender.id, actor_id=admin_id,
                        action="STATUS_CHANGED", old_status="DRAFT",
                        new_status=tdef["status"], comment=f"Moved to {tdef['status']}"
                    ))
                session.commit()
                print(f"  + Created Tender '{tdef['tender_code']}' ({tdef['status']})")
            else:
                print(f"  . Tender '{tdef['tender_code']}' already exists.")

            bid_objs = []
            for biddata in tdef["bids"]:
                existing_b = session.exec(
                    select(Bid).where(Bid.tender_id == tender.id, Bid.bidder_name == biddata["bidder"])
                ).first()
                if not existing_b:
                    bid = Bid(
                        tender_id=tender.id,
                        bidder_name=biddata["bidder"],
                        organization=biddata["org"],
                        contact_email=biddata["email"],
                        technical_score=biddata["tech"],
                        financial_amount=biddata["amount"],
                        financial_rank=biddata["rank"],
                        is_l1=biddata["is_l1"],
                        status=biddata["status"],
                        created_by=pa_id,
                        is_active=True,
                    )
                    session.add(bid)
                    session.commit()
                    session.refresh(bid)
                    bid_objs.append(bid)
                    print(f"    + Created Bid by '{biddata['bidder']}' ({biddata['status']})")
                else:
                    bid_objs.append(existing_b)
                    print(f"    . Bid by '{biddata['bidder']}' already exists.")

            if tdef["awarded_bid_idx"] is not None and tdef["awarded_bid_idx"] < len(bid_objs):
                winning_bid = bid_objs[tdef["awarded_bid_idx"]]
                if tender.awarded_bid_id != winning_bid.id:
                    tender.awarded_bid_id = winning_bid.id
                    session.add(tender)
                    session.commit()

            if tdef["status"] == "AWARDED":
                awarded_tender_map[tdef["tender_code"]] = (tender.id, pid)

        # 10. Seed Contracts & Work Orders
        print("\n[10/11] Seeding Contracts & Work Orders...")
        contracts_def = [
            {
                "tender_code": "TND-2026-003-01",
                "contract_number": "CNT-2026-003-01",
                "title": "Paradip Coal Cargo Terminal Construction Contract",
                "contract_value": 298_000_000.0,
                "loa_reference": "LOA-PPA-2026-001",
                "status": "ACTIVE",
                "start_date": date(2026, 4, 1),
                "end_date": date(2027, 9, 30),
                "issued_date": date(2026, 3, 20),
                "milestone_terms": "Piling (20%), Superstructure (50%), Testing (30%)",
                "work_orders": [
                    {
                        "work_order_number": "WO-2026-003-01",
                        "title": "Piling & Substructure Foundation Works",
                        "scope_of_work": "Deep piling and reinforced concrete substructure for berth mechanization.",
                        "work_order_value": 59_600_000.0,
                        "status": "IN_PROGRESS",
                        "start_date": date(2026, 4, 5),
                        "end_date": date(2026, 8, 30),
                    },
                    {
                        "work_order_number": "WO-2026-003-02",
                        "title": "Superstructure Fabrication & Erection",
                        "scope_of_work": "Structural steel fabrication and conveyor gantry erection.",
                        "work_order_value": 149_000_000.0,
                        "status": "ISSUED",
                        "start_date": date(2026, 9, 1),
                        "end_date": date(2027, 4, 30),
                    },
                ],
            },
            {
                "tender_code": "TND-2026-004-01",
                "contract_number": "CNT-2026-004-01",
                "title": "Cochin Ro-Ro Waterway Terminal Turnkey Execution",
                "contract_value": 138_000_000.0,
                "loa_reference": "LOA-CPT-2026-004",
                "status": "ISSUED",
                "start_date": date(2026, 5, 1),
                "end_date": date(2027, 3, 31),
                "issued_date": date(2026, 4, 10),
                "milestone_terms": "Phase 1 Jetty Construction (60%), Phase 2 Ramp & Pontoon (40%)",
                "work_orders": [
                    {
                        "work_order_number": "WO-2026-004-01",
                        "title": "Jetty Construction & Dredging Interface",
                        "scope_of_work": "Civil jetty structure and dredged approach channel alignment.",
                        "work_order_value": 82_800_000.0,
                        "status": "ISSUED",
                        "start_date": date(2026, 5, 15),
                        "end_date": date(2026, 11, 30),
                    },
                    {
                        "work_order_number": "WO-2026-004-02",
                        "title": "Hydraulic Ramp & Pontoon Installation",
                        "scope_of_work": "Supply, installation, and commissioning of floating pontoon and hydraulic ramp.",
                        "work_order_value": 55_200_000.0,
                        "status": "DRAFT",
                        "start_date": date(2026, 12, 1),
                        "end_date": date(2027, 3, 31),
                    },
                ],
            },
            {
                "tender_code": "TND-2026-003-01",
                "contract_number": "CNT-2026-003-02",
                "title": "Paradip Conveyor Belt Secondary Package",
                "contract_value": 45_000_000.0,
                "loa_reference": "LOA-PPA-2026-002",
                "status": "DRAFT",
                "start_date": None,
                "end_date": None,
                "issued_date": None,
                "milestone_terms": "Single turn-key delivery milestone",
                "work_orders": [
                    {
                        "work_order_number": "WO-2026-003-03",
                        "title": "Conveyor Belt Alignment Study & Procurement",
                        "scope_of_work": "Engineering study and long-lead motor procurement.",
                        "work_order_value": 15_000_000.0,
                        "status": "DRAFT",
                        "start_date": None,
                        "end_date": None,
                    },
                ],
            },
        ]

        for cntdef in contracts_def:
            tinfo = awarded_tender_map.get(cntdef["tender_code"])
            if not tinfo:
                t_obj = session.exec(select(Tender).where(Tender.tender_code == cntdef["tender_code"])).first()
                if t_obj:
                    tinfo = (t_obj.id, t_obj.project_id)
            if not tinfo:
                continue

            tid, pid = tinfo
            contract = session.exec(
                select(Contract).where(Contract.contract_number == cntdef["contract_number"])
            ).first()

            if not contract:
                contract = Contract(
                    tender_id=tid,
                    project_id=pid,
                    contract_number=cntdef["contract_number"],
                    title=cntdef["title"],
                    contract_value=cntdef["contract_value"],
                    loa_reference=cntdef["loa_reference"],
                    status=cntdef["status"],
                    start_date=cntdef["start_date"],
                    end_date=cntdef["end_date"],
                    issued_date=cntdef["issued_date"],
                    milestone_terms=cntdef["milestone_terms"],
                    created_by=admin_id,
                    updated_by=admin_id,
                    is_active=True,
                )
                session.add(contract)
                session.commit()
                session.refresh(contract)

                session.add(ContractAuditLog(
                    contract_id=contract.id,
                    actor_id=admin_id,
                    action="CREATED",
                    new_status="DRAFT",
                    comment="Contract seeded",
                ))
                if cntdef["status"] != "DRAFT":
                    session.add(ContractAuditLog(
                        contract_id=contract.id,
                        actor_id=admin_id,
                        action="STATUS_CHANGED",
                        old_status="DRAFT",
                        new_status=cntdef["status"],
                        comment=f"Status set to {cntdef['status']}",
                    ))
                session.commit()
                print(f"  + Created Contract '{cntdef['contract_number']}' ({cntdef['status']})")
            else:
                print(f"  . Contract '{cntdef['contract_number']}' already exists.")

            for wodef in cntdef["work_orders"]:
                existing_wo = session.exec(
                    select(WorkOrder).where(WorkOrder.work_order_number == wodef["work_order_number"])
                ).first()
                if not existing_wo:
                    wo = WorkOrder(
                        contract_id=contract.id,
                        work_order_number=wodef["work_order_number"],
                        title=wodef["title"],
                        scope_of_work=wodef["scope_of_work"],
                        work_order_value=wodef["work_order_value"],
                        status=wodef["status"],
                        start_date=wodef["start_date"],
                        end_date=wodef["end_date"],
                        created_by=admin_id,
                        updated_by=admin_id,
                        is_active=True,
                    )
                    session.add(wo)
                    session.commit()
                    print(f"    + Created Work Order '{wodef['work_order_number']}' ({wodef['status']})")
                else:
                    print(f"    . Work Order '{wodef['work_order_number']}' already exists.")

        # 11. Seed Contractors
        print("\n[11/11] Seeding Contractors...")
        contractors_def = [
            {
                "registration_number": "REG-IND-2024-001",
                "name": "Larsen & Toubro Infrastructure Ltd",
                "organization_type": "Public Limited",
                "contact_person": "Rajesh Kumar",
                "email": "contact@lntinfra.com",
                "phone": "+919820011223",
                "address": "L&T House, Ballard Estate, Mumbai, Maharashtra 400001",
                "verification_document_url": "https://evidence.sagarmala.gov.in/docs/lnt-reg.pdf",
                "status": "Empanelled",
            },
            {
                "registration_number": "REG-IND-2024-002",
                "name": "Afcons Infrastructure Limited",
                "organization_type": "Public Limited",
                "contact_person": "Suresh Menon",
                "email": "info@afcons.com",
                "phone": "+919821122334",
                "address": "Afcons House, Veera Desai Road, Mumbai, Maharashtra 400053",
                "verification_document_url": "https://evidence.sagarmala.gov.in/docs/afcons-reg.pdf",
                "status": "Empanelled",
            },
            {
                "registration_number": "REG-IND-2025-003",
                "name": "KEC International Limited",
                "organization_type": "Public Limited",
                "contact_person": "Vikram Shah",
                "email": "tenders@kecrpg.com",
                "phone": "+919832233445",
                "address": "RPG House, 463 Dr. Annie Besant Road, Worli, Mumbai 400030",
                "verification_document_url": "https://evidence.sagarmala.gov.in/docs/kec-reg.pdf",
                "status": "Verified",
            },
            {
                "registration_number": "REG-IND-2025-004",
                "name": "Tata Projects Limited",
                "organization_type": "Private Limited",
                "contact_person": "Ananya Roy",
                "email": "projects@tataprojects.com",
                "phone": "+919843344556",
                "address": "Mithona Towers, Secunderabad, Telangana 500003",
                "verification_document_url": "https://evidence.sagarmala.gov.in/docs/tata-reg.pdf",
                "status": "Verified",
            },
            {
                "registration_number": "REG-IND-2026-005",
                "name": "Dredging Corporation of India Ltd",
                "organization_type": "PSU",
                "contact_person": "Capt. K. S. Murthy",
                "email": "dci@dci.gov.in",
                "phone": "+919854455667",
                "address": "Dredge House, HB Colony, Visakhapatnam, Andhra Pradesh 530022",
                "verification_document_url": None,
                "status": "Registered",
            },
            {
                "registration_number": "REG-IND-2026-006",
                "name": "Coastal Marine Construction & Engineering Ltd",
                "organization_type": "Private Limited",
                "contact_person": "Pradeep Nair",
                "email": "info@comaco.in",
                "phone": "+919865566778",
                "address": "Sector 11, CBD Belapur, Navi Mumbai, Maharashtra 400614",
                "verification_document_url": None,
                "status": "Registered",
            },
        ]

        for crdef in contractors_def:
            existing_cr = session.exec(
                select(Contractor).where(Contractor.registration_number == crdef["registration_number"])
            ).first()
            if not existing_cr:
                contractor = Contractor(
                    registration_number=crdef["registration_number"],
                    name=crdef["name"],
                    organization_type=crdef["organization_type"],
                    contact_person=crdef["contact_person"],
                    email=crdef["email"],
                    phone=crdef["phone"],
                    address=crdef["address"],
                    verification_document_url=crdef["verification_document_url"],
                    status=crdef["status"],
                    created_by=admin_id,
                    updated_by=admin_id,
                    is_active=True,
                )
                session.add(contractor)
                session.commit()
                print(f"  + Created Contractor '{crdef['name']}' ({crdef['status']})")
            else:
                print(f"  . Contractor '{crdef['name']}' already exists.")

    print("\n==========================================================================")
    print("         MASTER SEED EXECUTION COMPLETED SUCCESSFULLY!                    ")
    print("==========================================================================")


if __name__ == "__main__":
    seed_all()

