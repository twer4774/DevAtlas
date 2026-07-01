import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("versions.id", ondelete="SET NULL"), nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(4), nullable=False, default="p3")   # p1|p2|p3|p4
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="공통")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    size: Mapped[str] = mapped_column(String(4), nullable=False, default="M")         # XS|S|M|L|XL
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="todo")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
