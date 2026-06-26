import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.spec import Spec


async def list_specs(
    session: AsyncSession,
    project_id: uuid.UUID | None = None,
    spec_status: str | None = None,
) -> list[Spec]:
    query = select(Spec)
    if project_id:
        query = query.where(Spec.project_id == project_id)
    if spec_status:
        query = query.where(Spec.status == spec_status)
    result = await session.execute(query.order_by(Spec.created_at.desc()))
    return list(result.scalars().all())


async def get_spec(spec_id: uuid.UUID, session: AsyncSession) -> Spec:
    result = await session.execute(select(Spec).where(Spec.id == spec_id))
    spec = result.scalar_one_or_none()
    if not spec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")
    return spec


async def create_spec(data: dict, created_by: uuid.UUID, session: AsyncSession) -> Spec:
    spec = Spec(**data, created_by=created_by)
    session.add(spec)
    await session.commit()
    await session.refresh(spec)
    return spec


async def update_spec(spec_id: uuid.UUID, data: dict, session: AsyncSession) -> Spec:
    spec = await get_spec(spec_id, session)
    for key, value in data.items():
        if value is not None:
            setattr(spec, key, value)
    await session.commit()
    await session.refresh(spec)
    return spec


async def delete_spec(spec_id: uuid.UUID, session: AsyncSession) -> None:
    spec = await get_spec(spec_id, session)
    await session.delete(spec)
    await session.commit()


async def create_issue_from_spec(spec_id: uuid.UUID, creator_id: uuid.UUID, session: AsyncSession):
    from app.models.issue import Issue
    from app.models.issue_status_history import IssueStatusHistory

    spec = await get_spec(spec_id, session)
    issue = Issue(
        title=spec.title,
        description=spec.description,
        type="feature",
        priority=spec.priority,
        project_id=spec.project_id,
        creator_id=creator_id,
        spec_id=spec.id,
    )
    session.add(issue)
    await session.flush()
    session.add(
        IssueStatusHistory(
            issue_id=issue.id,
            to_status=issue.status,
            changed_by=creator_id,
            change_type="manual",
        )
    )
    await session.commit()
    await session.refresh(issue)
    return issue
