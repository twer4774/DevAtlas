import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str
    issue_id: uuid.UUID


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    issue_id: uuid.UUID
    author_id: uuid.UUID
    github_comment_id: str | None
    github_comment_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
