import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project


async def list_projects(session: AsyncSession, group_id: uuid.UUID | None = None, org_id: str | None = None) -> list[Project]:
    query = select(Project)
    if group_id:
        query = query.where(Project.project_group_id == group_id)
    if org_id:
        query = query.where(Project.org_id == org_id)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_project(project_id: uuid.UUID, session: AsyncSession) -> Project:
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def create_project(data: dict, session: AsyncSession, org_id: str | None = None) -> Project:
    if org_id:
        data = {**data, "org_id": org_id}
    project = Project(**data)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def update_project(project_id: uuid.UUID, data: dict, session: AsyncSession) -> Project:
    project = await get_project(project_id, session)
    for key, value in data.items():
        if value is not None:
            setattr(project, key, value)
    await session.commit()
    await session.refresh(project)
    return project


async def delete_project(project_id: uuid.UUID, session: AsyncSession) -> None:
    project = await get_project(project_id, session)
    await session.delete(project)
    await session.commit()
