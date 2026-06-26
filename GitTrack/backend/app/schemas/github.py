import uuid
from datetime import datetime

from pydantic import BaseModel


class TestConnectionRequest(BaseModel):
    repo_url: str
    token: str


class TestConnectionResponse(BaseModel):
    name: str
    stars: int
    forks: int


class ImportIssuesRequest(BaseModel):
    repo_url: str
    token: str


class CreateGitHubIssueRequest(BaseModel):
    repo_url: str
    token: str


class SyncIssueRequest(BaseModel):
    repo_url: str
    token: str
