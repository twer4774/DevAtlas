"""nullable_position

Revision ID: e7f8a9b0c1d2
Revises: f92469fc1873
Create Date: 2026-06-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert default {x:0, y:0} positions to NULL so Dagre handles layout
    op.execute(
        "UPDATE architecture_nodes SET position = NULL "
        "WHERE position = '{\"x\": 0, \"y\": 0}'::jsonb"
    )
    op.alter_column('architecture_nodes', 'position', nullable=True)


def downgrade() -> None:
    op.execute(
        "UPDATE architecture_nodes SET position = '{\"x\": 0, \"y\": 0}'::jsonb "
        "WHERE position IS NULL"
    )
    op.alter_column('architecture_nodes', 'position', nullable=False)
