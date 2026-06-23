import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EdgeCreate(BaseModel):
    source_id: uuid.UUID
    target_id: uuid.UUID
    relation_type: str = "depends_on"


class EdgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version_id: uuid.UUID
    source_id: uuid.UUID
    target_id: uuid.UUID
    relation_type: str
    created_at: datetime
