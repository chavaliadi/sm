from sqlmodel import Session, select
from app.models.notification import Notification


def list_notifications(session: Session) -> list[Notification]:
    statement = select(Notification)
    return list(session.exec(statement).all())


def create_notification(
    session: Session, user_id: int, title: str, message: str
) -> Notification:
    notification = Notification(user_id=user_id, title=title, message=message)
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification
