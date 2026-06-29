import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import not_found
from app.models.version import Version
from app.models.node import ArchitectureNode
from app.models.node_edge import NodeEdge
from app.models.document import Document
from app.schemas.version import VersionCreate, VersionFork, VersionUpdate


async def create_version(db: AsyncSession, project_id: uuid.UUID, data: VersionCreate) -> Version:
    version = Version(project_id=project_id, **data.model_dump())
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return version


async def get_versions(db: AsyncSession, project_id: uuid.UUID) -> list[Version]:
    result = await db.execute(
        select(Version).where(Version.project_id == project_id).order_by(Version.created_at)
    )
    return list(result.scalars().all())


async def get_version(db: AsyncSession, version_id: uuid.UUID) -> Version:
    version = await db.get(Version, version_id)
    if not version:
        raise not_found("Version")
    return version


async def update_version(db: AsyncSession, version_id: uuid.UUID, data: VersionUpdate) -> Version:
    version = await get_version(db, version_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(version, field, value)
    await db.commit()
    await db.refresh(version)
    return version


async def delete_version(db: AsyncSession, version_id: uuid.UUID) -> None:
    version = await get_version(db, version_id)
    await db.delete(version)
    await db.commit()


async def fork_version(db: AsyncSession, base_version_id: uuid.UUID, data: VersionFork) -> Version:
    base = await get_version(db, base_version_id)

    new_version = Version(
        project_id=base.project_id,
        name=data.name,
        base_version_id=base_version_id,
        release_date=data.release_date,
    )
    db.add(new_version)
    await db.flush()

    nodes_result = await db.execute(
        select(ArchitectureNode).where(ArchitectureNode.version_id == base_version_id)
    )
    base_nodes = list(nodes_result.scalars().all())

    id_map: dict[uuid.UUID, uuid.UUID] = {n.id: uuid.uuid4() for n in base_nodes}

    for node in base_nodes:
        new_node = ArchitectureNode(
            id=id_map[node.id],
            version_id=new_version.id,
            title=node.title,
            type=node.type,
            position=dict(node.position),
            metadata_=dict(node.metadata_),
        )
        db.add(new_node)

    edges_result = await db.execute(
        select(NodeEdge).where(NodeEdge.version_id == base_version_id)
    )
    base_edges = list(edges_result.scalars().all())
    for edge in base_edges:
        if edge.source_id in id_map and edge.target_id in id_map:
            new_edge = NodeEdge(
                version_id=new_version.id,
                source_id=id_map[edge.source_id],
                target_id=id_map[edge.target_id],
                relation_type=edge.relation_type,
            )
            db.add(new_edge)

    docs_result = await db.execute(
        select(Document).where(Document.version_id == base_version_id)
    )
    base_docs = list(docs_result.scalars().all())
    for doc in base_docs:
        new_linked = [str(id_map[uuid.UUID(nid)]) for nid in doc.linked_node_ids if uuid.UUID(nid) in id_map]
        new_doc = Document(
            project_id=doc.project_id,
            version_id=new_version.id,
            type=doc.type,
            title=doc.title,
            content_url=doc.content_url,
            linked_node_ids=new_linked,
        )
        db.add(new_doc)

    await db.commit()
    await db.refresh(new_version)
    return new_version
