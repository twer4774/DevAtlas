import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NodeEdge(Base):
    __tablename__ = "node_edges"
    __table_args__ = (UniqueConstraint("source_id", "target_id", name="uq_node_edge"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("versions.id", ondelete="CASCADE"))
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("architecture_nodes.id", ondelete="CASCADE"))
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("architecture_nodes.id", ondelete="CASCADE"))
    relation_type: Mapped[str] = mapped_column(String(50), nullable=False, default="depends_on")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
