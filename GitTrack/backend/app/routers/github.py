import uuid

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.github import (
    CreateGitHubIssueRequest,
    ImportIssuesRequest,
    SyncIssueRequest,
    TestConnectionRequest,
    TestConnectionResponse,
)
from app.schemas.issue import IssueResponse
from app.services import github_service

router = APIRouter(prefix="/api/github", tags=["github"])


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(body: TestConnectionRequest, _=Depends(get_current_user)):
    return await github_service.test_connection(body.repo_url, body.token)


@router.get("/projects/{project_id}/info")
async def get_project_repo_info(
    project_id: uuid.UUID,
    repo_url: str,
    token: str,
    _=Depends(get_current_user),
):
    return await github_service.get_repo_info(repo_url, token)


@router.post("/projects/{project_id}/import", response_model=list[IssueResponse])
async def import_issues(
    project_id: uuid.UUID,
    body: ImportIssuesRequest,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    issues = await github_service.import_github_issues(
        project_id, body.repo_url, body.token, current_user.id, session
    )
    return [IssueResponse.model_validate(i) for i in issues]


@router.post("/issues/{issue_id}/create", response_model=IssueResponse)
async def create_github_issue(
    issue_id: uuid.UUID,
    body: CreateGitHubIssueRequest,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    issue = await github_service.create_github_issue(issue_id, body.repo_url, body.token, session)
    return IssueResponse.model_validate(issue)


@router.post("/issues/{issue_id}/sync", response_model=IssueResponse)
async def sync_issue(
    issue_id: uuid.UUID,
    body: SyncIssueRequest,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    issue = await github_service.sync_issue_from_github(
        issue_id, body.repo_url, body.token, current_user.id, session
    )
    return IssueResponse.model_validate(issue)


@router.post("/webhook")
async def webhook(request: Request, x_hub_signature_256: str | None = Header(None)):
    payload = await request.body()
    if x_hub_signature_256:
        if not github_service.verify_webhook_signature(payload, x_hub_signature_256):
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")
    return {"status": "received"}
