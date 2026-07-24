from datetime import datetime
from typing import Optional, Tuple, List
from sqlmodel import Session, select, func, or_
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def list_projects(
    session: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    lifecycle_stage: Optional[str] = None,
) -> Tuple[List[Project], int]:
    """
    List active projects with pagination, search, and filtering.
    """
    statement = select(Project).where(Project.is_active == True)

    if search:
        query_str = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Project.name.ilike(query_str),
                Project.project_code.ilike(query_str),
                Project.port_name.ilike(query_str),
                Project.state.ilike(query_str),
                Project.category.ilike(query_str),
            )
        )

    if category:
        statement = statement.where(Project.category == category)

    if state:
        statement = statement.where(Project.state == state)

    if lifecycle_stage:
        statement = statement.where(Project.lifecycle_stage == lifecycle_stage)

    # Count total matching records
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Paginate and order by created_at desc
    statement = statement.order_by(Project.created_at.desc())
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    projects = list(session.exec(statement).all())
    return projects, total


def get_project_by_id(session: Session, project_id: int) -> Optional[Project]:
    """Retrieve a single active project by ID."""
    statement = select(Project).where(Project.id == project_id, Project.is_active == True)
    return session.exec(statement).first()


def get_project_by_code(session: Session, project_code: str) -> Optional[Project]:
    """Retrieve a project by code (including inactive for uniqueness check)."""
    statement = select(Project).where(Project.project_code == project_code)
    return session.exec(statement).first()


def create_project(
    session: Session,
    project_in: ProjectCreate,
    current_user_id: Optional[int] = None,
) -> Project:
    """Create a new project record."""
    project = Project(
        **project_in.model_dump(),
        created_by=current_user_id,
        updated_by=current_user_id,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def update_project(
    session: Session,
    db_project: Project,
    project_in: ProjectUpdate,
    current_user_id: Optional[int] = None,
) -> Project:
    """Update fields on an existing project record."""
    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db_project.updated_by = current_user_id
    db_project.updated_at = datetime.utcnow()

    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


def delete_project(
    session: Session,
    db_project: Project,
    current_user_id: Optional[int] = None,
) -> Project:
    """Soft delete a project by setting is_active = False."""
    db_project.is_active = False
    db_project.updated_by = current_user_id
    db_project.updated_at = datetime.utcnow()

    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project
