import { useQuery } from '@tanstack/react-query'
import { changelogApi } from '@/api/changelog'

export const useChangelog = (versionId: string | null) =>
  useQuery({
    queryKey: ['changelog', versionId],
    queryFn: () => changelogApi.list(versionId!),
    enabled: !!versionId,
    refetchInterval: 30000,
  })
