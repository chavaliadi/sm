from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import PaginatedResponse, PaginationMeta
from app.schemas.project import ProjectRead
from app.services import projects as projects_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectRead])
def get_projects(session: Session = Depends(get_session)):
    projects = projects_service.list_projects(session)
    return PaginatedResponse(
        data=projects,
        meta=PaginationMeta(page=1, page_size=20, total=len(projects))
    )
