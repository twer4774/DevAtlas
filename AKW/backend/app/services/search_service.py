import asyncio
import uuid

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import ArchitectureNode
from app.models.document import Document
from app.models.version import Version
from app.schemas.search import SearchResponse, NodeSearchResult, DocumentSearchResult, VersionSearchResult


async def search(db: AsyncSession, q: str, project_id: uuid.UUID | None = None, type_: str = "all") -> SearchResponse:
    nodes, documents, versions = [], [], []

    if type_ in ("all", "nodes"):
        nodes = await _search_nodes(db, q, project_id)
    if type_ in ("all", "documents"):
        documents = await _search_documents(db, q, project_id)
    if type_ in ("all", "versions"):
        versions = await _search_versions(db, q, project_id)

    return SearchResponse(nodes=nodes, documents=documents, versions=versions)


async def _search_nodes(db: AsyncSession, q: str, project_id: uuid.UUID | None) -> list[NodeSearchResult]:
    stmt = select(ArchitectureNode).where(
        func.to_tsvector("english", ArchitectureNode.title).op("@@")(func.plainto_tsquery("english", q))
    )
    if project_id:
        stmt = stmt.join(Version, ArchitectureNode.version_id == Version.id).where(Version.project_id == project_id)
    result = await db.execute(stmt.limit(20))
    return [NodeSearchResult(id=n.id, version_id=n.version_id, title=n.title, type=n.type) for n in result.scalars()]


async def _search_documents(db: AsyncSession, q: str, project_id: uuid.UUID | None) -> list[DocumentSearchResult]:
    stmt = select(Document).where(
        func.to_tsvector("english", Document.title).op("@@")(func.plainto_tsquery("english", q))
    )
    if project_id:
        stmt = stmt.where(Document.project_id == project_id)
    result = await db.execute(stmt.limit(20))
    return [DocumentSearchResult(id=d.id, project_id=d.project_id, title=d.title, type=d.type) for d in result.scalars()]


async def _search_versions(db: AsyncSession, q: str, project_id: uuid.UUID | None) -> list[VersionSearchResult]:
    stmt = select(Version).where(Version.name.ilike(f"%{q}%"))
    if project_id:
        stmt = stmt.where(Version.project_id == project_id)
    result = await db.execute(stmt.limit(20))
    return [VersionSearchResult(id=v.id, project_id=v.project_id, name=v.name, created_at=v.created_at) for v in result.scalars()]
