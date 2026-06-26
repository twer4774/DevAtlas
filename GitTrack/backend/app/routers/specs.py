import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.issue import IssueResponse
from app.schemas.spec import SpecCreate, SpecResponse, SpecUpdate
from app.services import spec_service

router = APIRouter(prefix="/api/specs", tags=["specs"])


@router.get("", response_model=list[SpecResponse])
async def list_specs(
    project_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await spec_service.list_specs(session, project_id, status)


@router.post("", response_model=SpecResponse, status_code=201)
async def create_spec(
    body: SpecCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await spec_service.create_spec(body.model_dump(), uuid.UUID(current_user.id), session)


@router.get("/{spec_id}", response_model=SpecResponse)
async def get_spec(
    spec_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await spec_service.get_spec(spec_id, session)


@router.put("/{spec_id}", response_model=SpecResponse)
async def update_spec(
    spec_id: uuid.UUID,
    body: SpecUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await spec_service.update_spec(spec_id, body.model_dump(exclude_none=True), session)


@router.delete("/{spec_id}", status_code=204)
async def delete_spec(
    spec_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await spec_service.delete_spec(spec_id, session)


@router.post("/{spec_id}/issues", response_model=IssueResponse, status_code=201)
async def create_issue_from_spec(
    spec_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    issue = await spec_service.create_issue_from_spec(spec_id, uuid.UUID(current_user.id), session)
    from app.schemas.issue import IssueResponse
    return IssueResponse.model_validate(issue)
