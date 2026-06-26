import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    github_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    github_username: Mapped[str | None] = mapped_column(String(255))
    github_token: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    created_issues: Mapped[list["Issue"]] = relationship(  # type: ignore[name-defined]
        "Issue", foreign_keys="Issue.creator_id", back_populates="creator"
    )
    assigned_issues: Mapped[list["Issue"]] = relationship(  # type: ignore[name-defined]
        "Issue", foreign_keys="Issue.assignee_id", back_populates="assignee"
    )
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="author")  # type: ignore[name-defined]
    templates: Mapped[list["Template"]] = relationship("Template", back_populates="creator")  # type: ignore[name-defined]
    project_groups: Mapped[list["ProjectGroup"]] = relationship(  # type: ignore[name-defined]
        "ProjectGroup", back_populates="owner"
    )
    status_changes: Mapped[list["IssueStatusHistory"]] = relationship(  # type: ignore[name-defined]
        "IssueStatusHistory", back_populates="changer"
    )
    created_specs: Mapped[list["Spec"]] = relationship(  # type: ignore[name-defined]
        "Spec", foreign_keys="Spec.created_by", back_populates="creator"
    )
    assigned_specs: Mapped[list["Spec"]] = relationship(  # type: ignore[name-defined]
        "Spec", foreign_keys="Spec.assignee_id", back_populates="assignee"
    )
