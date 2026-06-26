import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment


async def list_comments(issue_id: uuid.UUID, session: AsyncSession) -> list[Comment]:
    result = await session.execute(
        select(Comment).where(Comment.issue_id == issue_id).order_by(Comment.created_at)
    )
    return list(result.scalars().all())


async def get_comment(comment_id: uuid.UUID, session: AsyncSession) -> Comment:
    result = await session.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return comment


async def create_comment(issue_id: uuid.UUID, content: str, author_id: uuid.UUID, session: AsyncSession) -> Comment:
    comment = Comment(issue_id=issue_id, content=content, author_id=author_id)
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


async def update_comment(comment_id: uuid.UUID, content: str, session: AsyncSession) -> Comment:
    comment = await get_comment(comment_id, session)
    comment.content = content
    await session.commit()
    await session.refresh(comment)
    return comment


async def delete_comment(comment_id: uuid.UUID, session: AsyncSession) -> None:
    comment = await get_comment(comment_id, session)
    await session.delete(comment)
    await session.commit()
