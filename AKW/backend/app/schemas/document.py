import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    project_id: uuid.UUID
    version_id: uuid.UUID | None = None
    type: str
    title: str
    linked_node_ids: list[str] = []


class DocumentUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    version_id: uuid.UUID | None = None
    linked_node_ids: list[str] | None = None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    version_id: uuid.UUID | None
    type: str
    title: str
    content_url: str | None
    linked_node_ids: list[str]
    created_at: datetime
    updated_at: datetime
