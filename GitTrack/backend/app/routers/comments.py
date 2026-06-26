import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services import comment_service

router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.get("", response_model=list[CommentResponse])
async def list_comments(
    issue_id: uuid.UUID = Query(...),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await comment_service.list_comments(issue_id, session)


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    body: CommentCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await comment_service.create_comment(body.issue_id, body.content, uuid.UUID(current_user.id), session)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: uuid.UUID,
    body: CommentUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await comment_service.update_comment(comment_id, body.content, session)


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await comment_service.delete_comment(comment_id, session)
