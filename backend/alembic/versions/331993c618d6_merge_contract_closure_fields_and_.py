"""merge contract closure fields and clearance document_url migrations

Revision ID: 331993c618d6
Revises: 317033d7aafa, 712d00453198
Create Date: 2026-07-31 00:14:47.009699

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '331993c618d6'
down_revision: Union[str, None] = ('317033d7aafa', '712d00453198')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
