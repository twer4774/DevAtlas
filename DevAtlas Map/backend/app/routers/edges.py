import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.edge import EdgeCreate, EdgeUpdate, EdgeResponse
from app.services import edge_service


router = APIRouter(tags=["edges"])


@router.get("/versions/{version_id}/edges", response_model=list[EdgeResponse])
async def list_edges(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await edge_service.get_version_edges(db, version_id)


@router.post("/versions/{version_id}/edges", response_model=EdgeResponse, status_code=201)
async def create_edge(version_id: uuid.UUID, data: EdgeCreate, db: AsyncSession = Depends(get_db)):
    return await edge_service.create_edge(db, version_id, data)


@router.get("/edges/{edge_id}", response_model=EdgeResponse)
async def get_edge(edge_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await edge_service.get_edge(db, edge_id)


@router.patch("/edges/{edge_id}", response_model=EdgeResponse)
async def update_edge(edge_id: uuid.UUID, data: EdgeUpdate, db: AsyncSession = Depends(get_db)):
    return await edge_service.update_edge(db, edge_id, data)


@router.delete("/edges/{edge_id}", status_code=204)
async def delete_edge(edge_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await edge_service.delete_edge(db, edge_id)
