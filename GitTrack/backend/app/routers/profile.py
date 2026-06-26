from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileResponse(BaseModel):
    id: str
    username: str
    name: str
    avatar_url: str | None
    org_id: str | None
    org_slug: str | None
    org_role: str | None
    role: str


class ProfileUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user=Depends(get_current_user)):
    return ProfileResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        org_id=current_user.org_id,
        org_slug=current_user.org_slug,
        org_role=current_user.org_role,
        role=current_user.role,
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(body: ProfileUpdate, current_user=Depends(get_current_user)):
    # Profile updates are managed by Portal; return current claims
    return ProfileResponse(
        id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        org_id=current_user.org_id,
        org_slug=current_user.org_slug,
        org_role=current_user.org_role,
        role=current_user.role,
    )
