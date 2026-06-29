# AKW

아키텍처 맵(노드/엣지/문서) 편집을 위한 풀스택 프로젝트입니다.

## 프로젝트 구조

- `frontend`: React + Vite + TypeScript (`@xyflow/react` 기반 맵 UI)
- `backend`: FastAPI + SQLAlchemy + Alembic
- `mcp-server`: Node MCP 서버 — FastAPI를 Cursor 등에서 도구로 호출
- `docker-compose.yml`: 로컬 Postgres / MinIO

## 요구 사항

- Node.js 20+
- `pnpm`
- Python 3.12+
- `uv` (Python 의존성/실행)
- Docker + Docker Compose

## 빠른 시작

### 1) 인프라 실행

```bash
docker compose up -d
```

- Postgres: `localhost:5433`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

### 2) 백엔드 실행

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

헬스체크: [http://localhost:8000/health](http://localhost:8000/health)

### 3) 프론트엔드 실행

```bash
cd frontend
pnpm install
pnpm dev
```

앱: [http://localhost:5173](http://localhost:5173)

## 개발 명령어

### Frontend

```bash
cd frontend
pnpm dev
pnpm lint
pnpm build
```

### Backend

```bash
cd backend
uv run uvicorn app.main:app --reload
uv run alembic upgrade head
```

## 환경 변수

기본값은 `backend/app/config.py`에 정의되어 있고, `backend/.env`에서 오버라이드됩니다.
주요 항목:

- `DATABASE_URL`
- `S3_ENDPOINT_URL`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `CORS_ORIGINS`
- `DEVATLAS_API_TOKEN` (선택): 백엔드에 설정 시, `GET /health` 제외 모든 API에 `Authorization: Bearer …` 필요. MCP에서 동일 값을 `DEVATLAS_API_TOKEN`으로 보냅니다.

## MCP (Cursor 등)

아키텍처 맵 API를 채팅/에이전트로 다루려면 [`mcp-server/README.md`](mcp-server/README.md) 를 참고해 MCP 서버를 띄우고 Cursor에 등록합니다.
