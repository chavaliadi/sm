"""
Auth service: business logic for login, user creation, user listing,
and permission listing.

Route → Service → SQLModel Session (no Repository layer, per D1).
"""
from typing import Optional

from sqlmodel import Session, select

from app.models.auth import User, Role, Permission
from app.core.security import hash_password, verify_password


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def authenticate_user(
    session: Session, email: str, password: str
) -> tuple[Optional[User], str]:
    """
    Returns (user, status_string).
    status_string is one of: "success", "not_found", "wrong_password", "inactive".
    """
    user = get_user_by_email(session, email)
    if user is None:
        return None, "not_found"
    if not verify_password(password, user.password_hash):
        return user, "wrong_password"
    if not user.is_active:
        return user, "inactive"
    return user, "success"


def create_user(
    session: Session, name: str, email: str, password: str, role_id: int
) -> User:
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role_id=role_id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def list_users(session: Session) -> list[User]:
    statement = select(User)
    return list(session.exec(statement).all())


def get_role_by_id(session: Session, role_id: int) -> Optional[Role]:
    return session.get(Role, role_id)


def list_permissions(session: Session) -> list[Permission]:
    statement = select(Permission)
    return list(session.exec(statement).all())
