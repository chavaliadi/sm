from datetime import datetime
from sqlmodel import SQLModel


class UserRead(SQLModel):
    id: int
    name: str
    email: str
    role_id: int
    is_active: bool
    created_at: datetime
