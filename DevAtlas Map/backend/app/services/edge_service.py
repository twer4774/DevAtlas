import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import bad_request, not_found
from app.models.node_edge import NodeEdge
from app.schemas.edge import EdgeCreate


async def get_version_edges(db: AsyncSession, version_id: uuid.UUID) -> list[NodeEdge]:
    result = await db.execute(
        select(NodeEdge).where(NodeEdge.version_id == version_id)
    )
    return list(result.scalars().all())


async def create_edge(db: AsyncSession, version_id: uuid.UUID, data: EdgeCreate) -> NodeEdge:
    if data.source_id == data.target_id:
        raise bad_request("Self-loop edges are not allowed")
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


async def delete_edge(db: AsyncSession, edge_id: uuid.UUID) -> None:
    edge = await db.get(NodeEdge, edge_id)
    if not edge:
        raise not_found("Edge")
    await db.delete(edge)
    await db.commit()
