"""
Auth schemas: input validation and D12-compliant read models.

UserRead excludes password_hash (D12).
PermissionRead wraps the raw Permission model (D12 consistency).
UserLogin/UserCreate use EmailStr for automatic 422 validation.
TokenPayload is the login response body (naming locked in plan Rev 2).
"""
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import SQLModel


class UserRead(SQLModel):
    id: int
    name: str
    email: str
    role_id: int
    is_active: bool
    created_at: datetime


class PermissionRead(SQLModel):
    id: int
    name: str


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserCreate(SQLModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class TokenPayload(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
