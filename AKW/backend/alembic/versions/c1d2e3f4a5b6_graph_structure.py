"""graph_structure: replace parent_id/children with node_edges

Revision ID: c1d2e3f4a5b6
Revises: f92469fc1873
Create Date: 2026-04-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'f92469fc1873'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old index on parent_id
    op.drop_index('nodes_parent_id_idx', table_name='architecture_nodes', if_exists=True)

    # Drop self-referential FK (auto-named by PostgreSQL)
    op.execute("""
        DO $$
        DECLARE r RECORD;
        BEGIN
            FOR r IN
                SELECT conname FROM pg_constraint
                WHERE conrelid = 'architecture_nodes'::regclass
                  AND contype = 'f'
                  AND conname LIKE '%parent_id%'
            LOOP
                EXECUTE 'ALTER TABLE architecture_nodes DROP CONSTRAINT ' || quote_ident(r.conname);
            END LOOP;
        END $$;
    """)

    # Drop old columns
    op.drop_column('architecture_nodes', 'parent_id')
    op.drop_column('architecture_nodes', 'children')

    # Create node_edges table
    op.create_table(
        'node_edges',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('version_id', sa.UUID(), nullable=False),
        sa.Column('source_id', sa.UUID(), nullable=False),
        sa.Column('target_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['version_id'], ['versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['architecture_nodes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_id'], ['architecture_nodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_id', 'target_id', name='uq_node_edge'),
    )
    op.create_index('node_edges_version_id_idx', 'node_edges', ['version_id'])
    op.create_index('node_edges_source_id_idx', 'node_edges', ['source_id'])
    op.create_index('node_edges_target_id_idx', 'node_edges', ['target_id'])


def downgrade() -> None:
    op.drop_table('node_edges')
    op.add_column('architecture_nodes', sa.Column('parent_id', sa.UUID(), nullable=True))
    op.add_column('architecture_nodes', sa.Column('children', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))
    op.create_foreign_key(None, 'architecture_nodes', 'architecture_nodes', ['parent_id'], ['id'], ondelete='SET NULL')
    op.create_index('nodes_parent_id_idx', 'architecture_nodes', ['parent_id'])
