import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.models.issue_status_history import IssueStatusHistory
from app.schemas.status_history import StatusHistoryResponse

router = APIRouter(prefix="/api/status-history", tags=["status-history"])


@router.get("", response_model=list[StatusHistoryResponse])
async def list_history(
    issue_id: uuid.UUID = Query(...),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    result = await session.execute(
        select(IssueStatusHistory)
        .where(IssueStatusHistory.issue_id == issue_id)
        .order_by(IssueStatusHistory.created_at.desc())
    )
    return result.scalars().all()
