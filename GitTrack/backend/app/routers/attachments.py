import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentInitRequest, AttachmentResponse, UploadInitResponse
from app.services import s3_service

router = APIRouter(prefix="/api/attachments", tags=["attachments"])


@router.post("/init", response_model=UploadInitResponse, status_code=201)
async def init_upload(
    body: AttachmentInitRequest,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    key = s3_service.generate_upload_key(body.filename)
    upload_url = s3_service.get_presigned_upload_url(key, body.mime_type)

    attachment = Attachment(
        filename=body.filename,
        s3_key=key,
        mime_type=body.mime_type,
        file_size=body.file_size,
        issue_id=body.issue_id,
    )
    session.add(attachment)
    await session.commit()
    await session.refresh(attachment)

    return UploadInitResponse(attachment_id=attachment.id, upload_url=upload_url, s3_key=key)


@router.get("/{attachment_id}", response_model=AttachmentResponse)
async def get_attachment(
    attachment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    result = await session.execute(select(Attachment).where(Attachment.id == attachment_id))
    attachment = result.scalar_one_or_none()
    if not attachment:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    download_url = s3_service.get_presigned_download_url(attachment.s3_key)
    data = AttachmentResponse.model_validate(attachment)
    data.download_url = download_url
    return data


@router.delete("/{attachment_id}", status_code=204)
async def delete_attachment(
    attachment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    result = await session.execute(select(Attachment).where(Attachment.id == attachment_id))
    attachment = result.scalar_one_or_none()
    if attachment:
        s3_service.delete_object(attachment.s3_key)
        await session.delete(attachment)
        await session.commit()
