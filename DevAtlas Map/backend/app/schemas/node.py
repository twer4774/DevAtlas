import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NodeCreate(BaseModel):
    title: str
    type: str
    position: dict[str, float] | None = None
    metadata_: dict[str, Any] = {}
    parent_id: uuid.UUID | None = None
    reason: str = ""
    author: str = "unknown"


class NodeUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    position: dict[str, float] | None = None
    metadata_: dict[str, Any] | None = None
    parent_id: uuid.UUID | None = None
    reason: str = ""
    author: str = "unknown"


class NodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version_id: uuid.UUID
    parent_id: uuid.UUID | None
    title: str
    type: str
    position: dict[str, float] | None
    metadata_: dict[str, Any]
    created_at: datetime
    updated_at: datetime
