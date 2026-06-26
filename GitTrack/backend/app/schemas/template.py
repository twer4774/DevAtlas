import uuid
from datetime import datetime

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    name: str
    issue_type: str
    content: str


class TemplateUpdate(BaseModel):
    name: str | None = None
    issue_type: str | None = None
    content: str | None = None


class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    issue_type: str
    content: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
