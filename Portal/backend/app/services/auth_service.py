import uuid
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.core.security import create_access_token
from app.models.user import User


async def get_github_oauth_url(state: str = "") -> str:
    params = f"client_id={settings.github_client_id}&scope=read:user,user:email"
    if state:
        params += f"&state={state}"
    return f"https://github.com/login/oauth/authorize?{params}"


async def github_callback(code: str, db: AsyncSession) -> tuple[User, str]:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={"client_id": settings.github_client_id, "client_secret": settings.github_client_secret, "code": code},
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()
        github_token = token_data.get("access_token")
        if not github_token:
            raise ValueError("GitHub OAuth failed")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"},
        )
        gh_user = user_resp.json()

        emails_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {github_token}", "Accept": "application/vnd.github+json"},
        )
        emails = emails_resp.json() if emails_resp.status_code == 200 else []
        primary_email = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)

    github_id = str(gh_user["id"])
    result = await db.execute(select(User).where(User.github_id == github_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=str(uuid.uuid4()),
            github_id=github_id,
            username=gh_user.get("login", ""),
            email=primary_email,
            avatar_url=gh_user.get("avatar_url"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.username = gh_user.get("login", user.username)
        user.avatar_url = gh_user.get("avatar_url", user.avatar_url)
        if primary_email:
            user.email = primary_email
        await db.commit()

    token = create_access_token({"sub": user.id, "username": user.username, "avatar_url": user.avatar_url})
    return user, token
