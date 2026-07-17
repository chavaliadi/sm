from datetime import datetime
from sqlmodel import SQLModel


class NotificationRead(SQLModel):
    id: int
    user_id: int
    title: str
    message: str
    read: bool
    created_at: datetime
