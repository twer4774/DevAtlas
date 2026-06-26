from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_session
from app.deps import get_current_user
from app.models.organization import Organization, OrgMember
from app.schemas.org import OrgCreate, OrgOut, OrgMemberOut, InviteCreate, InviteOut, OrgTokenOut
from app.services import org_service

router = APIRouter(prefix="/api/orgs", tags=["orgs"])


@router.post("", response_model=OrgOut, status_code=201)
async def create_org(body: OrgCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.create_org(body.name, body.slug, current_user.id, db)
    return OrgOut(id=org.id, name=org.name, slug=org.slug, avatar_url=org.avatar_url, owner_id=org.owner_id, created_at=org.created_at, member_count=1)


@router.get("", response_model=list[OrgOut])
async def list_orgs(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    orgs = await org_service.get_user_orgs(current_user.id, db)
    result = []
    for org in orgs:
        members = await org_service.get_org_members(org.id, db)
        result.append(OrgOut(id=org.id, name=org.name, slug=org.slug, avatar_url=org.avatar_url, owner_id=org.owner_id, created_at=org.created_at, member_count=len(members)))
    return result


@router.get("/{slug}", response_model=OrgOut)
async def get_org(slug: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.get_org_by_slug(slug, db)
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    members = await org_service.get_org_members(org.id, db)
    return OrgOut(id=org.id, name=org.name, slug=org.slug, avatar_url=org.avatar_url, owner_id=org.owner_id, created_at=org.created_at, member_count=len(members))


@router.get("/{slug}/members", response_model=list[OrgMemberOut])
async def list_members(slug: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.get_org_by_slug(slug, db)
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    return await org_service.get_org_members(org.id, db)


@router.delete("/{slug}/members/{user_id}", status_code=204)
async def remove_member(slug: str, user_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.get_org_by_slug(slug, db)
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    await org_service.remove_member(org.id, user_id, current_user.id, db)


@router.post("/{slug}/invitations", response_model=InviteOut, status_code=201)
async def invite_member(slug: str, body: InviteCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.get_org_by_slug(slug, db)
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    inv = await org_service.create_invitation(
        org.id, current_user.id, current_user.username,
        body.github_username, body.email, body.role, org.name, db
    )
    return InviteOut(id=inv.id, token=inv.token, github_username=inv.github_username, email=inv.email, role=inv.role, created_at=inv.created_at)


@router.post("/invitations/{token}/accept", response_model=OrgTokenOut)
async def accept_invite(token: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.accept_invitation(token, current_user.id, db)
    result = await db.execute(select(OrgMember).where(OrgMember.org_id == org.id, OrgMember.user_id == current_user.id))
    member = result.scalar_one()
    access_token = await org_service.issue_org_token(current_user.id, current_user.username, current_user.avatar_url, org, member.role)
    return OrgTokenOut(access_token=access_token)


@router.post("/{slug}/token", response_model=OrgTokenOut)
async def get_org_token(slug: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    org = await org_service.get_org_by_slug(slug, db)
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    result = await db.execute(select(OrgMember).where(OrgMember.org_id == org.id, OrgMember.user_id == current_user.id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    access_token = await org_service.issue_org_token(current_user.id, current_user.username, current_user.avatar_url, org, member.role)
    return OrgTokenOut(access_token=access_token)
