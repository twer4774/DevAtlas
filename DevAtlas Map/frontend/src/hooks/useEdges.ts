import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { edgesApi } from '@/api/edges'
import { useHistoryStore } from '@/store/historyStore'
import { useToastStore } from '@/store/toastStore'
import type { NodeEdge } from '@/types'

export const useEdges = (versionId: string | null) =>
  useQuery({
    queryKey: ['edges', versionId],
    queryFn: () => edgesApi.list(versionId!),
    enabled: !!versionId,
    refetchInterval: 5000,
  })

export const useCreateEdge = (versionId: string) => {
  const qc = useQueryClient()
  const { push } = useHistoryStore()
  return useMutation({
    mutationFn: (data: { source_id: string; target_id: string; relation_type: string }) =>
      edgesApi.create(versionId, data),
    onSuccess: (newEdge) => {
      push({ kind: 'edge_created', versionId, edgeId: newEdge.id })
      qc.invalidateQueries({ queryKey: ['edges', versionId] })
    },
  })
}

export const useDeleteEdge = (versionId: string) => {
  const qc = useQueryClient()
  const { push } = useHistoryStore()
  const { add: addToast } = useToastStore()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => edgesApi.delete(id),
    onMutate: (vars: { id: string }) => {
      const edges = qc.getQueryData<NodeEdge[]>(['edges', versionId])
      const edge = edges?.find((e) => e.id === vars.id)
      return { edge }
    },
    onSuccess: (_, vars, context) => {
      if (context?.edge) {
        push({
          kind: 'edge_deleted',
          versionId,
          edgeId: vars.id,
          snapshot: {
            source_id: context.edge.source_id,
            target_id: context.edge.target_id,
            relation_type: context.edge.relation_type,
          },
        })
      }
      qc.invalidateQueries({ queryKey: ['edges', versionId] })
    },
    onError: () => addToast('엣지 삭제에 실패했습니다', 'error'),
  })
}
