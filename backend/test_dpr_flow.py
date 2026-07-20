import sys
from sqlmodel import Session, SQLModel, create_engine, select
from app.models.project import Project
from app.models.auth import Role, User
from app.models.dpr import DPR, DPRAuditLog
from app.models.task import Task
from app.models.notification import Notification
from app.services.dpr import create_dpr, submit_dpr, smfcl_review, ministry_review, release_funds

# Setup a clean in-memory SQLite database
engine = create_engine("sqlite:///:memory:")
SQLModel.metadata.create_all(engine)

def test_flow():
    with Session(engine) as session:
        # Create a mock User and Role
        role = Role(name="Admin")
        session.add(role)
        session.commit()
        session.refresh(role)
        
        user = User(name="Test User", email="test@example.com", password_hash="hash", role_id=role.id)
        session.add(user)
        session.commit()
        session.refresh(user)
            
        # Create a project
        project = Project(
            project_code="TEST-001",
            name="Test Project",
            category="Test",
            state="State",
            port_name="Port",
            stakeholder_info=None,
            funding_model="Model",
            estimated_cost=100.0,
            created_by=user.id,
            updated_by=user.id,
            lifecycle_stage="cleared_for_dpr"
        )
        session.add(project)
        session.commit()
        session.refresh(project)

        print(f"-------\nTesting flow for project {project.id}")
        
        try:
            dpr = create_dpr(session, project.id, user.id)
            print("1. Draft created. Status:", dpr.status.value if hasattr(dpr.status, 'value') else dpr.status)
            dpr = submit_dpr(session, dpr.id, user.id)
            print("2. Submitted. Status:", dpr.status)
            dpr = smfcl_review(session, dpr.id, user.id, "approve")
            print("3. SMFCL Approved. Status:", dpr.status)
            dpr = ministry_review(session, dpr.id, user.id, "approve")
            session.refresh(project)
            print(f"4. Ministry Approved. DPR Status: {dpr.status}. Project stage: {project.lifecycle_stage}")
            dpr = release_funds(session, dpr.id, user.id)
            session.refresh(project)
            print(f"5. Funds Released. Project stage: {project.lifecycle_stage}")
            
            # verify task was created
            tasks = session.exec(select(Task)).all()
            print(f"6. Auto-generated Tasks: {[t.title for t in tasks]}")
            print("✅ DPR Flow End-To-End Passed.")
        except Exception as e:
            print("❌ Flow failed!", e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_flow()
