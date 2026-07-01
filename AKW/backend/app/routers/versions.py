import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.schemas.version import VersionCreate, VersionFork, VersionUpdate, VersionResponse
from app.schemas.diff import DiffResponse
from app.services import version_service
from app.services.diff_service import diff_versions

router = APIRouter(tags=["versions"], dependencies=[Depends(get_current_user)])


@router.post("/projects/{project_id}/versions", response_model=VersionResponse, status_code=201)
async def create_version(project_id: uuid.UUID, data: VersionCreate, db: AsyncSession = Depends(get_db)):
    return await version_service.create_version(db, project_id, data)


@router.get("/projects/{project_id}/versions", response_model=list[VersionResponse])
async def list_versions(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await version_service.get_versions(db, project_id)


@router.get("/versions/{version_id}", response_model=VersionResponse)
async def get_version(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await version_service.get_version(db, version_id)


@router.patch("/versions/{version_id}", response_model=VersionResponse)
async def update_version(version_id: uuid.UUID, data: VersionUpdate, db: AsyncSession = Depends(get_db)):
    return await version_service.update_version(db, version_id, data)


@router.delete("/versions/{version_id}", status_code=204)
async def delete_version(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await version_service.delete_version(db, version_id)


@router.post("/versions/{version_id}/fork", response_model=VersionResponse, status_code=201)
async def fork_version(version_id: uuid.UUID, data: VersionFork, db: AsyncSession = Depends(get_db)):
    return await version_service.fork_version(db, version_id, data)


@router.get("/versions/diff", response_model=DiffResponse)
async def compare_versions(
    version_a: uuid.UUID = Query(...),
    version_b: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await diff_versions(db, version_a, version_b)
    return DiffResponse(
        added=result.added,
        deleted=result.deleted,
        changed=result.changed,
        unchanged=result.unchanged,
        edges_added=result.edges_added,
        edges_deleted=result.edges_deleted,
    )
