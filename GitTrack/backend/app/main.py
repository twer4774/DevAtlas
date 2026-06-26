from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    admin,
    attachments,
    auth,
    comments,
    dashboard,
    github,
    issues,
    profile,
    project_groups,
    projects,
    specs,
    status_history,
    templates,
    ws,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.s3_service import ensure_bucket
    try:
        ensure_bucket()
    except Exception:
        pass
    yield


app = FastAPI(title="GitTrack API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(project_groups.router)
app.include_router(projects.router)
app.include_router(issues.router)
app.include_router(comments.router)
app.include_router(attachments.router)
app.include_router(templates.router)
app.include_router(specs.router)
app.include_router(github.router)
app.include_router(dashboard.router)
app.include_router(status_history.router)
app.include_router(admin.router)
app.include_router(profile.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
