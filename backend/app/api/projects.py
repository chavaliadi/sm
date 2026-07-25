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


@router.get("/{project_id}/detail", response_model=SuccessResponse[dict])
def get_project_detail(
    project_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_permission("VIEW_PROJECTS")),
):
    """
    Unified project detail view (RFP 4.6.3.2): returns the project plus
    aggregated data from every related module in a single read only response.
    """
    from sqlmodel import select
    from app.services.dpr import list_dprs
    from app.services.clearance_service import list_clearances
    from app.services.contract_service import list_contracts, list_work_orders
    from app.services.task import list_tasks
    from app.services.stakeholders import list_stakeholders, list_meetings
    from app.models.tender import Tender
    from app.models.bid import Bid
    from app.schemas.dpr import DPRRead
    from app.schemas.clearance import ClearanceRead
    from app.schemas.tender import TenderRead
    from app.schemas.contract import ContractRead
    from app.schemas.task import TaskRead
    from app.schemas.stakeholder import StakeholderRead, MeetingRead

    project = projects_service.get_project_by_id(session, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Project with ID {project_id} not found"},
        )

    project_data = ProjectRead.model_validate(project).model_dump(mode="json")

    # DPR: get the first (and typically only) DPR for this project
    dprs = list_dprs(session, project_id=project_id)
    dpr_data = DPRRead.model_validate(dprs[0]).model_dump(mode="json") if dprs else None

    # Clearances
    clearances_list, _ = list_clearances(session, page=1, page_size=100, project_id=project_id)
    clearances_data = [ClearanceRead.model_validate(c).model_dump(mode="json") for c in clearances_list]

    # Tenders: list_tenders does not support project_id, query directly
    tenders_raw = list(session.exec(
        select(Tender).where(Tender.project_id == project_id, Tender.is_active == True)
    ).all())
    tenders_data = []
    for t in tenders_raw:
        t_dict = TenderRead.model_validate(t).model_dump(mode="json")
        # Add bid summary for each tender
        bids = list(session.exec(
            select(Bid).where(Bid.tender_id == t.id, Bid.is_active == True)
        ).all())
        winning_bid = None
        if t.status == "AWARDED" and t.awarded_bid_id:
            wb = next((b for b in bids if b.id == t.awarded_bid_id), None)
            if wb:
                winning_bid = {
                    "id": wb.id,
                    "bidder_name": wb.bidder_name,
                    "financial_amount": wb.financial_amount,
                }
        t_dict["bid_summary"] = {
            "total_bids": len(bids),
            "winning_bid": winning_bid,
        }
        tenders_data.append(t_dict)

    # Contracts with work order counts
    contracts_list, _ = list_contracts(session, page=1, page_size=100, project_id=project_id)
    contracts_data = []
    for c in contracts_list:
        c_dict = ContractRead.model_validate(c).model_dump(mode="json")
        _, wo_count = list_work_orders(session, contract_id=c.id, page=1, page_size=1)
        c_dict["work_order_count"] = wo_count
        contracts_data.append(c_dict)

    # Tasks
    tasks_list, _ = list_tasks(session, page=1, page_size=100, project_id=project_id)
    tasks_data = [TaskRead.model_validate(t).model_dump(mode="json") for t in tasks_list]

    # Stakeholders
    stakeholders_list, _ = list_stakeholders(session, project_id=project_id, page=1, page_size=100)
    stakeholders_data = [StakeholderRead.model_validate(s).model_dump(mode="json") for s in stakeholders_list]

    # Meetings
    meetings_list, _ = list_meetings(session, project_id=project_id, page=1, page_size=100)
    meetings_data = [MeetingRead.model_validate(m).model_dump(mode="json") for m in meetings_list]

    result = {
        **project_data,
        "dpr": dpr_data,
        "clearances": clearances_data,
        "tenders": tenders_data,
        "contracts": contracts_data,
        "tasks": tasks_data,
        "stakeholders": stakeholders_data,
        "meetings": meetings_data,
    }

    return SuccessResponse(data=result)

