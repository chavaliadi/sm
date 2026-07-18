"""
Auth API routes: login, user management, permission listing.

All error responses use D11 detail dicts so the global handler in main.py
wraps them into the standard D7 error envelope.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import get_current_user, require_permission
from app.core.security import create_access_token
from app.schemas.responses import (
    SuccessResponse,
    PaginatedResponse,
    PaginationMeta,
)
from app.schemas.auth import (
    UserRead,
    UserLogin,
    UserCreate,
    TokenPayload,
    PermissionRead,
)
from app.services import auth as auth_service
from app.services.audit import log_action
from app.models.auth import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── POST /auth/login ─────────────────────────────────────────────────
@router.post("/login", response_model=SuccessResponse[TokenPayload])
def login(body: UserLogin, request: Request, session: Session = Depends(get_session)):
    user, auth_status = auth_service.authenticate_user(
        session, str(body.email), body.password
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    if auth_status == "not_found":
        log_action(
            session,
            user_id=None,
            action="LOGIN_FAILURE",
            entity_type="User",
            performed_by=str(body.email),
            ip_address=ip,
            user_agent=ua,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )

    if auth_status == "wrong_password":
        log_action(
            session,
            user_id=user.id,
            action="LOGIN_FAILURE",
            entity_type="User",
            entity_id=user.id,
            performed_by=user.email,
            ip_address=ip,
            user_agent=ua,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )

    if auth_status == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INACTIVE_USER", "message": "User account is deactivated"},
        )

    # auth_status == "success"
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role_id": user.role_id}
    )

    log_action(
        session,
        user_id=user.id,
        action="LOGIN_SUCCESS",
        entity_type="User",
        entity_id=user.id,
        performed_by=user.email,
        ip_address=ip,
        user_agent=ua,
    )

    user_read = UserRead.model_validate(user)
    payload = TokenPayload(access_token=token, user=user_read)
    return SuccessResponse(data=payload)


# ── POST /auth/users ─────────────────────────────────────────────────
@router.post(
    "/users",
    response_model=SuccessResponse[UserRead],
    dependencies=[Depends(require_permission("MANAGE_USERS"))],
)
def create_user(
    body: UserCreate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Check role exists
    role = auth_service.get_role_by_id(session, body.role_id)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROLE_NOT_FOUND", "message": f"Role with id {body.role_id} does not exist"},
        )

    # Check email uniqueness
    existing = auth_service.get_user_by_email(session, str(body.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "USER_ALREADY_EXISTS", "message": "A user with this email already exists"},
        )

    new_user = auth_service.create_user(
        session,
        name=body.name,
        email=str(body.email),
        password=body.password,
        role_id=body.role_id,
    )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    log_action(
        session,
        user_id=current_user.id,
        action="USER_CREATED",
        entity_type="User",
        entity_id=new_user.id,
        performed_by=current_user.email,
        ip_address=ip,
        user_agent=ua,
    )

    return SuccessResponse(data=UserRead.model_validate(new_user))


# ── GET /auth/users ──────────────────────────────────────────────────
@router.get(
    "/users",
    response_model=PaginatedResponse[UserRead],
    dependencies=[Depends(require_permission("MANAGE_USERS"))],
)
def get_users(session: Session = Depends(get_session)):
    users = auth_service.list_users(session)
    return PaginatedResponse(
        data=[UserRead.model_validate(u) for u in users],
        meta=PaginationMeta(page=1, page_size=20, total=len(users)),
    )


# ── GET /auth/permissions ────────────────────────────────────────────
@router.get(
    "/permissions",
    response_model=PaginatedResponse[PermissionRead],
    dependencies=[Depends(require_permission("MANAGE_USERS"))],
)
def get_permissions(session: Session = Depends(get_session)):
    permissions = auth_service.list_permissions(session)
    return PaginatedResponse(
        data=[PermissionRead.model_validate(p) for p in permissions],
        meta=PaginationMeta(page=1, page_size=50, total=len(permissions)),
    )
