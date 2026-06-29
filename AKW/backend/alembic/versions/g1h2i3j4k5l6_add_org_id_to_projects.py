"""add org_id to projects

Revision ID: g1h2i3j4k5l6
Revises: f92469fc1873
Create Date: 2026-06-25

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'g1h2i3j4k5l6'
down_revision: Union[str, None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('org_id', sa.String(36), nullable=True))
    op.create_index('ix_projects_org_id', 'projects', ['org_id'])


def downgrade() -> None:
    op.drop_index('ix_projects_org_id', table_name='projects')
    op.drop_column('projects', 'org_id')
