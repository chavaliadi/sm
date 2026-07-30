from typing import Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select, func
from app.models.stakeholder import Stakeholder, Meeting
from app.schemas.stakeholder import (
    StakeholderCreate,
    StakeholderUpdate,
    MeetingCreate,
    MeetingUpdate,
)


# ── Stakeholder CRUD ──────────────────────────────────────────────────

def list_stakeholders(
    session: Session,
    project_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Stakeholder], int]:
    statement = select(Stakeholder).where(Stakeholder.is_active == True)
    if project_id is not None:
        statement = statement.where(Stakeholder.project_id == project_id)

    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    stakeholders = list(session.exec(statement).all())
    return stakeholders, total


def get_stakeholder_by_id(session: Session, stakeholder_id: int) -> Optional[Stakeholder]:
    stakeholder = session.get(Stakeholder, stakeholder_id)
    if stakeholder and stakeholder.is_active:
        return stakeholder
    return None


def create_stakeholder(session: Session, data: StakeholderCreate) -> Stakeholder:
    data.name = data.name.strip()
    data.organization = data.organization.strip()
    data.role = data.role.strip()

    existing = session.exec(
        select(Stakeholder).where(
            Stakeholder.project_id == data.project_id,
            Stakeholder.name == data.name,
            Stakeholder.is_active == True,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_STAKEHOLDER",
                "message": f"Stakeholder with name '{data.name}' already exists for this project.",
            },
        )

    stakeholder = Stakeholder.model_validate(data)
    session.add(stakeholder)
    session.commit()
    session.refresh(stakeholder)
    return stakeholder


def update_stakeholder(
    session: Session, stakeholder: Stakeholder, data: StakeholderUpdate
) -> Stakeholder:
    if data.name is not None:
        data.name = data.name.strip()
    if data.organization is not None:
        data.organization = data.organization.strip()
    if data.role is not None:
        data.role = data.role.strip()

    target_name = data.name if data.name is not None else stakeholder.name
    target_project_id = data.project_id if data.project_id is not None else stakeholder.project_id

    if (
        (data.name is not None and data.name != stakeholder.name)
        or (data.project_id is not None and data.project_id != stakeholder.project_id)
    ):
        existing = session.exec(
            select(Stakeholder).where(
                Stakeholder.project_id == target_project_id,
                Stakeholder.name == target_name,
                Stakeholder.id != stakeholder.id,
                Stakeholder.is_active == True,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_STAKEHOLDER",
                    "message": f"Stakeholder with name '{target_name}' already exists for this project.",
                },
            )

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(stakeholder, key, value)
    session.add(stakeholder)
    session.commit()
    session.refresh(stakeholder)
    return stakeholder


def delete_stakeholder(session: Session, stakeholder: Stakeholder) -> Stakeholder:
    stakeholder.is_active = False
    session.add(stakeholder)
    session.commit()
    session.refresh(stakeholder)
    return stakeholder


# ── Meeting CRUD ──────────────────────────────────────────────────────

def list_meetings(
    session: Session,
    project_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Meeting], int]:
    statement = select(Meeting).where(Meeting.is_active == True)
    if project_id is not None:
        statement = statement.where(Meeting.project_id == project_id)

    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    meetings = list(session.exec(statement).all())
    return meetings, total


def get_meeting_by_id(session: Session, meeting_id: int) -> Optional[Meeting]:
    meeting = session.get(Meeting, meeting_id)
    if meeting and meeting.is_active:
        return meeting
    return None


def create_meeting(session: Session, data: MeetingCreate) -> Meeting:
    meeting = Meeting.model_validate(data)
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return meeting


def update_meeting(
    session: Session, meeting: Meeting, data: MeetingUpdate
) -> Meeting:
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(meeting, key, value)
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return meeting


def delete_meeting(session: Session, meeting: Meeting) -> Meeting:
    meeting.is_active = False
    session.add(meeting)
    session.commit()
    session.refresh(meeting)
    return meeting

