import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.models.issue import Issue
from app.models.project import Project
from app.models.project_group import ProjectGroup

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard_stats(session: AsyncSession = Depends(get_session), _=Depends(get_current_user)):
    total_projects = (await session.execute(select(func.count()).select_from(Project))).scalar()
    total_issues = (await session.execute(select(func.count()).select_from(Issue))).scalar()
    open_issues = (await session.execute(
        select(func.count()).select_from(Issue).where(Issue.status == "open")
    )).scalar()
    closed_issues = (await session.execute(
        select(func.count()).select_from(Issue).where(Issue.status == "closed")
    )).scalar()
    return {
        "total_projects": total_projects,
        "total_issues": total_issues,
        "open_issues": open_issues,
        "closed_issues": closed_issues,
    }


@router.get("/tree")
async def tree_view(session: AsyncSession = Depends(get_session), _=Depends(get_current_user)):
    groups_result = await session.execute(select(ProjectGroup))
    groups = groups_result.scalars().all()

    projects_result = await session.execute(select(Project))
    projects = projects_result.scalars().all()

    projects_by_group: dict[str, list] = {}
    ungrouped = []
    for project in projects:
        if project.project_group_id:
            key = str(project.project_group_id)
            projects_by_group.setdefault(key, []).append({
                "id": str(project.id),
                "name": project.name,
                "type": project.type,
            })
        else:
            ungrouped.append({"id": str(project.id), "name": project.name, "type": project.type})

    nodes = []
    for group in groups:
        nodes.append({
            "id": str(group.id),
            "name": group.name,
            "type": "group",
            "color": group.color,
            "children": projects_by_group.get(str(group.id), []),
        })

    return {"nodes": nodes, "ungrouped": ungrouped}


@router.get("/tree/{node_id}/statistics")
async def node_statistics(
    node_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    from app.services.issue_service import get_stats
    return await get_stats(session, project_id=node_id)
