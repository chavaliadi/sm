from sqlmodel import Session, select
from app.models.dpr import DPR


def list_dprs(session: Session) -> list[DPR]:
    statement = select(DPR).where(DPR.is_active == True)
    return list(session.exec(statement).all())


def delete_dpr(session: Session, dpr_id: int) -> tuple[bool, str]:
    dpr = session.get(DPR, dpr_id)
    if not dpr or not dpr.is_active:
        return False, "DPR not found"
    if dpr.status != "DRAFT":
        return False, "Only DRAFT DPRs can be deleted"
    
    dpr.is_active = False
    session.add(dpr)
    session.commit()
    return True, "DPR deleted successfully"
