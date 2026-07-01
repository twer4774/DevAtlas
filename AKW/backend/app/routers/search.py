import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.schemas.search import SearchResponse
from app.services.search_service import search

router = APIRouter(tags=["search"], dependencies=[Depends(get_current_user)])


@router.get("/search", response_model=SearchResponse)
async def search_all(
    q: str = Query(..., min_length=1),
    project_id: uuid.UUID | None = Query(default=None),
    type: str = Query(default="all"),
    db: AsyncSession = Depends(get_db),
):
    return await search(db, q, project_id, type)
