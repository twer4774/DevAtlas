import type { SearchResponse } from '@/types'
import client from './client'

export const searchApi = {
  search: (q: string, projectId?: string, type = 'all') =>
    client.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}${projectId ? `&project_id=${projectId}` : ''}&type=${type}`).then((r) => r.data),
}
