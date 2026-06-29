import client from './client'

export interface Policy {
  id: string
  project_id: string
  title: string
  description: string | null
  severity: 'critical' | 'major' | 'minor'
  status: 'active' | 'deprecated'
  created_at: string
  updated_at: string
  node_ids: string[]
}

export const policiesApi = {
  list: (projectId: string) =>
    client.get<Policy[]>(`/projects/${projectId}/policies`).then(r => r.data),
  get: (id: string) =>
    client.get<Policy>(`/policies/${id}`).then(r => r.data),
  create: (projectId: string, data: { title: string; description?: string; severity?: string }) =>
    client.post<Policy>(`/projects/${projectId}/policies`, data).then(r => r.data),
  update: (id: string, data: Partial<{ title: string; description: string; severity: string; status: string }>) =>
    client.patch<Policy>(`/policies/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    client.delete(`/policies/${id}`),
  setNodes: (id: string, nodeIds: string[]) =>
    client.put<Policy>(`/policies/${id}/nodes`, { node_ids: nodeIds }).then(r => r.data),
}
