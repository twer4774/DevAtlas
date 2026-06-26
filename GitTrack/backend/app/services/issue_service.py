import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.models.issue_status_history import IssueStatusHistory


async def list_issues(
    session: AsyncSession,
    project_id: uuid.UUID | None = None,
    status_filter: str | None = None,
    issue_type: str | None = None,
    priority: str | None = None,
) -> list[Issue]:
    query = select(Issue)
    if project_id:
        query = query.where(Issue.project_id == project_id)
    if status_filter:
        query = query.where(Issue.status == status_filter)
    if issue_type:
        query = query.where(Issue.type == issue_type)
    if priority:
        query = query.where(Issue.priority == priority)
    result = await session.execute(query.order_by(Issue.created_at.desc()))
    return list(result.scalars().all())


async def get_issue(issue_id: uuid.UUID, session: AsyncSession) -> Issue:
    result = await session.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


async def create_issue(data: dict, creator_id: uuid.UUID, session: AsyncSession) -> Issue:
    issue = Issue(**data, creator_id=creator_id)
    session.add(issue)
    await session.flush()

    history = IssueStatusHistory(
        issue_id=issue.id,
        from_status=None,
        to_status=issue.status,
        changed_by=creator_id,
        change_type="manual",
    )
    session.add(history)
    await session.commit()
    await session.refresh(issue)
    return issue


async def update_issue(
    issue_id: uuid.UUID, data: dict, changed_by: uuid.UUID, session: AsyncSession
) -> Issue:
    issue = await get_issue(issue_id, session)
    old_status = issue.status

    for key, value in data.items():
        if value is not None:
            setattr(issue, key, value)

    if "status" in data and data["status"] and data["status"] != old_status:
        history = IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status=data["status"],
            changed_by=changed_by,
            change_type="manual",
        )
        session.add(history)

    await session.commit()
    await session.refresh(issue)
    return issue


async def delete_issue(issue_id: uuid.UUID, session: AsyncSession) -> None:
    issue = await get_issue(issue_id, session)
    await session.delete(issue)
    await session.commit()


async def get_stats(session: AsyncSession, project_id: uuid.UUID | None = None) -> dict:
    query = select(Issue)
    if project_id:
        query = query.where(Issue.project_id == project_id)
    result = await session.execute(query)
    issues = result.scalars().all()

    by_priority: dict[str, int] = defaultdict(int)
    by_type: dict[str, int] = defaultdict(int)
    open_count = in_progress = closed = 0

    for issue in issues:
        by_priority[issue.priority] += 1
        by_type[issue.type] += 1
        if issue.status == "open":
            open_count += 1
        elif issue.status == "in_progress":
            in_progress += 1
        elif issue.status == "closed":
            closed += 1

    return {
        "total": len(issues),
        "open": open_count,
        "in_progress": in_progress,
        "closed": closed,
        "by_priority": dict(by_priority),
        "by_type": dict(by_type),
    }
