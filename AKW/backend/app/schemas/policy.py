import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PolicyCreate(BaseModel):
    title: str
    description: str | None = None
    severity: Literal["critical", "major", "minor"] = "major"


class PolicyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: Literal["critical", "major", "minor"] | None = None
    status: Literal["active", "deprecated"] | None = None


class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None
    severity: str
    status: str
    created_at: datetime
    updated_at: datetime
    node_ids: list[uuid.UUID] = []


class PolicyLinkRequest(BaseModel):
    node_ids: list[uuid.UUID]
