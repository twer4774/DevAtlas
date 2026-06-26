import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.issue import IssueCreate, IssueResponse, IssueStats, IssueUpdate
from app.services import issue_service

router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("/stats", response_model=IssueStats)
async def get_stats(
    project_id: uuid.UUID | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await issue_service.get_stats(session, project_id)


@router.get("", response_model=list[IssueResponse])
async def list_issues(
    project_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    type: str | None = Query(None),
    priority: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await issue_service.list_issues(session, project_id, status, type, priority)


@router.post("", response_model=IssueResponse, status_code=201)
async def create_issue(
    body: IssueCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await issue_service.create_issue(body.model_dump(), uuid.UUID(current_user.id), session)


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(
    issue_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await issue_service.get_issue(issue_id, session)


@router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: uuid.UUID,
    body: IssueUpdate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await issue_service.update_issue(issue_id, body.model_dump(exclude_none=True), uuid.UUID(current_user.id), session)


@router.delete("/{issue_id}", status_code=204)
async def delete_issue(
    issue_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await issue_service.delete_issue(issue_id, session)
