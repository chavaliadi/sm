from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class RolePermission(SQLModel, table=True):
    __tablename__ = "role_permissions"
    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    permission_id: int = Field(foreign_key="permissions.id", primary_key=True)


class Permission(SQLModel, table=True):
    __tablename__ = "permissions"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    roles: List["Role"] = Relationship(
        back_populates="permissions", link_model=RolePermission
    )


class Role(SQLModel, table=True):
    __tablename__ = "roles"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    permissions: List[Permission] = Relationship(
        back_populates="roles", link_model=RolePermission
    )
    users: List["User"] = Relationship(back_populates="role")


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role_id: int = Field(foreign_key="roles.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    role: Optional[Role] = Relationship(back_populates="users")
