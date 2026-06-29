import type { ArchitectureNode } from '@/types'
import client from './client'

export const nodesApi = {
  list: (versionId: string) =>
    client.get<ArchitectureNode[]>(`/versions/${versionId}/nodes`).then((r) => r.data),
  get: (id: string) => client.get<ArchitectureNode>(`/nodes/${id}`).then((r) => r.data),
  create: (versionId: string, data: {
    title: string
    type: string
    position?: { x: number; y: number }
    metadata_?: Record<string, unknown>
    parent_id?: string | null
    reason?: string
    author?: string
  }) => client.post<ArchitectureNode>(`/versions/${versionId}/nodes`, data).then((r) => r.data),
  update: (id: string, data: {
    title?: string
    type?: string
    position?: { x: number; y: number }
    metadata_?: Record<string, unknown>
    parent_id?: string | null
    reason?: string
    author?: string
  }) => client.patch<ArchitectureNode>(`/nodes/${id}`, data).then((r) => r.data),
  delete: (id: string, reason?: string, author?: string) =>
    client.delete(`/nodes/${id}?reason=${reason ?? ''}&author=${author ?? 'unknown'}`),
}
