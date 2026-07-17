from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.dpr import DPRRead
from app.services import dpr as dpr_service

router = APIRouter(prefix="/dpr", tags=["DPR Submission & Approval Workflow"])


@router.get("", response_model=PaginatedResponse[DPRRead])
def get_dprs(session: Session = Depends(get_session)):
    """
    List active DPR entries.
    """
    dprs = dpr_service.list_dprs(session)
    return PaginatedResponse(
        data=dprs,
        meta=PaginationMeta(page=1, page_size=20, total=len(dprs))
    )


@router.delete("/{id}", response_model=SuccessResponse[dict])
def delete_dpr(id: int, session: Session = Depends(get_session)):
    """
    Soft-deletes a DPR, but only if its status is DRAFT.
    """
    success, message = dpr_service.delete_dpr(session, id)
    if not success:
        if message == "DPR not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": message}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_STATE_TRANSITION", "message": message}
            )
    return SuccessResponse(data={"message": message})
