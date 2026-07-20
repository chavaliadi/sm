"""
Scalable Python Class Inheritance model for Role-Based Access Control (RBAC).

This enforces permissions by checking against an inherited class hierarchy rather
than doing expensive database joins for permissions.

## Guide to Adding New Roles:
1. Create a new class inheriting from `BaseRole` (or another role).
2. Override or extend the `permissions` list.
3. Map the exact database `Role.name` string to your new class in `ROLE_REGISTRY`.
"""

class BaseRole:
    """Base generic role with no permissions."""
    permissions: list[str] = []

    @classmethod
    def has_permission(cls, permission_name: str) -> bool:
        return permission_name in cls.permissions


class PortAuthorityRole(BaseRole):
    """Port Authority users can create/submit projects and studies."""
    permissions = [
        "SUBMIT_DPR",
        "EDIT_PROJECT",
        "CREATE_TASK",
        "VIEW_DASHBOARD"
    ]


class SmfclAppraiserRole(PortAuthorityRole):
    """SMFCL inherently gets Port Authority view powers plus evaluation."""
    permissions = PortAuthorityRole.permissions + [
        "EVALUATE_PROJECT",
        "APPROVE_DPR",
        "APPROVE_FUNDS"
    ]


class MinistryReviewerRole(BaseRole):
    """Ministry only approves/rejects at the highest level."""
    permissions = [
        "MINISTRY_APPROVE_DPR",
        "VIEW_DASHBOARD"
    ]


class AdminRole(BaseRole):
    """Admin has root-level permissions."""
    permissions = [
        "MANAGE_USERS",
        "VIEW_DASHBOARD",
        "EVALUATE_PROJECT",
        "APPROVE_DPR",
        "SUBMIT_DPR"
    ]


# Maps the database string Role.name to its Python Inheritance Class
ROLE_REGISTRY = {
    "Admin": AdminRole,
    "Port Authority": PortAuthorityRole,
    "SMFCL Appraiser": SmfclAppraiserRole,
    "Ministry": MinistryReviewerRole,
}

def get_role_class(role_name: str):
    return ROLE_REGISTRY.get(role_name, BaseRole)
