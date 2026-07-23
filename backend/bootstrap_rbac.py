"""
RBAC Bootstrap Script — idempotent, safe to run repeatedly.

Creates the 4 roles, 12 permissions, role-permission mappings, and one
admin user required for RBAC testing. Every insert is get-or-create by
name/email, so running this twice in a row produces zero errors and
zero duplicate rows.

Usage:
    cd backend
    PYTHONPATH=. venv/bin/python bootstrap_rbac.py
"""
from sqlmodel import Session, select

from app.db.session import engine
from app.models.auth import Role, Permission, RolePermission, User
from app.core.security import hash_password


# ── Data definitions ─────────────────────────────────────────────────

ROLES = ["Admin", "Port Authority", "SMFCL", "Ministry"]

PERMISSIONS = [
    "MANAGE_USERS",
    "VIEW_PROJECTS",
    "MANAGE_PROJECTS",
    "VIEW_DPR",
    "MANAGE_DPR",
    "REVIEW_DPR",
    "VIEW_TASKS",
    "MANAGE_TASKS",
    "VIEW_STAKEHOLDERS",
    "MANAGE_STAKEHOLDERS",
    "VIEW_DASHBOARD",
    "VIEW_AUDIT_LOG",
    "VIEW_CLEARANCES",        
    "MANAGE_CLEARANCES",
    "VIEW_TENDERS",      
    "MANAGE_TENDERS",   
    "MANAGE_BIDS",
]

ROLE_PERMISSIONS = {
    "Admin": PERMISSIONS,  # all permissions
    "Port Authority": [
        "VIEW_PROJECTS",
        "MANAGE_PROJECTS",
        "VIEW_DPR",
        "MANAGE_DPR",
        "VIEW_TASKS",
        "MANAGE_TASKS",
        "VIEW_STAKEHOLDERS",
        "MANAGE_STAKEHOLDERS",
        "VIEW_DASHBOARD",
        "VIEW_CLEARANCES",
        "MANAGE_CLEARANCES",
    ],
    "SMFCL": [
        "VIEW_PROJECTS",
        "VIEW_DPR",
        "REVIEW_DPR",
        "VIEW_TASKS",
        "VIEW_STAKEHOLDERS",
        "VIEW_DASHBOARD",
        "VIEW_CLEARANCES",
        "VIEW_TENDERS",
        "MANAGE_TENDERS",
        "MANAGE_BIDS",
    ],
    "Ministry": [
        "VIEW_PROJECTS",
        "VIEW_DPR",
        "REVIEW_DPR",
        "VIEW_DASHBOARD",
    ],
}


# ── Helpers ──────────────────────────────────────────────────────────

def get_or_create_role(session: Session, name: str) -> Role:
    existing = session.exec(select(Role).where(Role.name == name)).first()
    if existing:
        print(f"  Role '{name}' already exists (id={existing.id}), skipping.")
        return existing
    role = Role(name=name)
    session.add(role)
    session.commit()
    session.refresh(role)
    print(f"  Created role '{name}' (id={role.id}).")
    return role


def get_or_create_permission(session: Session, name: str) -> Permission:
    existing = session.exec(
        select(Permission).where(Permission.name == name)
    ).first()
    if existing:
        return existing
    perm = Permission(name=name)
    session.add(perm)
    session.commit()
    session.refresh(perm)
    return perm


def ensure_role_permission(
    session: Session, role_id: int, permission_id: int
) -> None:
    existing = session.exec(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    ).first()
    if existing:
        return
    link = RolePermission(role_id=role_id, permission_id=permission_id)
    session.add(link)
    session.commit()


# ── Main ─────────────────────────────────────────────────────────────

def main():
    with Session(engine) as session:
        print("=== RBAC Bootstrap ===\n")

        # 1. Roles
        print("[1/4] Roles")
        role_map = {}
        for role_name in ROLES:
            role_map[role_name] = get_or_create_role(session, role_name)

        # 2. Permissions
        print("\n[2/4] Permissions")
        perm_map = {}
        for perm_name in PERMISSIONS:
            perm_map[perm_name] = get_or_create_permission(session, perm_name)
        print(f"  {len(PERMISSIONS)} permissions ensured.")

        # 3. Role-Permission mappings
        print("\n[3/4] Role-Permission mappings")
        for role_name, perm_names in ROLE_PERMISSIONS.items():
            role = role_map[role_name]
            for perm_name in perm_names:
                perm = perm_map[perm_name]
                ensure_role_permission(session, role.id, perm.id)
            print(f"  {role_name}: {len(perm_names)} permissions mapped.")

        # 4. Admin user
        print("\n[4/4] Admin user")
        # demo credential (admin123) — rotate immediately once this becomes more than a local MVP demo.
        admin_email = "admin@sagarmala.gov.in"
        existing_admin = session.exec(
            select(User).where(User.email == admin_email)
        ).first()
        if existing_admin:
            print(f"  Admin user '{admin_email}' already exists (id={existing_admin.id}), skipping.")
        else:
            admin_role = role_map["Admin"]
            admin_user = User(
                name="Admin",
                email=admin_email,
                password_hash=hash_password("admin123"),
                role_id=admin_role.id,
            )
            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)
            print(f"  Created admin user '{admin_email}' (id={admin_user.id}).")

        print("\n=== Bootstrap complete ===")


if __name__ == "__main__":
    main()
