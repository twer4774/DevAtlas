import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.changelog import ChangeLog
from app.schemas.changelog import ChangeLogCreate


async def create_changelog_entry(
    db: AsyncSession,
    version_id: uuid.UUID,
    target_id: uuid.UUID,
    action: str,
    reason: str | None,
    author: str,
) -> ChangeLog:
    entry = ChangeLog(
        version_id=version_id,
        target_id=target_id,
        action=action,
        reason=reason or None,
        author=author,
    )
    db.add(entry)
    return entry


async def get_changelog(db: AsyncSession, version_id: uuid.UUID) -> list[ChangeLog]:
    result = await db.execute(
        select(ChangeLog)
        .where(ChangeLog.version_id == version_id)
        .order_by(ChangeLog.created_at.desc())
    )
    return list(result.scalars().all())
