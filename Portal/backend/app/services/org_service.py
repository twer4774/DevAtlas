import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.organization import Organization, OrgMember
from app.models.invitation import OrgInvitation
from app.models.user import User
from app.core.security import create_access_token
from app.config import settings
from app.services import email_service


async def create_org(name: str, slug: str, owner_id: str, db: AsyncSession) -> Organization:
    existing = await db.execute(select(Organization).where(Organization.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already taken")

    org = Organization(id=str(uuid.uuid4()), name=name, slug=slug, owner_id=owner_id)
    member = OrgMember(id=str(uuid.uuid4()), org_id=org.id, user_id=owner_id, role="owner")
    db.add(org)
    db.add(member)
    await db.commit()
    await db.refresh(org)
    return org


async def get_user_orgs(user_id: str, db: AsyncSession) -> list[Organization]:
    result = await db.execute(
        select(Organization)
        .join(OrgMember, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_org_by_slug(slug: str, db: AsyncSession) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.slug == slug))
    return result.scalar_one_or_none()


async def get_org_members(org_id: str, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(OrgMember, User)
        .join(User, User.id == OrgMember.user_id)
        .where(OrgMember.org_id == org_id)
    )
    return [
        {"user_id": m.user_id, "username": u.username, "avatar_url": u.avatar_url, "role": m.role, "joined_at": m.joined_at}
        for m, u in result.all()
    ]


async def create_invitation(
    org_id: str, invited_by: str, invited_by_username: str,
    github_username: str | None, email: str | None,
    role: str, org_name: str, db: AsyncSession
) -> OrgInvitation:
    from datetime import datetime, timezone, timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    inv = OrgInvitation(org_id=org_id, invited_by=invited_by, github_username=github_username, email=email, role=role, expires_at=expires_at)
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    if email:
        invite_url = f"{settings.portal_frontend_url}/invite/{inv.token}"
        try:
            await email_service.send_invite_email(email, org_name, invited_by_username, invite_url)
        except Exception:
            pass

    return inv


async def accept_invitation(token: str, user_id: str, db: AsyncSession) -> Organization:
    from datetime import datetime, timezone
    result = await db.execute(select(OrgInvitation).where(OrgInvitation.token == token))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다")
    if inv.accepted_at:
        raise HTTPException(status_code=400, detail="이미 수락된 초대입니다")
    if inv.expires_at and inv.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="만료된 초대입니다")

    if inv.github_username:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user or user.username.lower() != inv.github_username.lower():
            raise HTTPException(status_code=403, detail=f"이 초대는 GitHub 유저 '{inv.github_username}'을(를) 위한 것입니다")

    existing = await db.execute(select(OrgMember).where(OrgMember.org_id == inv.org_id, OrgMember.user_id == user_id))
    if not existing.scalar_one_or_none():
        member = OrgMember(id=str(uuid.uuid4()), org_id=inv.org_id, user_id=user_id, role=inv.role)
        db.add(member)

    inv.accepted_at = datetime.now(timezone.utc)
    await db.commit()

    org_result = await db.execute(select(Organization).where(Organization.id == inv.org_id))
    return org_result.scalar_one()


async def issue_org_token(user_id: str, username: str, avatar_url: str | None, org: Organization, role: str) -> str:
    return create_access_token({
        "sub": user_id,
        "username": username,
        "avatar_url": avatar_url,
        "org_id": org.id,
        "org_slug": org.slug,
        "org_name": org.name,
        "org_role": role,
    })


async def remove_member(org_id: str, user_id: str, requester_id: str, db: AsyncSession) -> None:
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    if org.owner_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove owner")
    result = await db.execute(select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == user_id))
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.commit()
