import uuid
from datetime import datetime

from pydantic import BaseModel


class IssueCreate(BaseModel):
    title: str
    description: str
    type: str
    priority: str
    status: str = "open"
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None = None
    spec_id: uuid.UUID | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    priority: str | None = None
    status: str | None = None
    assignee_id: uuid.UUID | None = None


class IssueResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    type: str
    priority: str
    status: str
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None
    creator_id: uuid.UUID
    spec_id: uuid.UUID | None
    github_issue_number: int | None
    github_issue_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IssueStats(BaseModel):
    total: int
    open: int
    in_progress: int
    closed: int
    by_priority: dict[str, int]
    by_type: dict[str, int]
