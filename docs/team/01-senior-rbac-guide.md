---
description: 01-senior-rbac-guide.md
---
# Guide: Adding New Roles using the Class Inheritance Model

As defined by the strict architectural requirements for the Python Class Inheritance RBAC model in Sagarmala 2.0, the backend no longer relies on complex `RolePermission` many-to-many SQL mapping tables.

Instead, the RBAC evaluates dynamic permissions directly efficiently in RAM using inherited Python classes.

## How to add a new Role
All role inheritance rules are handled in `backend/app/core/roles.py`.

### Step 1: Create a Class inheriting from an existing Role
To add a new role (e.g. `ExternalAuditor`), you would inherit from `BaseRole` (or any other role). By inheriting from a role like `PortAuthorityRole`, your new role automatically consumes structurally all the hierarchical permissions of its parent!

```python
from app.core.roles import BaseRole, SmfclAppraiserRole

# Example 1: Creating a fresh role with no inherent permissions
class ExternalAuditorRole(BaseRole):
    permissions = [
        "VIEW_DASHBOARD",
        "VIEW_AUDIT_LOGS"
    ]

# Example 2: Creating a Super-Appraiser that inherits everything from SMFCL
class ManagingDirectorRole(SmfclAppraiserRole):
    # Inherits all SMFCL + Port Authority permissions automatically, and adds its own:
    permissions = SmfclAppraiserRole.permissions + [
        "MANAGE_USERS",
        "OVERRIDE_DPR_RULES"
    ]
```

### Step 2: Map the Class in the Registry
Once the class is defined, instantly bind the exact database string `Role.name` to your class inside the `ROLE_REGISTRY`:

```python
ROLE_REGISTRY = {
    ...,
    "External Auditor": ExternalAuditorRole,
    "Managing Director": ManagingDirectorRole,
}
```
That's it! 

### How `require_permission` works
Inside your API routes:
```python
@router.post("/reports", dependencies=[Depends(require_permission("VIEW_AUDIT_LOGS"))])
def get_reports(...):
```
The fast dependency engine instantly looks up `get_role_class(role.name)`, and then checks `role_class.has_permission("VIEW_AUDIT_LOGS")`. If the permission is absent from the inheritance tree, it throws a safe HTTP 403 Forbidden!
