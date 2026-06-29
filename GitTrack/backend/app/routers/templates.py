import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateUpdate
from app.services import template_service

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    issue_type: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await template_service.list_templates(session, issue_type)


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    body: TemplateCreate,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    return await template_service.create_template(body.model_dump(), current_user.id, session)


@router.get("/type/{issue_type}", response_model=list[TemplateResponse])
async def list_templates_by_type(
    issue_type: str,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await template_service.list_templates(session, issue_type)


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await template_service.get_template(template_id, session)


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    return await template_service.update_template(template_id, body.model_dump(exclude_none=True), session)


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_user),
):
    await template_service.delete_template(template_id, session)
