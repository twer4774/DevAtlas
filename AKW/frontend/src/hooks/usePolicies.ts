import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policiesApi } from '@/api/policies'

export const usePolicies = (projectId: string | null) =>
  useQuery({
    queryKey: ['policies', projectId],
    queryFn: () => policiesApi.list(projectId!),
    enabled: !!projectId,
  })

export const useCreatePolicy = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; severity?: string }) =>
      policiesApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies', projectId] }),
  })
}

export const useUpdatePolicy = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; severity?: string; status?: string }) =>
      policiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies', projectId] }),
  })
}

export const useDeletePolicy = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => policiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies', projectId] }),
  })
}

export const useSetPolicyNodes = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nodeIds }: { id: string; nodeIds: string[] }) =>
      policiesApi.setNodes(id, nodeIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies', projectId] }),
  })
}
