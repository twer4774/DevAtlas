import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GitHubRepository(Base):
    __tablename__ = "github_repositories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_groups.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    token: Mapped[str | None] = mapped_column(String(1024))
    branch: Mapped[str] = mapped_column(String(255), nullable=False, default="main")
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_group: Mapped["ProjectGroup"] = relationship(  # type: ignore[name-defined]
        "ProjectGroup", back_populates="github_repos"
    )
    projects: Mapped[list["ProjectGitHubRepo"]] = relationship(
        "ProjectGitHubRepo", back_populates="github_repo", cascade="all, delete-orphan"
    )


class ProjectGitHubRepo(Base):
    __tablename__ = "project_github_repos"
    __table_args__ = (UniqueConstraint("project_id", "github_repo_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    github_repo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("github_repositories.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="github_repos")  # type: ignore[name-defined]
    github_repo: Mapped["GitHubRepository"] = relationship("GitHubRepository", back_populates="projects")
