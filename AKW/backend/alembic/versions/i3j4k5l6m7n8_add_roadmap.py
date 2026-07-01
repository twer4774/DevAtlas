"""add roadmap_items

Revision ID: i3j4k5l6m7n8
Revises: h2i3j4k5l6m7
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'i3j4k5l6m7n8'
down_revision = 'h2i3j4k5l6m7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'roadmap_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('priority', sa.String(4), nullable=False, server_default='p3'),
        sa.Column('category', sa.String(100), nullable=False, server_default='공통'),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('size', sa.String(4), nullable=False, server_default='M'),
        sa.Column('status', sa.String(20), nullable=False, server_default='todo'),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_roadmap_items_project_id', 'roadmap_items', ['project_id'])


def downgrade() -> None:
    op.drop_index('ix_roadmap_items_project_id', 'roadmap_items')
    op.drop_table('roadmap_items')
