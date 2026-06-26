import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


async def register(email: str, password: str, name: str, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=email, password=hash_password(password), name=name)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def login(email: str, password: str, session: AsyncSession) -> tuple[User, str]:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.password or not verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return user, token


async def get_github_oauth_url() -> str:
    params = f"client_id={settings.github_client_id}&scope=repo,user"
    return f"https://github.com/login/oauth/authorize?{params}"


async def github_callback(code: str, session: AsyncSession) -> tuple[User, str]:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()
        github_access_token = token_data.get("access_token")
        if not github_access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub OAuth failed")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_access_token}"},
        )
        gh_user = user_resp.json()

    github_id = str(gh_user["id"])
    result = await session.execute(select(User).where(User.github_id == github_id))
    user = result.scalar_one_or_none()

    if user is None:
        result = await session.execute(select(User).where(User.email == gh_user.get("email", "")))
        user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=gh_user.get("email") or f"{gh_user['login']}@github.local",
            name=gh_user.get("name") or gh_user["login"],
            github_id=github_id,
            github_username=gh_user["login"],
            github_token=github_access_token,
            avatar_url=gh_user.get("avatar_url"),
        )
        session.add(user)
    else:
        user.github_id = github_id
        user.github_username = gh_user["login"]
        user.github_token = github_access_token
        user.avatar_url = gh_user.get("avatar_url")

    await session.commit()
    await session.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id)})
    return user, jwt_token
