from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import PaginatedResponse, PaginationMeta
from app.schemas.stakeholder import StakeholderRead, MeetingRead
from app.services import stakeholders as stakeholders_service

router = APIRouter(prefix="/stakeholders", tags=["Stakeholder & Meeting Management"])


@router.get("", response_model=PaginatedResponse[StakeholderRead])
def get_stakeholders(session: Session = Depends(get_session)):
    stakeholders = stakeholders_service.list_stakeholders(session)
    return PaginatedResponse(
        data=stakeholders,
        meta=PaginationMeta(page=1, page_size=20, total=len(stakeholders))
    )


@router.get("/meetings", response_model=PaginatedResponse[MeetingRead])
def get_meetings(session: Session = Depends(get_session)):
    meetings = stakeholders_service.list_meetings(session)
    return PaginatedResponse(
        data=meetings,
        meta=PaginationMeta(page=1, page_size=20, total=len(meetings))
    )
