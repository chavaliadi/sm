from datetime import datetime
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlmodel import Session, select, or_, func

from app.models.contractor import Contractor
from app.schemas.contractor import (
    ContractorCreate,
    ContractorUpdate,
    ContractorSummary,
    ContractorStatus,
)

def list_contractors(
    session: Session,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    organization_type: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[List[Contractor], int]:
    stmt = select(Contractor).where(Contractor.is_active == True)

    if status_filter:
        stmt = stmt.where(Contractor.status == status_filter)
    if organization_type:
        stmt = stmt.where(Contractor.organization_type == organization_type)
    if search and search.strip():
        q = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Contractor.name.ilike(q),
                Contractor.registration_number.ilike(q),
                Contractor.contact_person.ilike(q),
                Contractor.email.ilike(q),
            )
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = session.exec(count_stmt).one()

    stmt = (
        stmt.order_by(Contractor.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    results = session.exec(stmt).all()
    return list(results), total

def get_contractor_by_id(session: Session, contractor_id: int) -> Optional[Contractor]:
    contractor = session.get(Contractor, contractor_id)
    if not contractor or not contractor.is_active:
        return None
    return contractor

def create_contractor(
    session: Session, contractor_in: ContractorCreate, current_user_id: int
) -> Contractor:
    # Check duplicate registration number
    existing = session.exec(
        select(Contractor).where(
            Contractor.registration_number == contractor_in.registration_number.strip(),
            Contractor.is_active == True,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_REGISTRATION_NUMBER",
                "message": f"Contractor with registration number '{contractor_in.registration_number}' already exists.",
            },
        )

    # Check duplicate email
    if contractor_in.email and contractor_in.email.strip():
        existing_email = session.exec(
            select(Contractor).where(
                Contractor.email == contractor_in.email.strip(),
                Contractor.is_active == True,
            )
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_EMAIL",
                    "message": f"Contractor with email '{contractor_in.email}' already exists.",
                },
            )

    # Check duplicate phone
    if contractor_in.phone and contractor_in.phone.strip():
        existing_phone = session.exec(
            select(Contractor).where(
                Contractor.phone == contractor_in.phone.strip(),
                Contractor.is_active == True,
            )
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_PHONE",
                    "message": f"Contractor with phone '{contractor_in.phone}' already exists.",
                },
            )

    db_obj = Contractor(
        name=contractor_in.name.strip(),
        registration_number=contractor_in.registration_number.strip(),
        organization_type=contractor_in.organization_type,
        contact_person=contractor_in.contact_person.strip(),
        email=contractor_in.email.strip(),
        phone=contractor_in.phone.strip(),
        address=contractor_in.address.strip() if contractor_in.address else None,
        verification_document_url=contractor_in.verification_document_url.strip()
        if contractor_in.verification_document_url
        else None,
        status=ContractorStatus.REGISTERED.value,
        is_active=True,
        created_by=current_user_id,
        updated_by=current_user_id,
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def update_contractor(
    session: Session,
    db_contractor: Contractor,
    contractor_in: ContractorUpdate,
    current_user_id: int,
) -> Contractor:
    if db_contractor.status in (ContractorStatus.VERIFIED.value, ContractorStatus.EMPANELLED.value):
        if (
            contractor_in.registration_number is not None
            and contractor_in.registration_number.strip() != db_contractor.registration_number
        ) or (
            contractor_in.name is not None
            and contractor_in.name.strip() != db_contractor.name
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "IDENTITY_FIELDS_LOCKED",
                    "message": "Cannot modify registration number or name once contractor is verified or empanelled.",
                },
            )

    if (
        contractor_in.registration_number
        and contractor_in.registration_number.strip() != db_contractor.registration_number
    ):
        existing = session.exec(
            select(Contractor).where(
                Contractor.registration_number == contractor_in.registration_number.strip(),
                Contractor.id != db_contractor.id,
                Contractor.is_active == True,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_REGISTRATION_NUMBER",
                    "message": f"Contractor with registration number '{contractor_in.registration_number}' already exists.",
                },
            )

    if (
        contractor_in.email
        and contractor_in.email.strip() != db_contractor.email
    ):
        existing_email = session.exec(
            select(Contractor).where(
                Contractor.email == contractor_in.email.strip(),
                Contractor.id != db_contractor.id,
                Contractor.is_active == True,
            )
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_EMAIL",
                    "message": f"Contractor with email '{contractor_in.email}' already exists.",
                },
            )

    if (
        contractor_in.phone
        and contractor_in.phone.strip() != db_contractor.phone
    ):
        existing_phone = session.exec(
            select(Contractor).where(
                Contractor.phone == contractor_in.phone.strip(),
                Contractor.id != db_contractor.id,
                Contractor.is_active == True,
            )
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_PHONE",
                    "message": f"Contractor with phone '{contractor_in.phone}' already exists.",
                },
            )

    update_data = contractor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(db_contractor, field, value)

    db_contractor.updated_by = current_user_id
    db_contractor.updated_at = datetime.utcnow()
    session.add(db_contractor)
    session.commit()
    session.refresh(db_contractor)
    return db_contractor

def update_contractor_status(
    session: Session,
    db_contractor: Contractor,
    new_status: str,
    current_user_id: int,
) -> Contractor:
    current_status = db_contractor.status
    if current_status == new_status:
        return db_contractor

    # Enforce strict sequential transition: Registered -> Verified -> Empanelled
    allowed = False
    if current_status == ContractorStatus.REGISTERED.value and new_status == ContractorStatus.VERIFIED.value:
        allowed = True
    elif current_status == ContractorStatus.VERIFIED.value and new_status == ContractorStatus.EMPANELLED.value:
        allowed = True

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATUS_TRANSITION",
                "message": f"Cannot transition status from '{current_status}' to '{new_status}'. Status must transition sequentially: Registered -> Verified -> Empanelled.",
            },
        )

    if new_status in (ContractorStatus.VERIFIED.value, ContractorStatus.EMPANELLED.value):
        if not db_contractor.verification_document_url or not db_contractor.verification_document_url.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MISSING_VERIFICATION_DOCUMENT",
                    "message": "Verification document is required before transitioning status to Verified or Empanelled.",
                },
            )

    db_contractor.status = new_status
    db_contractor.updated_by = current_user_id
    db_contractor.updated_at = datetime.utcnow()
    session.add(db_contractor)
    session.commit()
    session.refresh(db_contractor)
    return db_contractor

def delete_contractor(
    session: Session, db_contractor: Contractor, current_user_id: int
) -> Contractor:
    db_contractor.is_active = False
    db_contractor.updated_by = current_user_id
    db_contractor.updated_at = datetime.utcnow()
    session.add(db_contractor)
    session.commit()
    session.refresh(db_contractor)
    return db_contractor

def get_contractor_summary(session: Session) -> ContractorSummary:
    all_contractors = list(
        session.exec(select(Contractor).where(Contractor.is_active == True)).all()
    )
    total = len(all_contractors)
    registered = len([c for c in all_contractors if c.status == ContractorStatus.REGISTERED.value])
    verified = len([c for c in all_contractors if c.status == ContractorStatus.VERIFIED.value])
    empanelled = len([c for c in all_contractors if c.status == ContractorStatus.EMPANELLED.value])

    return ContractorSummary(
        total_contractors=total,
        registered_count=registered,
        verified_count=verified,
        empanelled_count=empanelled,
    )
