import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.core.s3 import get_s3_client
from app.config import settings
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.services import document_service

router = APIRouter(tags=["documents"], dependencies=[Depends(get_current_user)])


@router.post("/documents/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: uuid.UUID = Form(...),
    type: str = Form(...),
    title: str = Form(...),
    version_id: uuid.UUID | None = Form(default=None),
    linked_node_ids: str = Form(default="[]"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    import json
    file_bytes = await file.read()
    data = DocumentCreate(
        project_id=project_id,
        version_id=version_id,
        type=type,
        title=title,
        linked_node_ids=json.loads(linked_node_ids),
    )
    return await document_service.create_document(db, data, file_bytes, file.content_type or "text/markdown")


@router.post("/documents", response_model=DocumentResponse, status_code=201)
async def create_document(data: DocumentCreate, db: AsyncSession = Depends(get_db)):
    return await document_service.create_document(db, data)


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc, url = await document_service.get_document_with_url(db, doc_id)
    response = DocumentResponse.model_validate(doc)
    response.content_url = url
    return response


@router.get("/versions/{version_id}/documents", response_model=list[DocumentResponse])
async def list_version_documents(version_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await document_service.get_version_documents(db, version_id)


@router.get("/nodes/{node_id}/documents", response_model=list[DocumentResponse])
async def list_node_documents(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await document_service.get_node_documents(db, node_id)


@router.patch("/documents/{doc_id}", response_model=DocumentResponse)
async def update_document(doc_id: uuid.UUID, data: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    return await document_service.update_document(db, doc_id, data)


@router.put("/documents/{doc_id}/content", response_model=DocumentResponse)
async def update_document_content(
    doc_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    return await document_service.update_document_content(
        db, doc_id, file_bytes, file.content_type or "text/markdown"
    )


@router.get("/documents/{doc_id}/raw")
async def get_document_raw(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await document_service.get_document(db, doc_id)
    if not doc.content_url:
        return Response(content="", media_type="text/plain")
    s3 = get_s3_client()
    obj = s3.get_object(Bucket=settings.s3_bucket, Key=doc.content_url)
    content = obj["Body"].read()
    content_type = obj.get("ContentType", "text/markdown")
    return Response(content=content, media_type=content_type)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await document_service.delete_document_record(db, doc_id)
