import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import not_found
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


async def create_project(db: AsyncSession, data: ProjectCreate, org_id: str | None = None) -> Project:
    project = Project(**data.model_dump())
    if org_id is not None:
        project.org_id = org_id
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def get_projects(db: AsyncSession, org_id: str | None = None) -> list[Project]:
    stmt = select(Project)
    if org_id is not None:
        stmt = stmt.where(Project.org_id == org_id)
    result = await db.execute(stmt.order_by(Project.created_at.desc()))
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise not_found("Project")
    return project


async def update_project(db: AsyncSession, project_id: uuid.UUID, data: ProjectUpdate) -> Project:
    project = await get_project(db, project_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project_id: uuid.UUID) -> None:
    project = await get_project(db, project_id)
    await db.delete(project)
    await db.commit()
