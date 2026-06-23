import uuid
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node_edge import NodeEdge
from app.services.node_service import get_version_nodes


@dataclass
class DiffResult:
    added: list[str]
    deleted: list[str]
    changed: list[str]
    unchanged: list[str]
    edges_added: list[str] = field(default_factory=list)
    edges_deleted: list[str] = field(default_factory=list)


def _round_pos(pos: dict) -> tuple:
    return (round(pos.get("x", 0), 1), round(pos.get("y", 0), 1))


async def diff_versions(db: AsyncSession, version_a_id: uuid.UUID, version_b_id: uuid.UUID) -> DiffResult:
    nodes_a = await get_version_nodes(db, version_a_id)
    nodes_b = await get_version_nodes(db, version_b_id)

    map_a = {str(n.id): n for n in nodes_a}
    map_b = {str(n.id): n for n in nodes_b}

    set_a = set(map_a.keys())
    set_b = set(map_b.keys())

    added = list(set_b - set_a)
    deleted = list(set_a - set_b)
    changed = []
    unchanged = []

    for nid in set_a & set_b:
        a, b = map_a[nid], map_b[nid]
        if (
            a.title != b.title
            or a.type != b.type
            or _round_pos(a.position) != _round_pos(b.position)
            or a.metadata_ != b.metadata_
        ):
            changed.append(nid)
        else:
            unchanged.append(nid)

    # Edge diff: compare by (source_id, target_id) pair since IDs differ after fork
    edges_a_result = await db.execute(select(NodeEdge).where(NodeEdge.version_id == version_a_id))
    edges_b_result = await db.execute(select(NodeEdge).where(NodeEdge.version_id == version_b_id))
    edges_a = list(edges_a_result.scalars().all())
    edges_b = list(edges_b_result.scalars().all())

    pairs_a = {(str(e.source_id), str(e.target_id)): str(e.id) for e in edges_a}
    pairs_b = {(str(e.source_id), str(e.target_id)): str(e.id) for e in edges_b}

    edges_added = [pairs_b[p] for p in pairs_b if p not in pairs_a]
    edges_deleted = [pairs_a[p] for p in pairs_a if p not in pairs_b]

    return DiffResult(
        added=added,
        deleted=deleted,
        changed=changed,
        unchanged=unchanged,
        edges_added=edges_added,
        edges_deleted=edges_deleted,
    )
