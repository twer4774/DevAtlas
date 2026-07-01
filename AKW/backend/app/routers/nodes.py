import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.schemas.node import NodeCreate, NodeUpdate, NodeResponse
from app.services import node_service

router = APIRouter(tags=["nodes"], dependencies=[Depends(get_current_user)])


@router.get("/versions/{version_id}/nodes", response_model=list[NodeResponse])
async def list_nodes(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await node_service.get_version_nodes(db, version_id)


@router.post("/versions/{version_id}/nodes", response_model=NodeResponse, status_code=201)
async def create_node(version_id: uuid.UUID, data: NodeCreate, db: AsyncSession = Depends(get_db)):
    return await node_service.create_node(db, version_id, data)


@router.get("/nodes/{node_id}", response_model=NodeResponse)
async def get_node(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await node_service.get_node(db, node_id)


@router.patch("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(node_id: uuid.UUID, data: NodeUpdate, db: AsyncSession = Depends(get_db)):
    return await node_service.update_node(db, node_id, data)


@router.delete("/nodes/{node_id}", status_code=204)
async def delete_node(
    node_id: uuid.UUID,
    reason: str = Query(default=""),
    author: str = Query(default="unknown"),
    db: AsyncSession = Depends(get_db),
):
    await node_service.delete_node(db, node_id, reason, author)
