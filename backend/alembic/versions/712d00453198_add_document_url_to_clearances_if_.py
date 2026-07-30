"""add document_url to clearances if missing

Revision ID: 712d00453198
Revises: 7c9aac8eae81
Create Date: 2026-07-31 00:08:22.403545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '712d00453198'
down_revision: Union[str, None] = '7c9aac8eae81'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table('clearances'):
        existing_cols = {col['name'] for col in inspector.get_columns('clearances')}
        if 'document_url' not in existing_cols:
            op.add_column('clearances', sa.Column('document_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table('clearances'):
        existing_cols = {col['name'] for col in inspector.get_columns('clearances')}
        if 'document_url' in existing_cols:
            op.drop_column('clearances', 'document_url')
