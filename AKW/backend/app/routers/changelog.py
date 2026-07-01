import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.schemas.changelog import ChangeLogCreate, ChangeLogResponse
from app.services.changelog_service import create_changelog_entry, get_changelog

router = APIRouter(tags=["changelog"], dependencies=[Depends(get_current_user)])


@router.get("/versions/{version_id}/changelog", response_model=list[ChangeLogResponse])
async def list_changelog(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await get_changelog(db, version_id)


@router.post("/versions/{version_id}/changelog", response_model=ChangeLogResponse, status_code=201)
async def add_changelog(version_id: uuid.UUID, data: ChangeLogCreate, db: AsyncSession = Depends(get_db)):
    entry = await create_changelog_entry(db, version_id, data.target_id, data.action, data.reason, data.author)
    await db.commit()
    await db.refresh(entry)
    return entry
