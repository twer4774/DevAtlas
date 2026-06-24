import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { versionsApi } from '@/api/versions'

export const useVersions = (projectId: string | null) =>
  useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => versionsApi.list(projectId!),
    enabled: !!projectId,
  })

export const useVersion = (id: string | null) =>
  useQuery({
    queryKey: ['version', id],
    queryFn: () => versionsApi.get(id!),
    enabled: !!id,
  })

export const useCreateVersion = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; base_version_id?: string }) =>
      versionsApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['versions', projectId] }),
  })
}

export const useForkVersion = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ versionId, name }: { versionId: string; name: string }) =>
      versionsApi.fork(versionId, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['versions', projectId] }),
  })
}

export const useDiff = (versionA: string | null, versionB: string | null) =>
  useQuery({
    queryKey: ['diff', versionA, versionB],
    queryFn: () => versionsApi.diff(versionA!, versionB!),
    enabled: !!versionA && !!versionB,
  })
