from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import PaginatedResponse, PaginationMeta
from app.schemas.task import TaskRead
from app.services import tasks as tasks_service

router = APIRouter(prefix="/tasks", tags=["Task Management"])


@router.get("", response_model=PaginatedResponse[TaskRead])
def get_tasks(session: Session = Depends(get_session)):
    tasks = tasks_service.list_tasks(session)
    return PaginatedResponse(
        data=tasks,
        meta=PaginationMeta(page=1, page_size=20, total=len(tasks))
    )
