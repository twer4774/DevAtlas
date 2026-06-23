import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import not_found
from app.models.node import ArchitectureNode
from app.schemas.node import NodeCreate, NodeUpdate
from app.services.changelog_service import create_changelog_entry


async def get_version_nodes(db: AsyncSession, version_id: uuid.UUID) -> list[ArchitectureNode]:
    result = await db.execute(
        select(ArchitectureNode).where(ArchitectureNode.version_id == version_id)
    )
    return list(result.scalars().all())


async def get_node(db: AsyncSession, node_id: uuid.UUID) -> ArchitectureNode:
    node = await db.get(ArchitectureNode, node_id)
    if not node:
        raise not_found("Node")
    return node


async def create_node(db: AsyncSession, version_id: uuid.UUID, data: NodeCreate) -> ArchitectureNode:
    node = ArchitectureNode(
        version_id=version_id,
        parent_id=data.parent_id,
        title=data.title,
        type=data.type,
        position=data.position,
        metadata_=data.metadata_,
    )
    db.add(node)
    await db.flush()
    await create_changelog_entry(db, version_id, node.id, "node.create", data.reason, data.author)
    await db.commit()
    await db.refresh(node)
    return node


async def update_node(db: AsyncSession, node_id: uuid.UUID, data: NodeUpdate) -> ArchitectureNode:
    node = await get_node(db, node_id)
    update_data = data.model_dump(exclude_unset=True, exclude={"reason", "author"})
    for field, value in update_data.items():
        setattr(node, field, value)
    # position-only 변경(드래그)은 changelog 미기록
    if set(update_data.keys()) - {"position"}:
        await create_changelog_entry(db, node.version_id, node.id, "node.update", data.reason, data.author)
    await db.commit()
    await db.refresh(node)
    return node


async def delete_node(db: AsyncSession, node_id: uuid.UUID, reason: str = "", author: str = "unknown") -> None:
    node = await get_node(db, node_id)
    await create_changelog_entry(db, node.version_id, node.id, "node.delete", reason, author)
    await db.delete(node)
    await db.commit()
