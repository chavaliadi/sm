"""create tenders and bids tables, add awarded_bid_id to tenders

Revision ID: b3c1d9f4e2a7
Revises: ea6fb1c18cc8
Create Date: 2026-07-23 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b3c1d9f4e2a7'
down_revision: Union[str, None] = 'c4d2e5f3a1b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenders table (if not exists - idempotent header)
    op.create_table(
        'tenders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('tender_code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('awarded_bid_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tenders_project_id'), 'tenders', ['project_id'], unique=False)
    op.create_index(op.f('ix_tenders_tender_code'), 'tenders', ['tender_code'], unique=True)

    # Create bids table
    op.create_table(
        'bids',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tender_id', sa.Integer(), nullable=False),
        sa.Column('bidder_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('technical_score', sa.Float(), nullable=True),
        sa.Column('financial_amount', sa.Float(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_bids_tender_id'), 'bids', ['tender_id'], unique=False)

    # Add FK from tenders.awarded_bid_id -> bids.id
    op.create_foreign_key(
        'fk_tenders_awarded_bid_id_bids',
        'tenders', 'bids',
        ['awarded_bid_id'], ['id']
    )

    # Create tender_audit_log table
    op.create_table(
        'tender_audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tender_id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=False),
        sa.Column('action', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('old_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('new_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('comment', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tender_audit_log_tender_id'), 'tender_audit_log', ['tender_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tender_audit_log_tender_id'), table_name='tender_audit_log')
    op.drop_table('tender_audit_log')
    op.drop_constraint('fk_tenders_awarded_bid_id_bids', 'tenders', type_='foreignkey')
    op.drop_index(op.f('ix_bids_tender_id'), table_name='bids')
    op.drop_table('bids')
    op.drop_index(op.f('ix_tenders_tender_code'), table_name='tenders')
    op.drop_index(op.f('ix_tenders_project_id'), table_name='tenders')
    op.drop_table('tenders')
