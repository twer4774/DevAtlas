import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class RoadmapItemCreate(BaseModel):
    priority: Literal["p1", "p2", "p3", "p4"] = "p3"
    category: str = "공통"
    title: str
    description: str | None = None
    size: Literal["XS", "S", "M", "L", "XL"] = "M"
    status: str = "todo"
    sort_order: int = 0
    version_id: uuid.UUID | None = None


class RoadmapItemUpdate(BaseModel):
    priority: Literal["p1", "p2", "p3", "p4"] | None = None
    category: str | None = None
    title: str | None = None
    description: str | None = None
    size: Literal["XS", "S", "M", "L", "XL"] | None = None
    status: str | None = None
    sort_order: int | None = None
    version_id: uuid.UUID | None = None


class RoadmapItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    version_id: uuid.UUID | None
    priority: str
    category: str
    title: str
    description: str | None
    size: str
    status: str
    sort_order: int
    created_at: datetime
    updated_at: datetime
