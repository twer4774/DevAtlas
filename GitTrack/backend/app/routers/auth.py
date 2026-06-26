from fastapi import APIRouter, Depends, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    user = await auth_service.register(body.email, body.password, body.name, session)
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    user, token = await auth_service.login(body.email, body.password, session)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}


@router.get("/github")
async def github_login():
    url = await auth_service.get_github_oauth_url()
    return RedirectResponse(url)


@router.get("/github/callback", response_model=TokenResponse)
async def github_callback(code: str, session: AsyncSession = Depends(get_session)):
    user, token = await auth_service.github_callback(code, session)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
