from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import projects, versions, nodes, edges, documents, changelog, search, policies


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="AKW API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(versions.router)
app.include_router(nodes.router)
app.include_router(edges.router)
app.include_router(documents.router)
app.include_router(changelog.router)
app.include_router(search.router)
app.include_router(policies.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
