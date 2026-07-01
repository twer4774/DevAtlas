#!/usr/bin/env node
/**
 * AKW (Architecture Knowledge Workspace) MCP server — wraps the AKW FastAPI REST API for Cursor/other MCP clients.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod/v4"

import { apiErrorBody, devatlasRequest } from "./http.js"

// ── Standard relation types (mirrors frontend constants.ts) ───────────────
// contains   — 포함 관계 (그룹→자식, 시스템→컴포넌트)
// realizes   — 구현 관계 (기능→기술 컴포넌트)
// depends_on — 의존 관계 (A가 B를 호출/사용)
// triggers   — 트리거 관계 (이벤트, 비동기 시작)
// applies_to — 정책 적용 (Policy 노드→대상)
// references — 참조 관계 (느슨한 언급)
const RELATION_TYPES = [
  `contains`, `realizes`, `depends_on`, `triggers`, `applies_to`, `references`,
] as const
type RelationType = typeof RELATION_TYPES[number]

const RELATION_TYPE_DESC =
  `Standard values: contains | realizes | depends_on | triggers | applies_to | references. ` +
  `Custom strings are accepted but won't have distinct visual styling in the map.`

// ── Coordinate system note (injected into node tool descriptions) ─────────
const COORD_NOTE =
  `Position coordinates: top-level nodes use absolute canvas coords (origin = top-left of canvas). ` +
  `Group children use coords relative to the parent group's top-left corner. ` +
  `When parent_id is set the position you provide is interpreted as relative. ` +
  `Omit position to place at (0,0); the UI will auto-layout on next open.`

// ── Helpers ───────────────────────────────────────────────────────────────

const UUID = z.string().uuid()

function okJson(data: unknown): CallToolResult {
  const text =
    typeof data === `string` ? data : JSON.stringify(data, null, 2) ?? `"null"`
  return { content: [{ type: `text`, text }] }
}

function errResult(message: string, status?: number): CallToolResult {
  return {
    content: [{ type: `text`, text: JSON.stringify({ error: message, status }) }],
    isError: true,
  }
}

async function readJsonSafe(res: Response): Promise<unknown> {
  if (res.status === 204 || res.headers.get(`content-length`) === `0`) return null
  const t = await res.text()
  if (!t.trim()) return null
  return JSON.parse(t) as unknown
}

async function runTool(
  op: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  try {
    return await op()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return errResult(msg)
  }
}

/** Strip server-internal fields from edge objects before returning to AI context. */
function trimEdge(e: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { version_id, created_at, ...rest } = e
  return rest
}

function applyEdgeTrim(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw.map(e => trimEdge(e as Record<string, unknown>))
  if (raw && typeof raw === `object`) return trimEdge(raw as Record<string, unknown>)
  return raw
}

// ── Server ────────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: `akw`, version: `0.2.0` },
  {
    instructions:
      `Controls AKW (Architecture Knowledge Workspace) via HTTP. Configure DEVATLAS_API_BASE (default http://127.0.0.1:8000). ` +
      `If secured, set DEVATLAS_API_TOKEN.\n\n` +
      `Typical workflow: list_projects → list_versions → list_nodes / create_node → create_edge\n\n` +
      `Finding node IDs for edges: call list_nodes(version_id) to get all node IDs at once, ` +
      `or search(q="name", type="nodes") to find a specific node. Never guess UUIDs.\n\n` +
      `Project overview (manager shortcut): project_overview(project_id) returns nodes/docs/roadmap/policies all at once.\n\n` +
      `Reading document content: read_document(doc_id) returns the raw markdown text.\n\n` +
      `Roadmap management: list_roadmap → create_roadmap_item / update_roadmap_item / delete_roadmap_item.\n` +
      `Roadmap fields — priority: p1|p2|p3|p4  size: XS|S|M|L|XL  status: todo|in_progress|done\n\n` +
      `Creating areas/groups (영역): use create_node with type="group". Set metadata_: {width, height} ` +
      `for the container size. Place child nodes inside by setting their parent_id to the group UUID.\n\n` +
      `Creating documents with content: use write_document for a single document with inline markdown. ` +
      `For bulk (one doc per node), use create_idea_documents.\n\n` +
      `Coordinates: top-level nodes use absolute canvas coords; group children use coords relative ` +
      `to the parent group corner. Omit position to let the UI auto-place.\n\n` +
      `Edge relation types: contains | realizes | depends_on | triggers | applies_to | references`,
  },
)

