import type { NodeEdge } from '@/types'
import client from './client'

export const edgesApi = {
  list: (versionId: string) =>
    client.get<NodeEdge[]>(`/versions/${versionId}/edges`).then((r) => r.data),
  create: (versionId: string, data: { source_id: string; target_id: string; relation_type: string }) =>
    client.post<NodeEdge>(`/versions/${versionId}/edges`, data).then((r) => r.data),
  update: (id: string, data: { relation_type: string }) =>
    client.patch<NodeEdge>(`/edges/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/edges/${id}`),
}
