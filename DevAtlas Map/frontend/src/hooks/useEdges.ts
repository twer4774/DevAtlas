import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { edgesApi } from '@/api/edges'
import { useToastStore } from '@/store/toastStore'

export const useEdges = (versionId: string | null) =>
  useQuery({
    queryKey: ['edges', versionId],
    queryFn: () => edgesApi.list(versionId!),
    enabled: !!versionId,
    refetchInterval: 5000,
  })

export const useCreateEdge = (versionId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { source_id: string; target_id: string; relation_type: string }) =>
      edgesApi.create(versionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['edges', versionId] }),
  })
}

export const useDeleteEdge = (versionId: string) => {
  const qc = useQueryClient()
  const { add: addToast } = useToastStore()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => edgesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['edges', versionId] }),
    onError: () => addToast('엣지 삭제에 실패했습니다', 'error'),
  })
}
