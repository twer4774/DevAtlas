import uuid

from sqlalchemy import select, cast, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import not_found
from app.core.s3 import upload_document, get_presigned_url, delete_document
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


async def create_document(
    db: AsyncSession,
    data: DocumentCreate,
    file_bytes: bytes | None = None,
    content_type: str = "text/markdown",
) -> Document:
    content_url = None
    if file_bytes:
        key = f"{data.project_id}/{uuid.uuid4()}"
        content_url = upload_document(file_bytes, content_type, key)

    doc = Document(
        project_id=data.project_id,
        version_id=data.version_id,
        type=data.type,
        title=data.title,
        content_url=content_url,
        linked_node_ids=data.linked_node_ids,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def get_document(db: AsyncSession, doc_id: uuid.UUID) -> Document:
    doc = await db.get(Document, doc_id)
    if not doc:
        raise not_found("Document")
    return doc


async def get_document_with_url(db: AsyncSession, doc_id: uuid.UUID) -> tuple[Document, str | None]:
    doc = await get_document(db, doc_id)
    url = get_presigned_url(doc.content_url) if doc.content_url else None
    return doc, url


async def get_version_documents(db: AsyncSession, version_id: uuid.UUID) -> list[Document]:
    result = await db.execute(
        select(Document).where(Document.version_id == version_id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


async def get_node_documents(db: AsyncSession, node_id: uuid.UUID) -> list[Document]:
    result = await db.execute(
        select(Document).where(
            Document.linked_node_ids.contains([str(node_id)])
        )
    )
    return list(result.scalars().all())


async def update_document(db: AsyncSession, doc_id: uuid.UUID, data: DocumentUpdate) -> Document:
    doc = await get_document(db, doc_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return doc


async def delete_document_record(db: AsyncSession, doc_id: uuid.UUID) -> None:
    doc = await get_document(db, doc_id)
    if doc.content_url:
        delete_document(doc.content_url)
    await db.delete(doc)
    await db.commit()