// ═════════════════════════════════════════════════════════════════════════
// Projects
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_projects`,
  { description: `List all projects.` },
  async () =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `get_project`,
  {
    description: `Get project by UUID.`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/${args.project_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_project`,
  {
    description: `Create a project. creator is required.`,
    inputSchema: z.object({
      name: z.string().min(1),
      creator: z.string().min(1),
      description: z.string().optional(),
    }),
  },
  async (args: { name: string; creator: string; description?: string }) =>
    runTool(async () => {
      const body = JSON.stringify({
        name: args.name,
        creator: args.creator,
        description: args.description ?? null,
      })
      const res = await devatlasRequest(`/projects/`, { method: `POST`, body })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_project`,
  {
    description: `Patch project name/description.`,
    inputSchema: z.object({
      project_id: UUID,
      name: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  async (args: { project_id: string; name?: string; description?: string }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.name !== undefined) patch.name = args.name
      if (args.description !== undefined) patch.description = args.description
      const res = await devatlasRequest(`/projects/${args.project_id}`, {
        method: `PATCH`,
        body: JSON.stringify(patch),
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_project`,
  {
    description: `Delete project and all its data.`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/${args.project_id}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Versions
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_versions`,
  {
    description: `List all versions of a project.`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/${args.project_id}/versions`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `get_version`,
  {
    description: `Get a single version.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_version`,
  {
    description: `Create a new version under a project.`,
    inputSchema: z.object({
      project_id: UUID,
      name: z.string().min(1),
      base_version_id: UUID.optional(),
      release_date: z.string().optional().describe(`ISO date "YYYY-MM-DD"`),
    }),
  },
  async (args: {
    project_id: string
    name: string
    base_version_id?: string
    release_date?: string
  }) =>
    runTool(async () => {
      const body = JSON.stringify({
        name: args.name,
        base_version_id: args.base_version_id ?? null,
        release_date: args.release_date ?? null,
      })
      const res = await devatlasRequest(
        `/projects/${args.project_id}/versions`,
        { method: `POST`, body },
      )
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `fork_version`,
  {
    description: `Copy an existing version into a new one (deep copy of all nodes and edges).`,
    inputSchema: z.object({
      version_id: UUID,
      name: z.string().min(1),
      release_date: z.string().optional(),
    }),
  },
  async (args: { version_id: string; name: string; release_date?: string }) =>
    runTool(async () => {
      const body = JSON.stringify({
        name: args.name,
        release_date: args.release_date ?? null,
      })
      const res = await devatlasRequest(`/versions/${args.version_id}/fork`, {
        method: `POST`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_version`,
  {
    description: `Patch version name or release_date.`,
    inputSchema: z.object({
      version_id: UUID,
      name: z.string().optional(),
      release_date: z.string().optional(),
    }),
  },
  async (args: { version_id: string; name?: string; release_date?: string }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.name !== undefined) patch.name = args.name
      if (args.release_date !== undefined) patch.release_date = args.release_date
      const res = await devatlasRequest(`/versions/${args.version_id}`, {
        method: `PATCH`,
        body: JSON.stringify(patch),
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_version`,
  {
    description: `Delete a version and all its nodes/edges.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

server.registerTool(
  `compare_versions`,
  {
    description: `Diff two versions — returns added/removed/changed nodes and edges.`,
    inputSchema: z.object({ version_a: UUID, version_b: UUID }),
  },
  async (args: { version_a: string; version_b: string }) =>
    runTool(async () => {
      const q = `version_a=${args.version_a}&version_b=${args.version_b}`
      const res = await devatlasRequest(`/versions/diff?${q}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Nodes
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_nodes`,
  {
    description: `List all architecture nodes for a version. Returns id, title, type, position, parent_id, metadata_.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}/nodes`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `get_node`,
  {
    description: `Get a single node by UUID.`,
    inputSchema: z.object({ node_id: UUID }),
  },
  async (args: { node_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/nodes/${args.node_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

const metadataSchema = z.record(z.string(), z.unknown()).optional()

server.registerTool(
  `create_node`,
  {
    description:
      `Create a node in a version.\n\n` +
      `type — concept types: Program | Capability | Feature | Policy | External. ` +
      `Infrastructure types: backend | frontend | database | storage | cache | api | service | ` +
      `gateway | broker | queue | function | worker | cloud-service | auth-service | network | device.\n\n` +
      `Visual area/container: group — renders as a resizable box that other nodes can be placed inside. ` +
      `For group nodes set metadata_: { width: <px>, height: <px> } (e.g. 400×300). ` +
      `After creating a group, set child nodes' parent_id to the group UUID.\n\n` +
      COORD_NOTE,
    inputSchema: z.object({
      version_id: UUID,
      title: z.string().min(1),
      type: z.string().min(1),
      position: z.object({ x: z.number(), y: z.number() }).optional(),
      metadata_: metadataSchema,
      parent_id: UUID.optional().nullable().describe(
        `Set to a group node's UUID to nest this node inside that group. ` +
        `Position then becomes relative to the group's top-left corner.`,
      ),
      reason: z.string().optional(),
      author: z.string().optional(),
    }),
  },
  async (args: {
    version_id: string
    title: string
    type: string
    position?: { x: number; y: number }
    metadata_?: Record<string, unknown>
    parent_id?: string | null
    reason?: string
    author?: string
  }) =>
    runTool(async () => {
      const body = JSON.stringify({
        title: args.title,
        type: args.type,
        position: args.position ?? { x: 0, y: 0 },
        metadata_: args.metadata_ ?? {},
        parent_id: args.parent_id ?? null,
        reason: args.reason ?? ``,
        author: args.author ?? `mcp`,
      })
      const res = await devatlasRequest(`/versions/${args.version_id}/nodes`, {
        method: `POST`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_node`,
  {
    description:
      `Patch node fields (title / type / position / metadata_ / parent_id).\n\n` +
      COORD_NOTE,
    inputSchema: z.object({
      node_id: UUID,
      title: z.string().optional(),
      type: z.string().optional(),
      position: z.object({ x: z.number(), y: z.number() }).optional(),
      metadata_: metadataSchema,
      parent_id: UUID.optional().nullable(),
      reason: z.string().optional(),
      author: z.string().optional(),
    }),
  },
  async (args: {
    node_id: string
    title?: string
    type?: string
    position?: { x: number; y: number }
    metadata_?: Record<string, unknown>
    parent_id?: string | null
    reason?: string
    author?: string
  }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.title !== undefined) patch.title = args.title
      if (args.type !== undefined) patch.type = args.type
      if (args.position !== undefined) patch.position = args.position
      if (args.metadata_ !== undefined) patch.metadata_ = args.metadata_
      if (args.parent_id !== undefined) patch.parent_id = args.parent_id
      patch.reason = args.reason ?? ``
      patch.author = args.author ?? `mcp`
      const res = await devatlasRequest(`/nodes/${args.node_id}`, {
        method: `PATCH`,
        body: JSON.stringify(patch),
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_node`,
  {
    description: `Delete a node (and any edges connected to it).`,
    inputSchema: z.object({
      node_id: UUID,
      reason: z.string().optional(),
      author: z.string().optional(),
    }),
  },
  async (args: { node_id: string; reason?: string; author?: string }) =>
    runTool(async () => {
      const qs = new URLSearchParams({
        reason: args.reason ?? ``,
        author: args.author ?? `mcp`,
      })
      const res = await devatlasRequest(`/nodes/${args.node_id}?${qs}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Edges
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_edges`,
  {
    description: `List all edges for a version. Returns id, source_id, target_id, relation_type.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}/edges`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(applyEdgeTrim(await readJsonSafe(res)))
    }),
)

server.registerTool(
  `get_edge`,
  {
    description: `Get a single edge by UUID.`,
    inputSchema: z.object({ edge_id: UUID }),
  },
  async (args: { edge_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/edges/${args.edge_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(applyEdgeTrim(await readJsonSafe(res)))
    }),
)

server.registerTool(
  `create_edge`,
  {
    description:
      `Connect two nodes with a directed edge.\n\n` +
      `Before calling: call list_nodes(version_id) to get all node IDs at once, ` +
      `or search(q="node name", type="nodes") for a specific node. ` +
      `If you just created a node, its id is in the create_node response — use that directly. ` +
      `Never guess UUIDs; an unknown ID returns 404.\n\n` +
      `relation_type: ${RELATION_TYPE_DESC}`,
    inputSchema: z.object({
      version_id: UUID,
      source_id: UUID,
      target_id: UUID,
      relation_type: z.string().optional().describe(RELATION_TYPE_DESC),
    }),
  },
  async (args: {
    version_id: string
    source_id: string
    target_id: string
    relation_type?: string
  }) =>
    runTool(async () => {
      const body = JSON.stringify({
        source_id: args.source_id,
        target_id: args.target_id,
        relation_type: args.relation_type ?? `depends_on`,
      })
      const res = await devatlasRequest(`/versions/${args.version_id}/edges`, {
        method: `POST`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(applyEdgeTrim(await readJsonSafe(res)))
    }),
)

server.registerTool(
  `update_edge`,
  {
    description:
      `Change an edge's relation_type without deleting and recreating it.\n\n` +
      `relation_type: ${RELATION_TYPE_DESC}`,
    inputSchema: z.object({
      edge_id: UUID,
      relation_type: z.string().describe(RELATION_TYPE_DESC),
    }),
  },
  async (args: { edge_id: string; relation_type: string }) =>
    runTool(async () => {
      const body = JSON.stringify({ relation_type: args.relation_type })
      const res = await devatlasRequest(`/edges/${args.edge_id}`, {
        method: `PATCH`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(applyEdgeTrim(await readJsonSafe(res)))
    }),
)

server.registerTool(
  `delete_edge`,
  {
    description: `Delete an edge by UUID.`,
    inputSchema: z.object({ edge_id: UUID }),
  },
  async (args: { edge_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/edges/${args.edge_id}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Search
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `search`,
  {
    description:
      `Full-text search across nodes, documents, and versions.\n\n` +
      `Primary use case: resolve a node name to its UUID before calling create_edge or update_node. ` +
      `Use type="nodes" to filter to nodes only. Results include id, title, type, version_id.\n\n` +
      `type: all | nodes | documents | versions`,
    inputSchema: z.object({
      q: z.string().min(1),
      project_id: UUID.optional(),
      type: z.enum([`all`, `nodes`, `documents`, `versions`]).optional(),
    }),
  },
  async (args: {
    q: string
    project_id?: string
    type?: `all` | `nodes` | `documents` | `versions`
  }) =>
    runTool(async () => {
      const qs = new URLSearchParams({
        q: args.q,
        type: args.type ?? `all`,
      })
      if (args.project_id) qs.set(`project_id`, args.project_id)
      const res = await devatlasRequest(`/search?${qs}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Documents
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_version_documents`,
  {
    description: `List documents linked to a version.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}/documents`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `list_node_documents`,
  {
    description: `List documents linked to a node.`,
    inputSchema: z.object({ node_id: UUID }),
  },
  async (args: { node_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/nodes/${args.node_id}/documents`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `get_document`,
  {
    description: `Fetch document metadata (includes content_url when applicable).`,
    inputSchema: z.object({ doc_id: UUID }),
  },
  async (args: { doc_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/documents/${args.doc_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `upload_document`,
  {
    description:
      `Upload a local file as a document (multipart). ` +
      `doc type values: planning | policy | technical | api | adr`,
    inputSchema: z.object({
      project_id: UUID,
      type: z.string().min(1),
      title: z.string().min(1),
      file_path: z.string().min(1),
      version_id: UUID.optional().nullable(),
      linked_node_ids: z.array(UUID).optional(),
    }),
  },
  async (args: {
    project_id: string
    type: string
    title: string
    file_path: string
    version_id?: string | null
    linked_node_ids?: string[]
  }) =>
    runTool(async () => {
      const { readFile } = await import(`fs/promises`)
      const { basename } = await import(`path`)
      const fileBytes = await readFile(args.file_path)
      const fileName = basename(args.file_path)
      const form = new FormData()
      form.append(`project_id`, args.project_id)
      form.append(`type`, args.type)
      form.append(`title`, args.title)
      if (args.version_id) form.append(`version_id`, args.version_id)
      form.append(
        `linked_node_ids`,
        JSON.stringify(args.linked_node_ids ?? []),
      )
      form.append(`file`, new Blob([fileBytes]), fileName)
      const res = await devatlasRequest(`/documents/upload`, {
        method: `POST`,
        body: form,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_document`,
  {
    description:
      `Create a document record without file upload. ` +
      `doc type values: planning | policy | technical | api | adr`,
    inputSchema: z.object({
      project_id: UUID,
      type: z.string().min(1),
      title: z.string().min(1),
      version_id: UUID.optional().nullable(),
      linked_node_ids: z.array(UUID).optional(),
    }),
  },
  async (args: {
    project_id: string
    type: string
    title: string
    version_id?: string | null
    linked_node_ids?: string[]
  }) =>
    runTool(async () => {
      const body = JSON.stringify({
        project_id: args.project_id,
        version_id: args.version_id ?? null,
        type: args.type,
        title: args.title,
        linked_node_ids: args.linked_node_ids ?? [],
      })
      const res = await devatlasRequest(`/documents`, { method: `POST`, body })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `write_document`,
  {
    description:
      `Create a document with inline markdown content — no local file required. ` +
      `Use this to write a single document from text you already have. ` +
      `For bulk (one doc per node), use create_idea_documents instead.\n\n` +
      `doc type values: planning | policy | technical | api | adr`,
    inputSchema: z.object({
      project_id: UUID,
      type: z.string().min(1),
      title: z.string().min(1),
      content: z.string().min(1).describe(`Markdown content for the document`),
      version_id: UUID.optional().nullable(),
      linked_node_ids: z.array(UUID).optional(),
    }),
  },
  async (args: {
    project_id: string
    type: string
    title: string
    content: string
    version_id?: string | null
    linked_node_ids?: string[]
  }) =>
    runTool(async () => {
      const bytes = new TextEncoder().encode(args.content)
      const form = new FormData()
      form.append(`project_id`, args.project_id)
      form.append(`type`, args.type)
      form.append(`title`, args.title)
      if (args.version_id) form.append(`version_id`, args.version_id)
      form.append(`linked_node_ids`, JSON.stringify(args.linked_node_ids ?? []))
      form.append(
        `file`,
        new Blob([bytes], { type: `text/markdown` }),
        `${args.title.replace(/\s+/g, `-`)}.md`,
      )
      const res = await devatlasRequest(`/documents/upload`, {
        method: `POST`,
        body: form,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_document`,
  {
    description: `Patch document title / type / version_id / linked_node_ids.`,
    inputSchema: z.object({
      doc_id: UUID,
      title: z.string().optional(),
      type: z.string().optional(),
      version_id: UUID.optional().nullable(),
      linked_node_ids: z.array(UUID).optional(),
    }),
  },
  async (args: {
    doc_id: string
    title?: string
    type?: string
    version_id?: string | null
    linked_node_ids?: string[]
  }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.title !== undefined) patch.title = args.title
      if (args.type !== undefined) patch.type = args.type
      if (args.version_id !== undefined) patch.version_id = args.version_id
      if (args.linked_node_ids !== undefined)
        patch.linked_node_ids = args.linked_node_ids
      const res = await devatlasRequest(`/documents/${args.doc_id}`, {
        method: `PATCH`,
        body: JSON.stringify(patch),
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_document`,
  {
    description: `Delete a document record.`,
    inputSchema: z.object({ doc_id: UUID }),
  },
  async (args: { doc_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/documents/${args.doc_id}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

server.registerTool(
  `create_idea_documents`,
  {
    description:
      `아이디어 텍스트를 받아 버전 전체 개요 문서 1개와 노드별 문서를 일괄 생성하고 각 노드에 연결합니다.\n\n` +
      `권장 호출 순서:\n` +
      `1. list_nodes(version_id) 로 버전의 모든 노드 조회\n` +
      `2. 아이디어를 바탕으로 overall_doc(전체 개요 마크다운)과 각 노드별 node_docs 마크다운 생성\n` +
      `3. 이 도구를 한 번 호출해 모든 문서를 업로드하고 노드에 연결\n\n` +
      `문서 타입(type) 기본값은 "planning"입니다.`,
    inputSchema: z.object({
      project_id: UUID,
      version_id: UUID,
      overall_doc: z.object({
        title: z.string().min(1).describe(`전체 버전/아이디어 개요 문서 제목`),
        content: z.string().min(1).describe(`전체 개요 마크다운 내용`),
      }),
      node_docs: z
        .array(
          z.object({
            node_id: UUID,
            title: z.string().min(1),
            content: z.string().min(1).describe(`해당 노드에 대한 마크다운 내용`),
          }),
        )
        .describe(`문서를 생성할 노드 목록 (노드당 1개)`),
    }),
  },
  async (args: {
    project_id: string
    version_id: string
    overall_doc: { title: string; content: string }
    node_docs: Array<{ node_id: string; title: string; content: string }>
  }) =>
    runTool(async () => {
      const results: Array<{
        type: string
        title: string
        doc_id: string
        node_id?: string
      }> = []
      const errors: Array<{ title: string; error: string }> = []

      async function uploadMarkdown(
        title: string,
        content: string,
        linkedNodeIds: string[],
      ): Promise<{ id: string } | null> {
        const bytes = new TextEncoder().encode(content)
        const form = new FormData()
        form.append(`project_id`, args.project_id)
        form.append(`type`, `planning`)
        form.append(`title`, title)
        form.append(`version_id`, args.version_id)
        form.append(`linked_node_ids`, JSON.stringify(linkedNodeIds))
        form.append(
          `file`,
          new Blob([bytes], { type: `text/markdown` }),
          `${title.replace(/\s+/g, `-`)}.md`,
        )
        const res = await devatlasRequest(`/documents/upload`, {
          method: `POST`,
          body: form,
        })
        if (!res.ok) {
          errors.push({ title, error: await apiErrorBody(res) })
          return null
        }
        return (await readJsonSafe(res)) as { id: string } | null
      }

      const overallResult = await uploadMarkdown(
        args.overall_doc.title,
        args.overall_doc.content,
        [],
      )
      if (overallResult) {
        results.push({ type: `overall`, title: args.overall_doc.title, doc_id: overallResult.id })
      }

      await Promise.all(
        args.node_docs.map(async (nd) => {
          const result = await uploadMarkdown(nd.title, nd.content, [nd.node_id])
          if (result) {
            results.push({ type: `node`, title: nd.title, doc_id: result.id, node_id: nd.node_id })
          }
        }),
      )

      return okJson({
        created_count: results.length,
        error_count: errors.length,
        created: results,
        ...(errors.length > 0 ? { errors } : {}),
      })
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Policies
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_policies`,
  {
    description: `List all policies for a project. Policies are architectural constraints that apply to nodes.\n\nseverity: critical | major | minor\nstatus: active | deprecated`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/${args.project_id}/policies`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_policy`,
  {
    description: `Create an architectural policy for a project.\n\nseverity: critical | major | minor`,
    inputSchema: z.object({
      project_id: UUID,
      title: z.string().min(1),
      description: z.string().optional(),
      severity: z.enum([`critical`, `major`, `minor`]).optional(),
    }),
  },
  async (args: { project_id: string; title: string; description?: string; severity?: string }) =>
    runTool(async () => {
      const body = JSON.stringify({ title: args.title, description: args.description, severity: args.severity ?? `major` })
      const res = await devatlasRequest(`/projects/${args.project_id}/policies`, { method: `POST`, body })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_policy`,
  {
    description: `Update a policy's title, description, severity, or status (active | deprecated).`,
    inputSchema: z.object({
      policy_id: UUID,
      title: z.string().optional(),
      description: z.string().optional(),
      severity: z.enum([`critical`, `major`, `minor`]).optional(),
      status: z.enum([`active`, `deprecated`]).optional(),
    }),
  },
  async (args: { policy_id: string; title?: string; description?: string; severity?: string; status?: string }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.title !== undefined) patch.title = args.title
      if (args.description !== undefined) patch.description = args.description
      if (args.severity !== undefined) patch.severity = args.severity
      if (args.status !== undefined) patch.status = args.status
      const res = await devatlasRequest(`/policies/${args.policy_id}`, { method: `PATCH`, body: JSON.stringify(patch) })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_policy`,
  {
    description: `Delete a policy permanently. Consider using update_policy to set status=deprecated instead.`,
    inputSchema: z.object({ policy_id: UUID }),
  },
  async (args: { policy_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/policies/${args.policy_id}`, { method: `DELETE` })
      if (!res.ok && res.status !== 204) return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

server.registerTool(
  `set_policy_nodes`,
  {
    description: `Link a policy to a set of nodes (replaces existing links). Pass an empty array to unlink all nodes.\n\nBefore calling: use search(q="name", type="nodes") to resolve node IDs.`,
    inputSchema: z.object({
      policy_id: UUID,
      node_ids: z.array(UUID),
    }),
  },
  async (args: { policy_id: string; node_ids: string[] }) =>
    runTool(async () => {
      const body = JSON.stringify({ node_ids: args.node_ids })
      const res = await devatlasRequest(`/policies/${args.policy_id}/nodes`, { method: `PUT`, body })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Roadmap
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `list_roadmap`,
  {
    description:
      `List all roadmap items for a project, ordered by priority then sort_order.\n\n` +
      `priority: p1|p2|p3|p4  ·  status: todo|in_progress|done  ·  size: XS|S|M|L|XL`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/projects/${args.project_id}/roadmap`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_roadmap_item`,
  {
    description:
      `Add a roadmap item to a project.\n\n` +
      `priority: p1 (immediate) | p2 (next) | p3 (later) | p4 (someday)\n` +
      `size: XS | S | M | L | XL\n` +
      `status: todo | in_progress | done\n` +
      `category: 서비스/팀 이름 (예: "AKW", "GitTrack", "Portal", "공통")`,
    inputSchema: z.object({
      project_id: UUID,
      priority: z.enum([`p1`, `p2`, `p3`, `p4`]).default(`p3`),
      category: z.string().min(1).default(`공통`),
      title: z.string().min(1),
      description: z.string().optional(),
      size: z.enum([`XS`, `S`, `M`, `L`, `XL`]).default(`M`),
      status: z.enum([`todo`, `in_progress`, `done`]).default(`todo`),
    }),
  },
  async (args: {
    project_id: string
    priority: string
    category: string
    title: string
    description?: string
    size: string
    status: string
  }) =>
    runTool(async () => {
      const body = JSON.stringify({
        priority: args.priority,
        category: args.category,
        title: args.title,
        description: args.description ?? null,
        size: args.size,
        status: args.status,
      })
      const res = await devatlasRequest(`/projects/${args.project_id}/roadmap`, {
        method: `POST`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_roadmap_item`,
  {
    description: `Update a roadmap item's fields. Only provided fields are changed.`,
    inputSchema: z.object({
      item_id: UUID,
      priority: z.enum([`p1`, `p2`, `p3`, `p4`]).optional(),
      category: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      size: z.enum([`XS`, `S`, `M`, `L`, `XL`]).optional(),
      status: z.enum([`todo`, `in_progress`, `done`]).optional(),
    }),
  },
  async (args: {
    item_id: string
    priority?: string
    category?: string
    title?: string
    description?: string
    size?: string
    status?: string
  }) =>
    runTool(async () => {
      const patch: Record<string, unknown> = {}
      if (args.priority !== undefined) patch.priority = args.priority
      if (args.category !== undefined) patch.category = args.category
      if (args.title !== undefined) patch.title = args.title
      if (args.description !== undefined) patch.description = args.description
      if (args.size !== undefined) patch.size = args.size
      if (args.status !== undefined) patch.status = args.status
      const res = await devatlasRequest(`/roadmap/${args.item_id}`, {
        method: `PATCH`,
        body: JSON.stringify(patch),
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_roadmap_item`,
  {
    description: `Delete a roadmap item permanently. Consider update_roadmap_item(status="done") instead if you want to keep history.`,
    inputSchema: z.object({ item_id: UUID }),
  },
  async (args: { item_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/roadmap/${args.item_id}`, {
        method: `DELETE`,
      })
      if (!res.ok && res.status !== 204)
        return errResult(await apiErrorBody(res), res.status)
      return okJson({ ok: true })
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Document content reader
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `read_document`,
  {
    description:
      `Read the actual text/markdown content of a document.\n\n` +
      `Typical usage: list_version_documents or list_node_documents → pick a doc_id → read_document.\n` +
      `Returns raw text (usually markdown). Returns empty string if no content uploaded yet.`,
    inputSchema: z.object({ doc_id: UUID }),
  },
  async (args: { doc_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/documents/${args.doc_id}/raw`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      const text = await res.text()
      return okJson(text)
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Project overview (manager shortcut)
// ═════════════════════════════════════════════════════════════════════════

server.registerTool(
  `project_overview`,
  {
    description:
      `관리자/AI 파악용: 프로젝트 전체 현황을 한 번에 조회합니다.\n\n` +
      `반환 내용:\n` +
      `· project — 프로젝트 기본 정보\n` +
      `· versions — 버전 목록 (각 버전의 node_count, edge_count, doc_count 포함)\n` +
      `· roadmap — 전체 로드맵 항목 (p1~p4 우선순위별)\n` +
      `· policies — 아키텍처 정책 목록\n` +
      `· node_summary — 최신 버전의 노드 이름 목록 (최대 50개)\n\n` +
      `이 도구 하나로 프로젝트 현황을 파악한 후 세부 조회나 편집 도구를 사용하세요.`,
    inputSchema: z.object({ project_id: UUID }),
  },
  async (args: { project_id: string }) =>
    runTool(async () => {
      const [projectRes, versionsRes, roadmapRes, policiesRes] = await Promise.all([
        devatlasRequest(`/projects/${args.project_id}`),
        devatlasRequest(`/projects/${args.project_id}/versions`),
        devatlasRequest(`/projects/${args.project_id}/roadmap`),
        devatlasRequest(`/projects/${args.project_id}/policies`),
      ])

      if (!projectRes.ok) return errResult(await apiErrorBody(projectRes), projectRes.status)
      if (!versionsRes.ok) return errResult(await apiErrorBody(versionsRes), versionsRes.status)

      const project = await readJsonSafe(projectRes)
      const versions = (await readJsonSafe(versionsRes)) as Array<{ id: string; name: string }> | null ?? []
      const roadmap = (await readJsonSafe(roadmapRes)) as unknown[] | null ?? []
      const policies = policiesRes.ok ? ((await readJsonSafe(policiesRes)) as unknown[] | null ?? []) : []

      // Fetch node/edge/doc counts for each version in parallel (use latest version for node summary)
      const versionDetails = await Promise.all(
        versions.map(async (v) => {
          const [nRes, eRes, dRes] = await Promise.all([
            devatlasRequest(`/versions/${v.id}/nodes`),
            devatlasRequest(`/versions/${v.id}/edges`),
            devatlasRequest(`/versions/${v.id}/documents`),
          ])
          const nodes = nRes.ok ? ((await readJsonSafe(nRes)) as Array<{ id: string; title: string; type: string }> | null ?? []) : []
          const edges = eRes.ok ? ((await readJsonSafe(eRes)) as unknown[] | null ?? []) : []
          const docs = dRes.ok ? ((await readJsonSafe(dRes)) as Array<{ id: string; title: string }> | null ?? []) : []
          return { id: v.id, name: v.name, nodes, edges, docs }
        }),
      )

      // Latest version = last in list (or pick highest created_at if needed)
      const latest = versionDetails[versionDetails.length - 1]

      const overview = {
        project,
        versions: versionDetails.map(v => ({
          id: v.id,
          name: v.name,
          node_count: v.nodes.length,
          edge_count: v.edges.length,
          doc_count: v.docs.length,
        })),
        roadmap_by_priority: {
          p1: (roadmap as Array<{ priority: string }>).filter(i => i.priority === `p1`),
          p2: (roadmap as Array<{ priority: string }>).filter(i => i.priority === `p2`),
          p3: (roadmap as Array<{ priority: string }>).filter(i => i.priority === `p3`),
          p4: (roadmap as Array<{ priority: string }>).filter(i => i.priority === `p4`),
        },
        roadmap_total: roadmap.length,
        policies,
        latest_version: latest
          ? {
              id: latest.id,
              name: latest.name,
              node_summary: latest.nodes.slice(0, 50).map(n => `${n.id}:${n.title} (${n.type})`),
              doc_list: latest.docs.map(d => `${d.id}:${d.title}`),
            }
          : null,
      }

      return okJson(overview)
    }),
)

// ═════════════════════════════════════════════════════════════════════════
// Resources
// ═════════════════════════════════════════════════════════════════════════

const versionSummaryTemplate = new ResourceTemplate(
  `devatlas://versions/{version_id}/summary`,
  { list: undefined },
)

server.registerResource(
  `version_summary`,
  versionSummaryTemplate,
  {
    description: `Compact JSON overview: node/edge/doc counts + first 30 node id:title pairs.`,
    mimeType: `application/json`,
  },
  async (uri: URL, variables: { version_id?: string }) => {
    const versionId = variables.version_id
    if (!versionId) throw new Error(`Missing version_id in ${uri}`)

    const vRes = await devatlasRequest(`/versions/${versionId}`)
    if (!vRes.ok) throw new Error(await apiErrorBody(vRes))
    const version = await readJsonSafe(vRes)

    const [nRes, eRes, dRes] = await Promise.all([
      devatlasRequest(`/versions/${versionId}/nodes`),
      devatlasRequest(`/versions/${versionId}/edges`),
      devatlasRequest(`/versions/${versionId}/documents`),
    ])
    if (!nRes.ok) throw new Error(await apiErrorBody(nRes))
    if (!eRes.ok) throw new Error(await apiErrorBody(eRes))
    if (!dRes.ok) throw new Error(await apiErrorBody(dRes))

    const nodes = (await readJsonSafe(nRes)) as { id?: string }[] | null
    const edges = (await readJsonSafe(eRes)) as unknown[] | null
    const docs = (await readJsonSafe(dRes)) as unknown[] | null

    const summary = {
      version_id: versionId,
      version,
      node_count: Array.isArray(nodes) ? nodes.length : 0,
      edge_count: Array.isArray(edges) ? edges.length : 0,
      document_count: Array.isArray(docs) ? docs.length : 0,
      node_titles_preview: Array.isArray(nodes)
        ? nodes.slice(0, 30).map((n) =>
            typeof n === `object` && n && `title` in n
              ? `${String((n as { id: unknown }).id)}:${String((n as { title: unknown }).title)}`
              : JSON.stringify(n),
          )
        : [],
    }

    const text = JSON.stringify(summary, null, 2)
    return {
      contents: [{ uri: uri.toString(), text, mimeType: `application/json` }],
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
