from pydantic import BaseModel


class DiffResponse(BaseModel):
    added: list[str]
    deleted: list[str]
    changed: list[str]
    unchanged: list[str]
    edges_added: list[str] = []
    edges_deleted: list[str] = []
