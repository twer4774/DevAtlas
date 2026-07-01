import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.roadmap import RoadmapItem
from app.schemas.roadmap import RoadmapItemCreate, RoadmapItemUpdate, RoadmapItemResponse

router = APIRouter(tags=["roadmap"], dependencies=[Depends(get_current_user)])


async def _load(db: AsyncSession, item_id: uuid.UUID) -> RoadmapItem:
    result = await db.execute(select(RoadmapItem).where(RoadmapItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Roadmap item not found")
    return item


@router.get("/projects/{project_id}/roadmap", response_model=list[RoadmapItemResponse])
async def list_roadmap(project_id: uuid.UUID, version_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    q = select(RoadmapItem).where(RoadmapItem.project_id == project_id)
    if version_id:
        q = q.where(RoadmapItem.version_id == version_id)
    q = q.order_by(RoadmapItem.priority, RoadmapItem.sort_order, RoadmapItem.created_at)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/projects/{project_id}/roadmap", response_model=RoadmapItemResponse, status_code=201)
async def create_roadmap_item(project_id: uuid.UUID, data: RoadmapItemCreate, db: AsyncSession = Depends(get_db)):
    item = RoadmapItem(id=uuid.uuid4(), project_id=project_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/roadmap/{item_id}", response_model=RoadmapItemResponse)
async def update_roadmap_item(item_id: uuid.UUID, data: RoadmapItemUpdate, db: AsyncSession = Depends(get_db)):
    item = await _load(db, item_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/roadmap/{item_id}", status_code=204)
async def delete_roadmap_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    item = await _load(db, item_id)
    await db.delete(item)
    await db.commit()
