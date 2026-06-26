import uuid
from datetime import datetime

from pydantic import BaseModel


class AttachmentInitRequest(BaseModel):
    filename: str
    mime_type: str
    file_size: int
    issue_id: uuid.UUID


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    s3_key: str
    mime_type: str
    file_size: int
    issue_id: uuid.UUID
    created_at: datetime
    download_url: str | None = None

    model_config = {"from_attributes": True}


class UploadInitResponse(BaseModel):
    attachment_id: uuid.UUID
    upload_url: str
    s3_key: str
