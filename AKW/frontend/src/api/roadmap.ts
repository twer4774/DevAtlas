import client from './client'

export interface RoadmapItem {
  id: string
  project_id: string
  version_id: string | null
  priority: 'p1' | 'p2' | 'p3' | 'p4'
  category: string
  title: string
  description: string | null
  size: 'XS' | 'S' | 'M' | 'L' | 'XL'
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type RoadmapItemCreate = Pick<RoadmapItem, 'priority' | 'category' | 'title' | 'size' | 'status'> & {
  description?: string
  sort_order?: number
  version_id?: string | null
}

export type RoadmapItemUpdate = Partial<Omit<RoadmapItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>>

export const roadmapApi = {
  list: (projectId: string, versionId?: string | null) => {
    const params = versionId ? { version_id: versionId } : {}
    return client.get<RoadmapItem[]>(`/projects/${projectId}/roadmap`, { params }).then(r => r.data)
  },
  create: (projectId: string, data: RoadmapItemCreate) =>
    client.post<RoadmapItem>(`/projects/${projectId}/roadmap`, data).then(r => r.data),
  update: (id: string, data: RoadmapItemUpdate) =>
    client.patch<RoadmapItem>(`/roadmap/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    client.delete(`/roadmap/${id}`),
}
