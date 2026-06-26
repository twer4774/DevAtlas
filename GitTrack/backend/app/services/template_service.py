import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import Template


async def list_templates(session: AsyncSession, issue_type: str | None = None) -> list[Template]:
    query = select(Template)
    if issue_type:
        query = query.where(Template.issue_type == issue_type)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_template(template_id: uuid.UUID, session: AsyncSession) -> Template:
    result = await session.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


async def create_template(data: dict, created_by: uuid.UUID, session: AsyncSession) -> Template:
    template = Template(**data, created_by=created_by)
    session.add(template)
    await session.commit()
    await session.refresh(template)
    return template


async def update_template(template_id: uuid.UUID, data: dict, session: AsyncSession) -> Template:
    template = await get_template(template_id, session)
    for key, value in data.items():
        if value is not None:
            setattr(template, key, value)
    await session.commit()
    await session.refresh(template)
    return template


async def delete_template(template_id: uuid.UUID, session: AsyncSession) -> None:
    template = await get_template(template_id, session)
    await session.delete(template)
    await session.commit()
