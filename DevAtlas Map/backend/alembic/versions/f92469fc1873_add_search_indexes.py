"""add_search_indexes

Revision ID: f92469fc1873
Revises: 60ff886536a3
Create Date: 2026-04-22 13:21:25.827278

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f92469fc1873'
down_revision: Union[str, Sequence[str], None] = '60ff886536a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS nodes_title_gin ON architecture_nodes USING gin(to_tsvector('english', title))")
    op.execute("CREATE INDEX IF NOT EXISTS documents_title_gin ON documents USING gin(to_tsvector('english', title))")
    op.execute("CREATE INDEX IF NOT EXISTS nodes_version_id_idx ON architecture_nodes(version_id)")
    op.execute("CREATE INDEX IF NOT EXISTS documents_version_id_idx ON documents(version_id)")
    op.execute("CREATE INDEX IF NOT EXISTS nodes_parent_id_idx ON architecture_nodes(parent_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS nodes_title_gin")
    op.execute("DROP INDEX IF EXISTS documents_title_gin")
    op.execute("DROP INDEX IF EXISTS nodes_version_id_idx")
    op.execute("DROP INDEX IF EXISTS documents_version_id_idx")
    op.execute("DROP INDEX IF EXISTS nodes_parent_id_idx")
