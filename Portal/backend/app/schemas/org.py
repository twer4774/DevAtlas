from datetime import datetime
from pydantic import BaseModel


class OrgCreate(BaseModel):
    name: str
    slug: str


class OrgMemberOut(BaseModel):
    user_id: str
    username: str
    avatar_url: str | None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class OrgOut(BaseModel):
    id: str
    name: str
    slug: str
    avatar_url: str | None
    owner_id: str
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class InviteCreate(BaseModel):
    github_username: str | None = None
    email: str | None = None
    role: str = "member"


class InviteOut(BaseModel):
    id: str
    token: str
    github_username: str | None
    email: str | None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
