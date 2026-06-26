import uuid
from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str
    type: str = "FULLSTACK"
    project_group_id: uuid.UUID | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    type: str | None = None
    project_group_id: uuid.UUID | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    type: str
    project_group_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
