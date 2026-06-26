import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

project_user_association = Table(
    "project_users",
    Base.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="FULLSTACK")
    project_group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_groups.id")
    )
    org_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_group: Mapped["ProjectGroup | None"] = relationship(  # type: ignore[name-defined]
        "ProjectGroup", back_populates="projects"
    )
    issues: Mapped[list["Issue"]] = relationship("Issue", back_populates="project")  # type: ignore[name-defined]
    specs: Mapped[list["Spec"]] = relationship("Spec", back_populates="project")  # type: ignore[name-defined]
    users: Mapped[list["User"]] = relationship(  # type: ignore[name-defined]
        "User", secondary=project_user_association
    )
    github_repos: Mapped[list["ProjectGitHubRepo"]] = relationship(  # type: ignore[name-defined]
        "ProjectGitHubRepo", back_populates="project", cascade="all, delete-orphan"
    )
