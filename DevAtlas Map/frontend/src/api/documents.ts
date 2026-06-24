import type { Document } from '@/types'
import client from './client'

export const documentsApi = {
  getByVersion: (versionId: string) =>
    client.get<Document[]>(`/versions/${versionId}/documents`).then((r) => r.data),
  getByNode: (nodeId: string) =>
    client.get<Document[]>(`/nodes/${nodeId}/documents`).then((r) => r.data),
  get: (id: string) => client.get<Document>(`/documents/${id}`).then((r) => r.data),
  create: (data: {
    project_id: string
    version_id?: string
    type: string
    title: string
    linked_node_ids?: string[]
  }) => client.post<Document>('/documents', data).then((r) => r.data),
  upload: (formData: FormData) =>
    client.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  update: (id: string, data: { title?: string; type?: string; linked_node_ids?: string[] }) =>
    client.patch<Document>(`/documents/${id}`, data).then((r) => r.data),
  updateContent: (id: string, formData: FormData) =>
    client.put<Document>(`/documents/${id}/content`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  delete: (id: string) => client.delete(`/documents/${id}`),
}
