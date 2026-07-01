"""roadmap version_id and custom status

Revision ID: j4k5l6m7n8o9
Revises: i3j4k5l6m7n8
Create Date: 2026-07-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'j4k5l6m7n8o9'
down_revision = 'i3j4k5l6m7n8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('roadmap_items',
        sa.Column('version_id', UUID(as_uuid=True),
                  sa.ForeignKey('versions.id', ondelete='SET NULL'),
                  nullable=True))
    op.create_index('ix_roadmap_items_version_id', 'roadmap_items', ['version_id'])
    # status 컬럼 크기 확장 (커스텀 상태값 허용)
    op.alter_column('roadmap_items', 'status',
                    type_=sa.String(50), existing_nullable=False)


def downgrade() -> None:
    op.alter_column('roadmap_items', 'status',
                    type_=sa.String(20), existing_nullable=False)
    op.drop_index('ix_roadmap_items_version_id', 'roadmap_items')
    op.drop_column('roadmap_items', 'version_id')
