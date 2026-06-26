"""add org_id to projects

Revision ID: a2b3c4d5e6f7
Revises: 91b2ea0a96f8
Create Date: 2026-06-25

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '91b2ea0a96f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('org_id', sa.String(255), nullable=True))
    op.create_index('ix_projects_org_id', 'projects', ['org_id'])


def downgrade() -> None:
    op.drop_index('ix_projects_org_id', table_name='projects')
    op.drop_column('projects', 'org_id')
