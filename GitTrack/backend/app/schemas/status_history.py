import uuid
from datetime import datetime

from pydantic import BaseModel


class StatusHistoryResponse(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    from_status: str | None
    to_status: str
    changed_by: uuid.UUID
    change_type: str
    reason: str | None
    github_sync: bool
    created_at: datetime

    model_config = {"from_attributes": True}
