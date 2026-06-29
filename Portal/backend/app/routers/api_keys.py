import hashlib
import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_session
from app.deps import get_current_user
from app.models.api_key import ApiKey
from app.models.organization import Organization, OrgMember
from app.core.security import create_service_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: str | None
    created_at: str

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyOut):
    key: str  # 최초 1회만 반환


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


@router.get("", response_model=list[ApiKeyOut])
async def list_api_keys(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        ApiKeyOut(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,
            is_active=k.is_active,
            last_used_at=k.last_used_at.isoformat() if k.last_used_at else None,
            created_at=k.created_at.isoformat(),
        )
        for k in keys
    ]


@router.post("", response_model=ApiKeyCreated, status_code=201)
async def create_api_key(body: ApiKeyCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    raw = "dat_" + secrets.token_hex(24)
    prefix = raw[:12]  # "dat_" + 8자
    key_id = str(uuid.uuid4())
    api_key = ApiKey(
        id=key_id,
        user_id=current_user.id,
        name=body.name,
        key_hash=_hash_key(raw),
        key_prefix=prefix,
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return ApiKeyCreated(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        is_active=api_key.is_active,
        last_used_at=None,
        created_at=api_key.created_at.isoformat(),
        key=raw,
    )


class ServiceTokenRequest(BaseModel):
    org_slug: str


class ServiceTokenOut(BaseModel):
    service_token: str
    org_slug: str
    expires_in_days: int = 365


@router.post("/{key_id}/service-token", response_model=ServiceTokenOut)
async def create_service_token_endpoint(
    key_id: str,
    body: ServiceTokenRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id, ApiKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    org_result = await db.execute(select(Organization).where(Organization.slug == body.org_slug))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail=f"조직 '{body.org_slug}'을(를) 찾을 수 없습니다")

    member_result = await db.execute(
        select(OrgMember).where(OrgMember.org_id == org.id, OrgMember.user_id == current_user.id)
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="해당 조직의 멤버가 아닙니다")

    token = create_service_token({
        "sub": current_user.id,
        "username": current_user.username,
        "avatar_url": current_user.avatar_url,
        "org_id": org.id,
        "org_slug": org.slug,
        "org_name": org.name,
        "org_role": member.role,
    })
    return ServiceTokenOut(service_token=token, org_slug=org.slug)


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(key_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.execute(update(ApiKey).where(ApiKey.id == key_id).values(is_active=False))
    await db.commit()
