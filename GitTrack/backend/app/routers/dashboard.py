import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.models.comment import Comment
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


@router.get("/stats")
async def comprehensive_stats(
    projectId: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    pid = uuid.UUID(projectId) if projectId else None
    base = select(func.count()).select_from(Issue)
    if pid:
        base = base.where(Issue.project_id == pid)

    def filtered(q):
        return q.where(Issue.project_id == pid) if pid else q

    total = (await session.execute(base)).scalar() or 0
    open_c = (await session.execute(filtered(select(func.count()).select_from(Issue)).where(Issue.status == "open"))).scalar() or 0
    in_progress = (await session.execute(filtered(select(func.count()).select_from(Issue)).where(Issue.status == "in_progress"))).scalar() or 0
    resolved = (await session.execute(filtered(select(func.count()).select_from(Issue)).where(Issue.status == "resolved"))).scalar() or 0
    closed = (await session.execute(filtered(select(func.count()).select_from(Issue)).where(Issue.status == "closed"))).scalar() or 0

    # by type — IssuesByTypeChart expects {bug, task, improvement, feature}
    type_rows = (await session.execute(
        filtered(select(Issue.type, func.count().label("count")).select_from(Issue)).group_by(Issue.type)
    )).all()
    type_map = {r[0]: r[1] for r in type_rows}
    by_type = {k: type_map.get(k, 0) for k in ("bug", "task", "improvement", "feature")}

    # by priority — IssuesByPriorityChart expects {urgent, high, medium, low}
    prio_rows = (await session.execute(
        filtered(select(Issue.priority, func.count().label("count")).select_from(Issue)).group_by(Issue.priority)
    )).all()
    prio_map = {r[0]: r[1] for r in prio_rows}
    by_priority = {k: prio_map.get(k, 0) for k in ("urgent", "high", "medium", "low")}

    # top contributors (by creator_id)
    contrib_rows = (await session.execute(
        filtered(select(Issue.creator_id, func.count().label("cnt")).select_from(Issue))
        .group_by(Issue.creator_id).order_by(func.count().desc()).limit(10)
    )).all()
    top_contributors = [{"username": str(r[0]), "avatar_url": None, "issue_count": r[1]} for r in contrib_rows]

    # recent activity (last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_issues = (await session.execute(
        filtered(select(func.count()).select_from(Issue)).where(Issue.created_at >= week_ago)
    )).scalar() or 0
    new_comments_q = select(func.count()).select_from(Comment).where(Comment.created_at >= week_ago)
    if pid:
        new_comments_q = new_comments_q.where(Comment.issue_id.in_(select(Issue.id).where(Issue.project_id == pid)))
    new_comments = (await session.execute(new_comments_q)).scalar() or 0

    # per-project stats
    projects = (await session.execute(select(Project))).scalars().all()
    project_stats = []
    for p in projects:
        p_total = (await session.execute(select(func.count()).select_from(Issue).where(Issue.project_id == p.id))).scalar() or 0
        p_open = (await session.execute(select(func.count()).select_from(Issue).where(Issue.project_id == p.id, Issue.status == "open"))).scalar() or 0
        p_closed = (await session.execute(select(func.count()).select_from(Issue).where(Issue.project_id == p.id, Issue.status == "closed"))).scalar() or 0
        project_stats.append({"name": p.name, "total": p_total, "open": p_open, "closed": p_closed})

    return {
        "success": True,
        "data": {
            "overview": {"total": total, "open": open_c, "inProgress": in_progress, "resolved": resolved, "closed": closed},
            "byType": by_type,
            "byPriority": by_priority,
            "topContributors": top_contributors,
            "recentActivity": {"newIssues": new_issues, "newComments": new_comments},
            "projectStats": project_stats,
        }
    }


@router.get("/trends")
async def issue_trends(
    projectId: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    # IssueTrendsChart expects [{date: str, created: int, resolved: int}]
    pid = uuid.UUID(projectId) if projectId else None
    now = datetime.now(timezone.utc)
    weeks = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)

        created_q = select(func.count()).select_from(Issue).where(Issue.created_at >= week_start, Issue.created_at < week_end)
        resolved_q = select(func.count()).select_from(Issue).where(Issue.updated_at >= week_start, Issue.updated_at < week_end, Issue.status == "resolved")
        if pid:
            created_q = created_q.where(Issue.project_id == pid)
            resolved_q = resolved_q.where(Issue.project_id == pid)

        created = (await session.execute(created_q)).scalar() or 0
        resolved = (await session.execute(resolved_q)).scalar() or 0
        weeks.append({"date": week_start.strftime("%Y-%m-%d"), "created": created, "resolved": resolved})

    return {"success": True, "data": weeks}


@router.get("/assignments")
async def assignment_stats(
    projectId: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    # AssignmentChart expects {unassigned: int, assigned: [{id, name, count}]}
    pid = uuid.UUID(projectId) if projectId else None

    unassigned_q = select(func.count()).select_from(Issue).where(Issue.assignee_id.is_(None))
    if pid:
        unassigned_q = unassigned_q.where(Issue.project_id == pid)
    unassigned = (await session.execute(unassigned_q)).scalar() or 0

    assigned_q = select(Issue.assignee_id, func.count().label("cnt")).select_from(Issue).where(Issue.assignee_id.isnot(None))
    if pid:
        assigned_q = assigned_q.where(Issue.project_id == pid)
    rows = (await session.execute(assigned_q.group_by(Issue.assignee_id).order_by(func.count().desc()).limit(10))).all()
    assigned = [{"id": str(r[0]), "name": str(r[0])[:8], "count": r[1]} for r in rows]

    return {"success": True, "data": {"unassigned": unassigned, "assigned": assigned}}


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
