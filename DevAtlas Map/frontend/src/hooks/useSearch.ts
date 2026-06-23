import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/search'

export const useSearch = (q: string, projectId?: string) =>
  useQuery({
    queryKey: ['search', q, projectId],
    queryFn: () => searchApi.search(q, projectId),
    enabled: q.trim().length > 0,
  })
