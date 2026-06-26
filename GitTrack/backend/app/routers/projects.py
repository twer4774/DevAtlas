import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user, get_org_id
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    group_id: uuid.UUID | None = Query(None),
    session: AsyncSession = Depends(get_session),
    org_id: str = Depends(get_org_id),
):
    return await project_service.list_projects(session, group_id, org_id=org_id)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(get_session),
    org_id: str = Depends(get_org_id),
):
    return await project_service.create_project(body.model_dump(), session, org_id=org_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await project_service.get_project(project_id, session)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await project_service.update_project(project_id, body.model_dump(exclude_none=True), session)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await project_service.delete_project(project_id, session)
