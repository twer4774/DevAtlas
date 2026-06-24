import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import bad_request, not_found
from app.models.node import ArchitectureNode
from app.models.node_edge import NodeEdge
from app.schemas.edge import EdgeCreate, EdgeUpdate


async def get_version_edges(db: AsyncSession, version_id: uuid.UUID) -> list[NodeEdge]:
    result = await db.execute(
        select(NodeEdge).where(NodeEdge.version_id == version_id)
    )
    return list(result.scalars().all())


async def create_edge(db: AsyncSession, version_id: uuid.UUID, data: EdgeCreate) -> NodeEdge:
    if data.source_id == data.target_id:
        raise bad_request("Self-loop edges are not allowed")
    if not await db.get(ArchitectureNode, data.source_id):
        raise not_found(f"Node '{data.source_id}' (source)")
    if not await db.get(ArchitectureNode, data.target_id):
        raise not_found(f"Node '{data.target_id}' (target)")
    edge = NodeEdge(
        version_id=version_id,
        source_id=data.source_id,
        target_id=data.target_id,
        relation_type=data.relation_type,
    )
    db.add(edge)
    await db.commit()
    await db.refresh(edge)
    return edge


async def get_edge(db: AsyncSession, edge_id: uuid.UUID) -> NodeEdge:
    edge = await db.get(NodeEdge, edge_id)
    if not edge:
        raise not_found("Edge")
    return edge


async def update_edge(db: AsyncSession, edge_id: uuid.UUID, data: EdgeUpdate) -> NodeEdge:
    edge = await get_edge(db, edge_id)
    edge.relation_type = data.relation_type
    await db.commit()
    await db.refresh(edge)
    return edge


async def delete_edge(db: AsyncSession, edge_id: uuid.UUID) -> None:
    edge = await db.get(NodeEdge, edge_id)
    if not edge:
        raise not_found("Edge")
    await db.delete(edge)
    await db.commit()
