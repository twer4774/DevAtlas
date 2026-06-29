import type { Project } from '@/types'
import client from './client'

export const projectsApi = {
  list: () => client.get<Project[]>('/projects/').then((r) => r.data),
  get: (id: string) => client.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; creator: string }) =>
    client.post<Project>('/projects/', data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string }) =>
    client.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/projects/${id}`),
}
