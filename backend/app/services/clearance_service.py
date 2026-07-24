from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.clearance import Clearance
from app.models.project import Project
from app.schemas.clearance import (
    ClearanceCreate,
    ClearanceUpdate,
    ClearanceExpirySummary
)

def list_clearances(
    session: Session,
    page: int = 1,
    page_size: int = 20,
    project_id: Optional[int] = None,
    clearance_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    expiring_soon: bool = False,
) -> Tuple[List[Clearance], int]:
    stmt = select(Clearance).where(Clearance.is_active == True)

    if project_id:
        stmt = stmt.where(Clearance.project_id == project_id)
    if clearance_type:
        stmt = stmt.where(Clearance.clearance_type == clearance_type)
    if status_filter:
        stmt = stmt.where(Clearance.status == status_filter)

    if expiring_soon:
        now = datetime.utcnow()
        thirty_days = now + timedelta(days=30)
        stmt = stmt.where(Clearance.expiry_date != None).where(Clearance.expiry_date >= now).where(Clearance.expiry_date <= thirty_days)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    stmt = stmt.order_by(Clearance.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    results = session.exec(stmt).all()
    return list(results), total

def get_clearance_by_id(session: Session, clearance_id: int) -> Optional[Clearance]:
    clearance = session.get(Clearance, clearance_id)
    if not clearance or not clearance.is_active:
        return None
    return clearance

def create_clearance(session: Session, clearance_in: ClearanceCreate, current_user_id: int) -> Clearance:
    # Check project exists and is active
    project = session.get(Project, clearance_in.project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Project with ID {clearance_in.project_id} not found"},
        )

    # Lifecycle stage gate validation
    # Clearances can only be registered after project appraisal / initiation
    allowed_stages = ["INITIATION", "APPRAISAL", "APPRAISAL_AND_SANCTION", "SANCTIONED", "UNDER_EXECUTION"]
    if project.lifecycle_stage and project.lifecycle_stage.upper() not in allowed_stages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_LIFECYCLE_STAGE",
                "message": f"Cannot create clearance for project in stage '{project.lifecycle_stage}'",
            },
        )

    # Validate date range consistency
    if clearance_in.expiry_date:
        ref_date = clearance_in.approval_date or clearance_in.application_date
        if ref_date and clearance_in.expiry_date < ref_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_DATE_RANGE",
                    "message": "Expiry date cannot be prior to application or approval date",
                },
            )

    db_obj = Clearance(
        project_id=clearance_in.project_id,
        clearance_type=clearance_in.clearance_type.value if hasattr(clearance_in.clearance_type, "value") else str(clearance_in.clearance_type),
        title=clearance_in.title,
        authority_name=clearance_in.authority_name,
        status=clearance_in.status.value if hasattr(clearance_in.status, "value") else str(clearance_in.status),
        application_date=clearance_in.application_date,
        approval_date=clearance_in.approval_date,
        expiry_date=clearance_in.expiry_date,
        document_url=clearance_in.document_url,
        remarks=clearance_in.remarks,
        created_by=current_user_id,
        updated_by=current_user_id,
        is_active=True,
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    _check_and_update_project_lifecycle_stage(session, project.id)
    return db_obj

def update_clearance(
    session: Session, db_clearance: Clearance, clearance_in: ClearanceUpdate, current_user_id: int
) -> Clearance:
    update_data = clearance_in.model_dump(exclude_unset=True)

    # Validate date range consistency on update
    new_expiry = update_data.get("expiry_date", db_clearance.expiry_date)
    new_approval = update_data.get("approval_date", db_clearance.approval_date)
    new_application = update_data.get("application_date", db_clearance.application_date)
    if new_expiry:
        ref_date = new_approval or new_application
        if ref_date and new_expiry < ref_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_DATE_RANGE",
                    "message": "Expiry date cannot be prior to application or approval date",
                },
            )

    for field, value in update_data.items():
        if value is not None:
            if hasattr(value, "value"):
                value = value.value
            setattr(db_clearance, field, value)
            
    db_clearance.updated_by = current_user_id
    db_clearance.updated_at = datetime.utcnow()
    
    session.add(db_clearance)
    session.commit()
    session.refresh(db_clearance)

    _check_and_update_project_lifecycle_stage(session, db_clearance.project_id)
    return db_clearance


def delete_clearance(session: Session, db_clearance: Clearance, current_user_id: int) -> Clearance:
    db_clearance.is_active = False
    db_clearance.updated_by = current_user_id
    db_clearance.updated_at = datetime.utcnow()
    session.add(db_clearance)
    session.commit()
    session.refresh(db_clearance)
    return db_clearance

def get_expiry_summary(session: Session, project_id: Optional[int] = None) -> ClearanceExpirySummary:
    stmt = select(Clearance).where(Clearance.is_active == True)
    if project_id:
        stmt = stmt.where(Clearance.project_id == project_id)
    
    all_clearances = list(session.exec(stmt).all())
    now = datetime.utcnow()
    thirty_days = now + timedelta(days=30)

    total = len(all_clearances)
    approved = len([c for c in all_clearances if c.status == "APPROVED"])
    pending = len([c for c in all_clearances if c.status == "PENDING"])
    expired = len([c for c in all_clearances if c.status == "EXPIRED" or (c.expiry_date and c.expiry_date < now)])
    expiring_soon = len([c for c in all_clearances if c.expiry_date and now <= c.expiry_date <= thirty_days and c.status != "EXPIRED"])

    return ClearanceExpirySummary(
        total_clearances=total,
        expiring_soon_30_days=expiring_soon,
        expired_count=expired,
        approved_count=approved,
        pending_count=pending,
    )

def _check_and_update_project_lifecycle_stage(session: Session, project_id: int) -> None:
    """
    If all statutory clearances for a project are APPROVED, gate the project's
    lifecycle_stage to cleared_for_dpr / SANCTIONED readiness.
    """
    project = session.get(Project, project_id)
    if not project or not project.is_active:
        return

    clearances = list(session.exec(select(Clearance).where(Clearance.project_id == project_id, Clearance.is_active == True)).all())
    if clearances and all(c.status == "APPROVED" for c in clearances):
        if project.lifecycle_stage == "INITIATION":
            project.lifecycle_stage = "APPRAISAL_AND_SANCTION"
            project.updated_at = datetime.utcnow()
            session.add(project)
            session.commit()
