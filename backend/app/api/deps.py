"""
FastAPI dependencies for authentication and authorization.

get_current_user: decodes the Bearer token, loads the User from DB.
require_permission: returns a dependency that checks the user's role
                    has a specific permission string (D5: dynamic, never
                    hardcoded role checks).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, ExpiredSignatureError
from sqlmodel import Session, select

from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.auth import User, Role, RolePermission, Permission

reusable_oauth2 = HTTPBearer()


def get_current_user(
    session: Session = Depends(get_session),
    credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
) -> User:
    """Decode Bearer token and return the active User object."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Access token has expired"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Could not validate token"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token payload missing subject"},
        )

    user = session.get(User, int(user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "User not found or inactive"},
        )
    return user


def require_permission(permission_name: str):
    """
    Factory that returns a FastAPI dependency. The dependency resolves
    get_current_user, then checks if that user's role includes the
    named permission. Usage:

        @router.get("/admin-only", dependencies=[Depends(require_permission("MANAGE_USERS"))])
        def admin_endpoint(...): ...
    """

    def _permission_checker(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
    ) -> User:
        # Load the user's role and its linked permissions
        role = session.get(Role, current_user.role_id)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PERMISSION_DENIED",
                    "message": "User role not found",
                },
            )

        # Query permission names for this role via the link table
        stmt = (
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        )
        user_permissions = set(session.exec(stmt).all())

        if permission_name not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PERMISSION_DENIED",
                    "message": f"Permission '{permission_name}' required",
                },
            )
        return current_user

    return _permission_checker
