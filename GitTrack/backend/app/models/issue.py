import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = (
        Index("ix_issues_project_id_created_at", "project_id", "created_at"),
        Index("ix_issues_project_id_status", "project_id", "status"),
        Index("ix_issues_spec_id", "spec_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open")
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    spec_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("specs.id"))
    github_issue_number: Mapped[int | None] = mapped_column(Integer)
    github_issue_url: Mapped[str | None] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    assignee: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[assignee_id], back_populates="assigned_issues"
    )
    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[creator_id], back_populates="created_issues"
    )
    project: Mapped["Project"] = relationship("Project", back_populates="issues")  # type: ignore[name-defined]
    spec: Mapped["Spec | None"] = relationship("Spec", back_populates="issues")  # type: ignore[name-defined]
    comments: Mapped[list["Comment"]] = relationship(  # type: ignore[name-defined]
        "Comment", back_populates="issue", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(  # type: ignore[name-defined]
        "Attachment", back_populates="issue", cascade="all, delete-orphan"
    )
    status_history: Mapped[list["IssueStatusHistory"]] = relationship(  # type: ignore[name-defined]
        "IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan"
    )
