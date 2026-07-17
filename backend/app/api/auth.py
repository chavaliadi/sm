from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import PaginatedResponse, PaginationMeta
from app.schemas.auth import UserRead
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/users", response_model=PaginatedResponse[UserRead])
def get_users(session: Session = Depends(get_session)):
    users = auth_service.list_users(session)
    return PaginatedResponse(
        data=users,
        meta=PaginationMeta(page=1, page_size=20, total=len(users))
    )
