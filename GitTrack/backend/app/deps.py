from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database import get_session

bearer_scheme = HTTPBearer(auto_error=False)


class TokenUser:
    def __init__(self, user_id: str, username: str, avatar_url, org_id, org_slug, org_role):
        self.id = user_id
        self.user_id = user_id
        self.username = username
        self.name = username
        self.avatar_url = avatar_url
        self.org_id = org_id
        self.org_slug = org_slug
        self.org_role = org_role
        self.role = "admin" if org_role == "owner" else "member"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> TokenUser:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return TokenUser(
        user_id=payload.get("sub", ""),
        username=payload.get("username", ""),
        avatar_url=payload.get("avatar_url"),
        org_id=payload.get("org_id"),
        org_slug=payload.get("org_slug"),
        org_role=payload.get("org_role"),
    )


async def get_org_id(current_user: TokenUser = Depends(get_current_user)) -> str:
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No organization selected. Get an org-scoped token from Portal first."
        )
    return current_user.org_id


async def get_current_admin(current_user: TokenUser = Depends(get_current_user)) -> TokenUser:
    if current_user.org_role not in ("owner", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


async def get_session_dep(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session
