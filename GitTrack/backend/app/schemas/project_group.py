import uuid
from datetime import datetime

from pydantic import BaseModel


class ProjectGroupCreate(BaseModel):
    name: str
    description: str
    color: str | None = None
    github_organization: str | None = None


class ProjectGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    github_organization: str | None = None


class ProjectGroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    owner_id: uuid.UUID
    color: str | None
    github_organization: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
