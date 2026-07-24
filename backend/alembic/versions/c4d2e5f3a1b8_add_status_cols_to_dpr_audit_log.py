"""add old_status and new_status to dpr_audit_log

Revision ID: c4d2e5f3a1b8
Revises: ea6fb1c18cc8
Create Date: 2026-07-23 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c4d2e5f3a1b8'
down_revision: Union[str, None] = 'ea6fb1c18cc8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('dpr_audit_log', sa.Column('old_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('dpr_audit_log', sa.Column('new_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_column('dpr_audit_log', 'new_status')
    op.drop_column('dpr_audit_log', 'old_status')
