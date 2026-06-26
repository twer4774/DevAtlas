import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project_group import ProjectGroup


async def list_project_groups(session: AsyncSession) -> list[ProjectGroup]:
    result = await session.execute(select(ProjectGroup))
    return list(result.scalars().all())


async def get_project_group(group_id: uuid.UUID, session: AsyncSession) -> ProjectGroup:
    result = await session.execute(select(ProjectGroup).where(ProjectGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project group not found")
    return group


async def create_project_group(data: dict, owner_id: uuid.UUID, session: AsyncSession) -> ProjectGroup:
    group = ProjectGroup(**data, owner_id=owner_id)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group


async def update_project_group(group_id: uuid.UUID, data: dict, session: AsyncSession) -> ProjectGroup:
    group = await get_project_group(group_id, session)
    for key, value in data.items():
        if value is not None:
            setattr(group, key, value)
    await session.commit()
    await session.refresh(group)
    return group


async def delete_project_group(group_id: uuid.UUID, session: AsyncSession) -> None:
    group = await get_project_group(group_id, session)
    await session.delete(group)
    await session.commit()
