import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.project_group import ProjectGroupCreate, ProjectGroupResponse, ProjectGroupUpdate
from app.services import project_group_service

router = APIRouter(prefix="/api/project-groups", tags=["project-groups"])


@router.get("", response_model=list[ProjectGroupResponse])
async def list_groups(session: AsyncSession = Depends(get_session), _=Depends(get_current_user)):
    return await project_group_service.list_project_groups(session)


@router.post("", response_model=ProjectGroupResponse, status_code=201)
async def create_group(
    body: ProjectGroupCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await project_group_service.create_project_group(body.model_dump(), current_user.id, session)


@router.get("/{group_id}", response_model=ProjectGroupResponse)
async def get_group(
    group_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await project_group_service.get_project_group(group_id, session)


@router.put("/{group_id}", response_model=ProjectGroupResponse)
async def update_group(
    group_id: uuid.UUID,
    body: ProjectGroupUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await project_group_service.update_project_group(group_id, body.model_dump(exclude_none=True), session)


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await project_group_service.delete_project_group(group_id, session)
