import uuid
from datetime import datetime

from pydantic import BaseModel


class SpecCreate(BaseModel):
    title: str
    description: str
    type: str
    priority: str = "medium"
    status: str = "draft"
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None = None
    requirements: str | None = None
    acceptance: str | None = None
    design: str | None = None
    implementation: str | None = None
    testing: str | None = None
    estimated_hours: int | None = None
    tags: str | None = None


class SpecUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    priority: str | None = None
    status: str | None = None
    assignee_id: uuid.UUID | None = None
    requirements: str | None = None
    acceptance: str | None = None
    design: str | None = None
    implementation: str | None = None
    testing: str | None = None
    estimated_hours: int | None = None
    tags: str | None = None


class SpecResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    type: str
    priority: str
    status: str
    project_id: uuid.UUID
    created_by: uuid.UUID
    assignee_id: uuid.UUID | None
    requirements: str | None
    acceptance: str | None
    design: str | None
    implementation: str | None
    testing: str | None
    estimated_hours: int | None
    tags: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
