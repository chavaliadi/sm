from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user, require_permission
from app.schemas.responses import (
    SuccessResponse,
    PaginatedResponse,
    PaginationMeta,
)
from app.schemas.stakeholder import (
    StakeholderCreate,
    StakeholderUpdate,
    StakeholderRead,
    MeetingCreate,
    MeetingUpdate,
    MeetingRead,
)
from app.services import stakeholders as stakeholders_service
from app.services.audit import log_action
from app.models.auth import User
from app.models.project import Project

router = APIRouter(prefix="/stakeholders", tags=["Stakeholders"])
meetings_router = APIRouter(prefix="/meetings", tags=["Meetings"])


# ── STAKEHOLDERS ENDPOINTS ───────────────────────────────────────────

@router.post(
    "",
    response_model=SuccessResponse[StakeholderRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def create_stakeholder(
    body: StakeholderCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    project = session.get(Project, body.project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PROJECT_NOT_FOUND",
                "message": f"Project with id {body.project_id} not found",
            },
        )

    stakeholder = stakeholders_service.create_stakeholder(session, body)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="STAKEHOLDER_CREATED",
        entity_type="Stakeholder",
        entity_id=stakeholder.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=StakeholderRead.model_validate(stakeholder))


@router.get(
    "",
    response_model=PaginatedResponse[StakeholderRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("VIEW_STAKEHOLDERS"))],
)
def get_stakeholders(
    project_id: Optional[int] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    stakeholders, total = stakeholders_service.list_stakeholders(
        session, project_id=project_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=[StakeholderRead.model_validate(s) for s in stakeholders],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get(
    "/{stakeholder_id}",
    response_model=SuccessResponse[StakeholderRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("VIEW_STAKEHOLDERS"))],
)
def get_stakeholder(
    stakeholder_id: int,
    session: Session = Depends(get_session),
):
    stakeholder = stakeholders_service.get_stakeholder_by_id(session, stakeholder_id)
    if not stakeholder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "STAKEHOLDER_NOT_FOUND",
                "message": f"Stakeholder with id {stakeholder_id} not found",
            },
        )
    return SuccessResponse(data=StakeholderRead.model_validate(stakeholder))


@router.put(
    "/{stakeholder_id}",
    response_model=SuccessResponse[StakeholderRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def update_stakeholder(
    stakeholder_id: int,
    body: StakeholderUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stakeholder = stakeholders_service.get_stakeholder_by_id(session, stakeholder_id)
    if not stakeholder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "STAKEHOLDER_NOT_FOUND",
                "message": f"Stakeholder with id {stakeholder_id} not found",
            },
        )

    if body.project_id is not None:
        project = session.get(Project, body.project_id)
        if not project or not project.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "PROJECT_NOT_FOUND",
                    "message": f"Project with id {body.project_id} not found",
                },
            )

    updated = stakeholders_service.update_stakeholder(session, stakeholder, body)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="STAKEHOLDER_UPDATED",
        entity_type="Stakeholder",
        entity_id=updated.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=StakeholderRead.model_validate(updated))


@router.delete(
    "/{stakeholder_id}",
    response_model=SuccessResponse[StakeholderRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def delete_stakeholder(
    stakeholder_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stakeholder = stakeholders_service.get_stakeholder_by_id(session, stakeholder_id)
    if not stakeholder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "STAKEHOLDER_NOT_FOUND",
                "message": f"Stakeholder with id {stakeholder_id} not found",
            },
        )

    deleted = stakeholders_service.delete_stakeholder(session, stakeholder)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="STAKEHOLDER_DELETED",
        entity_type="Stakeholder",
        entity_id=stakeholder_id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=StakeholderRead.model_validate(deleted))


# ── MEETINGS ENDPOINTS ───────────────────────────────────────────────

@meetings_router.post(
    "",
    response_model=SuccessResponse[MeetingRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def create_meeting(
    body: MeetingCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    project = session.get(Project, body.project_id)
    if not project or not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PROJECT_NOT_FOUND",
                "message": f"Project with id {body.project_id} not found",
            },
        )

    meeting = stakeholders_service.create_meeting(session, body)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="MEETING_CREATED",
        entity_type="Meeting",
        entity_id=meeting.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=MeetingRead.model_validate(meeting))


@meetings_router.get(
    "",
    response_model=PaginatedResponse[MeetingRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("VIEW_STAKEHOLDERS"))],
)
def get_meetings(
    project_id: Optional[int] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    meetings, total = stakeholders_service.list_meetings(
        session, project_id=project_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=[MeetingRead.model_validate(m) for m in meetings],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@meetings_router.get(
    "/{meeting_id}",
    response_model=SuccessResponse[MeetingRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("VIEW_STAKEHOLDERS"))],
)
def get_meeting(
    meeting_id: int,
    session: Session = Depends(get_session),
):
    meeting = stakeholders_service.get_meeting_by_id(session, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "MEETING_NOT_FOUND",
                "message": f"Meeting with id {meeting_id} not found",
            },
        )
    return SuccessResponse(data=MeetingRead.model_validate(meeting))


@meetings_router.put(
    "/{meeting_id}",
    response_model=SuccessResponse[MeetingRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def update_meeting(
    meeting_id: int,
    body: MeetingUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    meeting = stakeholders_service.get_meeting_by_id(session, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "MEETING_NOT_FOUND",
                "message": f"Meeting with id {meeting_id} not found",
            },
        )

    if body.project_id is not None:
        project = session.get(Project, body.project_id)
        if not project or not project.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "PROJECT_NOT_FOUND",
                    "message": f"Project with id {body.project_id} not found",
                },
            )

    updated = stakeholders_service.update_meeting(session, meeting, body)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="MEETING_UPDATED",
        entity_type="Meeting",
        entity_id=updated.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=MeetingRead.model_validate(updated))


@meetings_router.delete(
    "/{meeting_id}",
    response_model=SuccessResponse[MeetingRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("MANAGE_STAKEHOLDERS"))],
)
def delete_meeting(
    meeting_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    meeting = stakeholders_service.get_meeting_by_id(session, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "MEETING_NOT_FOUND",
                "message": f"Meeting with id {meeting_id} not found",
            },
        )

    deleted = stakeholders_service.delete_meeting(session, meeting)

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="MEETING_DELETED",
        entity_type="Meeting",
        entity_id=meeting_id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=MeetingRead.model_validate(deleted))

