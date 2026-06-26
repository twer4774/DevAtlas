from pydantic import BaseModel


class UserOut(BaseModel):
    id: str
    username: str
    email: str | None
    avatar_url: str | None

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
