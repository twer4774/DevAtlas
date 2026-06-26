import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectGroup(Base):
    __tablename__ = "project_groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    color: Mapped[str | None] = mapped_column(String(50))
    github_organization: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship("User", back_populates="project_groups")  # type: ignore[name-defined]
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="project_group")  # type: ignore[name-defined]
    github_repos: Mapped[list["GitHubRepository"]] = relationship(  # type: ignore[name-defined]
        "GitHubRepository", back_populates="project_group", cascade="all, delete-orphan"
    )
