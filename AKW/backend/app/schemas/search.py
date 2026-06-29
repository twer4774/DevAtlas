import uuid
from datetime import datetime

from pydantic import BaseModel


class NodeSearchResult(BaseModel):
    id: uuid.UUID
    version_id: uuid.UUID
    title: str
    type: str


class DocumentSearchResult(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    type: str


class VersionSearchResult(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    created_at: datetime


class SearchResponse(BaseModel):
    nodes: list[NodeSearchResult] = []
    documents: list[DocumentSearchResult] = []
    versions: list[VersionSearchResult] = []
