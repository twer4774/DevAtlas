import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_admin
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(session: AsyncSession = Depends(get_session), _=Depends(get_current_admin)):
    result = await session.execute(select(User))
    return result.scalars().all()


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: uuid.UUID,
    role: str,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_admin),
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role
    await session.commit()
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _=Depends(get_current_admin),
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        await session.delete(user)
        await session.commit()
