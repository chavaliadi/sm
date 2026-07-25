from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.responses import SuccessResponse, PaginatedResponse, PaginationMeta
from app.schemas.notification import NotificationRead
from app.services import notifications as notifications_service
from app.models.notification import Notification

router = APIRouter(
    prefix="/notifications", tags=["Notifications (Backend-only plumbing)"]
)


@router.get("", response_model=PaginatedResponse[NotificationRead])
def get_notifications(session: Session = Depends(get_session)):
    notifications = notifications_service.list_notifications(session)
    return PaginatedResponse(
        data=notifications,
        meta=PaginationMeta(page=1, page_size=20, total=len(notifications))
    )


@router.delete("/{id}", response_model=SuccessResponse[dict])
def delete_notification(id: int, session: Session = Depends(get_session)):
    notification = session.get(Notification, id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Notification not found"}
        )
    session.delete(notification)
    session.commit()
    return SuccessResponse(data={"message": "Notification deleted successfully"})
@router.put("/read-all", response_model=SuccessResponse[dict])
def mark_all_as_read(session: Session = Depends(get_session)):
    notifications = notifications_service.list_notifications(session)
    for n in notifications:
        n.read = True
    session.commit()
    return SuccessResponse(data={"message": "All notifications marked as read"})
