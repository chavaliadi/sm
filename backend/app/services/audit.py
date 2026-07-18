"""
System-wide audit logging service.

Every module imports log_action() from here to record auditable events.
This is NOT RBAC-specific — it writes to the shared audit_log table.

Semantics locked in by the RBAC implementation plan (Revision 2):
  - user_id: FK to users.id for the actor. Nullable (e.g. failed login
    where the email does not match any user).
  - performed_by: Denormalized string snapshot of the actor's identity
    (name or email) at the time of action. Keeps the audit trail readable
    even if the user record is later deleted or renamed, or when the
    action has no matching user record at all.
"""
from typing import Optional

from sqlmodel import Session

from app.models.audit import AuditLog


def log_action(
    session: Session,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    performed_by: Optional[str] = None,
) -> AuditLog:
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
        performed_by=performed_by,
    )
    session.add(audit_entry)
    session.commit()
    session.refresh(audit_entry)
    return audit_entry
