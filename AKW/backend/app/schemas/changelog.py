import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChangeLogCreate(BaseModel):
    target_id: uuid.UUID
    action: str
    reason: str | None = None
    author: str


class ChangeLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version_id: uuid.UUID
    target_id: uuid.UUID
    action: str
    reason: str | None
    author: str
    created_at: datetime
