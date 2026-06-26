"""drop user FK constraints for portal auth

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-06-25

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop FK constraints so Portal user IDs (not in gittrack users table) can be stored
    op.drop_constraint('issues_creator_id_fkey', 'issues', type_='foreignkey')
    op.drop_constraint('comments_author_id_fkey', 'comments', type_='foreignkey')
    op.drop_constraint('specs_created_by_fkey', 'specs', type_='foreignkey')


def downgrade() -> None:
    op.create_foreign_key('specs_created_by_fkey', 'specs', 'users', ['created_by'], ['id'])
    op.create_foreign_key('comments_author_id_fkey', 'comments', 'users', ['author_id'], ['id'])
    op.create_foreign_key('issues_creator_id_fkey', 'issues', 'users', ['creator_id'], ['id'])
