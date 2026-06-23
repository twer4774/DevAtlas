import type { Version, DiffResult } from '@/types'
import client from './client'

export const versionsApi = {
  list: (projectId: string) =>
    client.get<Version[]>(`/projects/${projectId}/versions`).then((r) => r.data),
  get: (id: string) => client.get<Version>(`/versions/${id}`).then((r) => r.data),
  create: (projectId: string, data: { name: string; base_version_id?: string; release_date?: string }) =>
    client.post<Version>(`/projects/${projectId}/versions`, data).then((r) => r.data),
  fork: (versionId: string, data: { name: string; release_date?: string }) =>
    client.post<Version>(`/versions/${versionId}/fork`, data).then((r) => r.data),
  diff: (versionA: string, versionB: string) =>
    client.get<DiffResult>(`/versions/diff?version_a=${versionA}&version_b=${versionB}`).then((r) => r.data),
}
