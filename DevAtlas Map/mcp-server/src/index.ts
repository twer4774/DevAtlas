#!/usr/bin/env node
/**
 * DevAtlas Map MCP server — wraps the AKW FastAPI REST API for Cursor/other MCP clients.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod/v4"

import { apiErrorBody, devatlasRequest } from "./http.js"

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

const server = new McpServer(
  { name: `devatlas-map`, version: `0.1.0` },
  {
    instructions:
      `This server controls DevAtlas Map (AKW) via HTTP. Configure DEVATLAS_API_BASE (default http://127.0.0.1:8000). ` +
      `If the API is secured, set DEVATLAS_API_TOKEN to match the backend's DEVATLAS_API_TOKEN. ` +
      `Use list_projects → list_versions → list_nodes/create_node as typical flow.`,
  },
)

// ----- Projects -----
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
    description: `Create project (creator required per API schema).`,
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
  async (args: {
    project_id: string
    name?: string
    description?: string
  }) =>
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
    description: `Delete project (no body returned).`,
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

// ----- Versions -----
server.registerTool(
  `list_versions`,
  {
    description: `List versions of a project.`,
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
    description: `Get single version.`,
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
    description: `Create a new version.`,
    inputSchema: z.object({
      project_id: UUID,
      name: z.string().min(1),
      base_version_id: UUID.optional(),
      /** ISO date "YYYY-MM-DD" */
      release_date: z.string().optional(),
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
    description: `Fork an existing version into a new one.`,
    inputSchema: z.object({
      version_id: UUID,
      name: z.string().min(1),
      release_date: z.string().optional(),
    }),
  },
  async (args: {
    version_id: string
    name: string
    release_date?: string
  }) =>
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
  `compare_versions`,
  {
    description: `Diff two versions (nodes + edges).`,
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
    description: `Delete a version (no body returned).`,
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

// ----- Nodes -----
server.registerTool(
  `list_nodes`,
  {
    description: `List architecture nodes for a map version.`,
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
    description: `Get a single node.`,
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
    description: `Create a node in a version. Use parent_id for group children. metadata_ uses key "metadata_" in JSON body per API.`,
    inputSchema: z.object({
      version_id: UUID,
      title: z.string().min(1),
      type: z.string().min(1),
      position: z.object({ x: z.number(), y: z.number() }).optional(),
      metadata_: metadataSchema,
      parent_id: UUID.optional().nullable(),
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
    description: `Patch node (title/type/position/metadata_/parent_id).`,
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
    description: `Delete node. Optional reason/author query params.`,
    inputSchema: z.object({
      node_id: UUID,
      reason: z.string().optional(),
      author: z.string().optional(),
    }),
  },
  async (args: {
    node_id: string
    reason?: string
    author?: string
  }) =>
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

// ----- Edges -----
server.registerTool(
  `list_edges`,
  {
    description: `List edges for a version.`,
    inputSchema: z.object({ version_id: UUID }),
  },
  async (args: { version_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/versions/${args.version_id}/edges`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `create_edge`,
  {
    description: `Connect two nodes (relation_type defaults to depends_on).`,
    inputSchema: z.object({
      version_id: UUID,
      source_id: UUID,
      target_id: UUID,
      relation_type: z.string().optional(),
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
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `get_edge`,
  {
    description: `Get a single edge by id.`,
    inputSchema: z.object({ edge_id: UUID }),
  },
  async (args: { edge_id: string }) =>
    runTool(async () => {
      const res = await devatlasRequest(`/edges/${args.edge_id}`)
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `delete_edge`,
  {
    description: `Delete edge by id.`,
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

// ----- Search -----
server.registerTool(
  `search`,
  {
    description: `Search nodes/documents/versions. type=all|nodes|documents|versions`,
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

// ----- Documents -----
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
    description: `Fetch document metadata (includes presigned-ish content_url when applicable).`,
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
    description: `Upload a file as a new document (multipart). Reads file_path from local disk and POSTs to /documents/upload.`,
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
    description: `Create a document record without file upload.`,
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
  `link_document_to_nodes`,
  {
    description: `Patch linked_node_ids (replaces entire list).`,
    inputSchema: z.object({
      doc_id: UUID,
      linked_node_ids: z.array(UUID),
    }),
  },
  async (args: { doc_id: string; linked_node_ids: string[] }) =>
    runTool(async () => {
      const body = JSON.stringify({
        linked_node_ids: args.linked_node_ids,
      })
      const res = await devatlasRequest(`/documents/${args.doc_id}`, {
        method: `PATCH`,
        body,
      })
      if (!res.ok) return errResult(await apiErrorBody(res), res.status)
      return okJson(await readJsonSafe(res))
    }),
)

server.registerTool(
  `update_document`,
  {
    description: `Patch document title/type/version_id.`,
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
    description: `Delete document record.`,
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

      // 1. 전체 개요 문서
      const overallResult = await uploadMarkdown(
        args.overall_doc.title,
        args.overall_doc.content,
        [],
      )
      if (overallResult) {
        results.push({
          type: `overall`,
          title: args.overall_doc.title,
          doc_id: overallResult.id,
        })
      }

      // 2. 노드별 문서 (병렬 업로드)
      await Promise.all(
        args.node_docs.map(async (nd) => {
          const result = await uploadMarkdown(nd.title, nd.content, [nd.node_id])
          if (result) {
            results.push({
              type: `node`,
              title: nd.title,
              doc_id: result.id,
              node_id: nd.node_id,
            })
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

// ----- Resource: version summary -----
const versionSummaryTemplate = new ResourceTemplate(
  `devatlas://versions/{version_id}/summary`,
  { list: undefined },
)

server.registerResource(
  `version_summary`,
  versionSummaryTemplate,
  {
    description: `Minimal JSON overview: node/edge/doc counts per version.`,
    mimeType: `application/json`,
  },
  async (uri: URL, variables: { version_id?: string }) => {
    const versionId = variables.version_id
    if (!versionId) {
      throw new Error(`Missing version_id in ${uri}`)
    }
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
