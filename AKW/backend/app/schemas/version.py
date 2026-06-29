import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class VersionCreate(BaseModel):
    name: str
    base_version_id: uuid.UUID | None = None
    release_date: date | None = None


class VersionUpdate(BaseModel):
    name: str | None = None
    release_date: date | None = None


class VersionFork(BaseModel):
    name: str
    release_date: date | None = None


class VersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    base_version_id: uuid.UUID | None
    release_date: date | None
    created_at: datetime
