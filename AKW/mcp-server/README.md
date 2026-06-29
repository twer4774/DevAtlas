# AKW MCP 서버

[AKW FastAPI](../backend) REST API를 [Model Context Protocol](https://modelcontextprotocol.io/) 도구로 노출합니다. **Cursor**, Claude Desktop 등 MCP 클라이언트에서 프로젝트·버전·노드·엣지·문서를 조회/생성할 수 있습니다.

## 요구 사항

- Node.js 20+
- (로컬) 백엔드가 `DEVATLAS_API_BASE` URL에서 동작 중일 것

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DEVATLAS_API_BASE` | `http://127.0.0.1:8000` | API 루트 (끝 `/` 없이) |
| `DEVATLAS_API_TOKEN` | (없음) | 백엔드 `DEVATLAS_API_TOKEN`과 **동일**하게 설정하면 `Authorization: Bearer …` 전송 |

> **보안**: 토큰을 켠 백엔드는 브라우저 프론트(기본 axios)도 Bearer가 없으면 실패합니다. 토큰을 쓸 때는 로컬 자동화(MCP/스크립트) 전용으로 두거나, Vite 프록시에 헤더를 넣는 등 별도 대응이 필요합니다. 비설정 시 API는 기존처럼 로컬에서 개방입니다.

## 설치 및 빌드

```bash
cd mcp-server
npm install
npm run build
```

개발 시:

```bash
npm run dev
```

## 제공 도구 요약

- **프로젝트**: `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`
- **버전**: `list_versions`, `get_version`, `create_version`, `update_version`, `delete_version`, `fork_version`, `compare_versions`
- **노드**: `list_nodes`, `get_node`, `create_node`, `update_node`, `delete_node`
- **엣지**: `list_edges`, `get_edge`, `create_edge`, `delete_edge`
- **검색**: `search`
- **문서**: `list_version_documents`, `list_node_documents`, `get_document`, `upload_document`, `create_document`, `update_document`, `link_document_to_nodes`, `delete_document`

리소스(읽기 전용):

- `devatlas://versions/{version_id}/summary` — 노드/엣지/문서 수와 노드 제목 미리보기(JSON)

## Cursor MCP 등록

예: **설정 → MCP → New MCP Server** 또는 `~/.cursor/mcp.json` 에 추가:

```json
{
  "mcpServers": {
    "akw": {
      "command": "node",
      "args": [
        "/절대경로/DevAtlas/DevAtlas Map/mcp-server/dist/index.js"
      ],
      "env": {
        "DEVATLAS_API_BASE": "http://127.0.0.1:8000",
        "DEVATLAS_API_TOKEN": ""
      }
    }
  }
}
```

경로는 본인 워크스페이스에 맞게 바꿉니다. 수정 후에는 `npm run build` 로 `dist/`를 갱신하거나 `tsx`로 직접 실행합니다:

```json
"command": "npx",
"args": ["tsx", "/절대경로/…/mcp-server/src/index.ts"]
```

빈 `DEVATLAS_API_TOKEN` 은 생략해도 됩니다.

에디터에서 MCP 목록에 서버가 보인 뒤, 채팅에서 예시 요청:

1. `list_projects`
2. 프로젝트 ID로 `list_versions`
3. 버전 ID로 `list_nodes` / `create_node`
