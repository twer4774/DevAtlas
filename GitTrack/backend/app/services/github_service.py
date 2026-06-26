import hashlib
import hmac
import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import decrypt_token, encrypt_token
from app.models.issue import Issue
from app.models.issue_status_history import IssueStatusHistory


def _github_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


def _parse_repo(url: str) -> tuple[str, str]:
    parts = url.rstrip("/").split("/")
    return parts[-2], parts[-1]


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    if not settings.github_webhook_secret:
        return True
    expected = "sha256=" + hmac.new(
        settings.github_webhook_secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def test_connection(repo_url: str, token: str) -> dict:
    owner, repo = _parse_repo(repo_url)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=_github_headers(token),
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub connection failed")
    data = resp.json()
    return {"name": data["full_name"], "stars": data["stargazers_count"], "forks": data["forks_count"]}


async def get_repo_info(repo_url: str, token: str) -> dict:
    owner, repo = _parse_repo(repo_url)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=_github_headers(token),
        )
    resp.raise_for_status()
    data = resp.json()
    return {
        "name": data["full_name"],
        "stars": data["stargazers_count"],
        "forks": data["forks_count"],
        "open_issues": data["open_issues_count"],
        "description": data.get("description"),
        "url": data["html_url"],
    }


async def import_github_issues(project_id: uuid.UUID, repo_url: str, token: str, creator_id: uuid.UUID, session: AsyncSession) -> list[Issue]:
    owner, repo = _parse_repo(repo_url)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            headers=_github_headers(token),
            params={"state": "open", "per_page": 100},
        )
    resp.raise_for_status()
    gh_issues = resp.json()

    created = []
    for gh in gh_issues:
        if "pull_request" in gh:
            continue
        issue = Issue(
            title=gh["title"],
            description=gh.get("body") or "",
            type="task",
            priority="medium",
            status="open",
            project_id=project_id,
            creator_id=creator_id,
            github_issue_number=gh["number"],
            github_issue_url=gh["html_url"],
        )
        session.add(issue)
        await session.flush()
        session.add(IssueStatusHistory(
            issue_id=issue.id, to_status="open", changed_by=creator_id, change_type="github_sync"
        ))
        created.append(issue)

    await session.commit()
    return created


async def create_github_issue(issue_id: uuid.UUID, repo_url: str, token: str, session: AsyncSession) -> Issue:
    result = await session.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    owner, repo = _parse_repo(repo_url)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.github.com/repos/{owner}/{repo}/issues",
            headers=_github_headers(token),
            json={"title": issue.title, "body": issue.description},
        )
    resp.raise_for_status()
    gh = resp.json()

    issue.github_issue_number = gh["number"]
    issue.github_issue_url = gh["html_url"]
    await session.commit()
    await session.refresh(issue)
    return issue


async def sync_issue_from_github(issue_id: uuid.UUID, repo_url: str, token: str, changed_by: uuid.UUID, session: AsyncSession) -> Issue:
    result = await session.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue or not issue.github_issue_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Issue not linked to GitHub")

    owner, repo = _parse_repo(repo_url)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues/{issue.github_issue_number}",
            headers=_github_headers(token),
        )
    resp.raise_for_status()
    gh = resp.json()

    old_status = issue.status
    new_status = "closed" if gh["state"] == "closed" else "open"

    issue.title = gh["title"]
    issue.description = gh.get("body") or ""

    if new_status != old_status:
        issue.status = new_status
        session.add(IssueStatusHistory(
            issue_id=issue.id,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            change_type="github_sync",
            github_sync=True,
        ))

    await session.commit()
    await session.refresh(issue)
    return issue
