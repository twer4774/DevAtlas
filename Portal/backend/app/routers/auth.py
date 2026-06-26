from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.auth import UserOut
from app.services import auth_service
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/github")
async def github_login(redirect_to: str = Query(default="")):
    url = await auth_service.get_github_oauth_url(state=redirect_to)
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(code: str, state: str = "", db: AsyncSession = Depends(get_session)):
    user, token = await auth_service.github_callback(code, db)
    redirect_base = state if state.startswith("http") else settings.portal_frontend_url
    return RedirectResponse(f"{redirect_base}/callback?token={token}")


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut.model_validate(current_user)
