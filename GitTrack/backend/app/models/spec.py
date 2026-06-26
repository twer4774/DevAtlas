import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Spec(Base):
    __tablename__ = "specs"
    __table_args__ = (
        Index("ix_specs_project_id_status", "project_id", "status"),
        Index("ix_specs_created_by", "created_by"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    priority: Mapped[str] = mapped_column(String(50), nullable=False, default="medium")
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    requirements: Mapped[str | None] = mapped_column(Text)
    acceptance: Mapped[str | None] = mapped_column(Text)
    design: Mapped[str | None] = mapped_column(Text)
    implementation: Mapped[str | None] = mapped_column(Text)
    testing: Mapped[str | None] = mapped_column(Text)
    estimated_hours: Mapped[int | None] = mapped_column(Integer)
    tags: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project: Mapped["Project"] = relationship("Project", back_populates="specs")  # type: ignore[name-defined]
    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[created_by], back_populates="created_specs"
    )
    assignee: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[assignee_id], back_populates="assigned_specs"
    )
    issues: Mapped[list["Issue"]] = relationship("Issue", back_populates="spec")  # type: ignore[name-defined]
