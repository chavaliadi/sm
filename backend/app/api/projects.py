from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.db.session import get_session
from app.api.deps import require_permission, get_current_user
from app.models.auth import User
from app.schemas.responses import PaginatedResponse, PaginationMeta, SuccessResponse
from app.schemas.project import ProjectRead, ProjectCreate, ProjectUpdate
from app.services import projects as projects_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectRead])
def get_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query across code, name, port, state"),
    category: Optional[str] = Query(None, description="Filter by project category"),
    state: Optional[str] = Query(None, description="Filter by state"),
    lifecycle_stage: Optional[str] = Query(None, description="Filter by lifecycle stage"),
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    List all active projects with pagination, search, and filtering.
    """
    projects, total = projects_service.list_projects(
        session=session,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        state=state,
        lifecycle_stage=lifecycle_stage,
    )
    return PaginatedResponse(
        data=[ProjectRead.model_validate(p) for p in projects],
        meta=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/{project_id}", response_model=SuccessResponse[ProjectRead])
def get_project(
    project_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    Retrieve a specific project by ID.
    """
    project = projects_service.get_project_by_id(session, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Project with ID {project_id} not found"},
        )
    return SuccessResponse(data=ProjectRead.model_validate(project))


@router.post("", response_model=SuccessResponse[ProjectRead], status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Create a new project. Unique project_code is enforced.
    """
    existing = projects_service.get_project_by_code(session, project_in.project_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "DUPLICATE_PROJECT_CODE",
                "message": f"Project with code '{project_in.project_code}' already exists",
                "field": "project_code",
            },
        )

    project = projects_service.create_project(
        session=session, project_in=project_in, current_user_id=current_user.id
    )
    return SuccessResponse(data=ProjectRead.model_validate(project))


@router.put("/{project_id}", response_model=SuccessResponse[ProjectRead])
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Update an existing project's configuration and metadata.
    """
    db_project = projects_service.get_project_by_id(session, project_id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Project with ID {project_id} not found"},
        )

    if project_in.project_code and project_in.project_code != db_project.project_code:
        existing = projects_service.get_project_by_code(session, project_in.project_code)
        if existing and existing.id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "DUPLICATE_PROJECT_CODE",
                    "message": f"Project with code '{project_in.project_code}' already exists",
                    "field": "project_code",
                },
            )

    updated_project = projects_service.update_project(
        session=session,
        db_project=db_project,
        project_in=project_in,
        current_user_id=current_user.id,
    )
    return SuccessResponse(data=ProjectRead.model_validate(updated_project))


@router.delete("/{project_id}", response_model=SuccessResponse[ProjectRead])
def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_permission("MANAGE_PROJECTS")),
):
    """
    Soft delete a project (sets is_active = False).
    """
    db_project = projects_service.get_project_by_id(session, project_id)
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Project with ID {project_id} not found"},
        )

    deleted_project = projects_service.delete_project(
        session=session, db_project=db_project, current_user_id=current_user.id
    )
    return SuccessResponse(data=ProjectRead.model_validate(deleted_project))
