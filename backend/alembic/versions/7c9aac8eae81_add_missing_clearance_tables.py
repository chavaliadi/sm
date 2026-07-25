"""add missing clearance tables

Revision ID: 7c9aac8eae81
Revises: a359a38baaae
Create Date: 2026-07-25 17:25:10.146519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '7c9aac8eae81'
down_revision: Union[str, None] = 'a359a38baaae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table('clearances'):
        op.create_table('clearances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('clearance_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('authority_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('application_date', sa.DateTime(), nullable=True),
        sa.Column('approval_date', sa.DateTime(), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('document_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('remarks', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )

    inspector = inspect(bind)
    existing_indexes = (
        {idx['name'] for idx in inspector.get_indexes('clearances')}
        if inspector.has_table('clearances') else set()
    )
    if 'ix_clearances_clearance_type' not in existing_indexes:
        op.create_index(op.f('ix_clearances_clearance_type'), 'clearances', ['clearance_type'], unique=False)
    if 'ix_clearances_project_id' not in existing_indexes:
        op.create_index(op.f('ix_clearances_project_id'), 'clearances', ['project_id'], unique=False)
    if 'ix_clearances_status' not in existing_indexes:
        op.create_index(op.f('ix_clearances_status'), 'clearances', ['status'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table('clearances'):
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('clearances')}
        if 'ix_clearances_status' in existing_indexes:
            op.drop_index(op.f('ix_clearances_status'), table_name='clearances')
        if 'ix_clearances_project_id' in existing_indexes:
            op.drop_index(op.f('ix_clearances_project_id'), table_name='clearances')
        if 'ix_clearances_clearance_type' in existing_indexes:
            op.drop_index(op.f('ix_clearances_clearance_type'), table_name='clearances')
        op.drop_table('clearances')

