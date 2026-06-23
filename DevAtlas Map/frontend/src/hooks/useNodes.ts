import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nodesApi } from '@/api/nodes'
import { useHistoryStore, type NodeUpdatePayload } from '@/store/historyStore'
import { useToastStore } from '@/store/toastStore'
import type { ArchitectureNode } from '@/types'

export const useNodes = (versionId: string | null, paused = false) =>
  useQuery({
    queryKey: ['nodes', versionId],
    queryFn: () => nodesApi.list(versionId!),
    enabled: !!versionId,
    // 드래그 중에는 refetch를 중단해 stale 서버 데이터가 캐시를 덮어쓰는 것을 방지
    refetchInterval: paused ? false : 5000,
  })

export const useCreateNode = (versionId: string) => {
  const qc = useQueryClient()
  const { add: addToast } = useToastStore()
  return useMutation({
    mutationFn: (data: Parameters<typeof nodesApi.create>[1]) => nodesApi.create(versionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nodes', versionId] })
      addToast('노드가 추가되었습니다', 'success')
    },
    onError: () => addToast('노드 추가에 실패했습니다', 'error'),
  })
}

export const useUpdateNode = (versionId: string) => {
  const qc = useQueryClient()
  const { push } = useHistoryStore()
  const { add: addToast } = useToastStore()

  return useMutation({
    mutationFn: ({ id, _noInvalidate: _, ...data }: { id: string; _noInvalidate?: boolean } & Parameters<typeof nodesApi.update>[1]) =>
      nodesApi.update(id, data),

    onMutate: async ({ id }) => {
      const nodes = qc.getQueryData<ArchitectureNode[]>(['nodes', versionId])
      const before = nodes?.find((n) => n.id === id)
      return { before }
    },

    onSuccess: (_data, { id, _noInvalidate, ...updates }, context) => {
      const before = context?.before
      const { position: _pos, reason: _r, author: _a, ...trackable } = updates as Record<string, unknown>
      const hasTrackable = Object.keys(trackable).length > 0
      const hasInvalidateWorthy = Object.keys(trackable).some((k) => k !== 'parent_id')

      if (before && hasTrackable) {
        push({
          kind: 'node_updated',
          nodeId: id,
          versionId,
          before: {
            title: before.title,
            type: before.type,
            metadata_: before.metadata_,
          },
          after: trackable as NodeUpdatePayload,
        })
      }
      // position-only 업데이트(드래그)는 onNodeDragStop에서 setQueryData로 이미
      // 캐시를 갱신했으므로 refetch를 생략해 layout 재계산 + jitter를 방지.
      // _noInvalidate=true이면 호출자가 이미 setQueryData로 캐시를 갱신했으므로 refetch 불필요.
      if (hasInvalidateWorthy && !_noInvalidate) {
        qc.invalidateQueries({ queryKey: ['nodes', versionId] })
      }
    },

    onError: () => addToast('노드 업데이트에 실패했습니다', 'error'),
  })
}

export const useDeleteNode = (versionId: string) => {
  const qc = useQueryClient()
  const { push } = useHistoryStore()
  const { add: addToast } = useToastStore()
  return useMutation({
    mutationFn: ({ id, reason, author }: { id: string; reason?: string; author?: string }) =>
      nodesApi.delete(id, reason, author),
    onMutate: async ({ id }) => {
      const nodes = qc.getQueryData<ArchitectureNode[]>(['nodes', versionId])
      return { snapshot: nodes?.find((n) => n.id === id) }
    },
    onSuccess: (_data, _vars, context) => {
      if (context?.snapshot) {
        push({ kind: 'node_deleted', versionId, snapshot: context.snapshot })
      }
      qc.invalidateQueries({ queryKey: ['nodes', versionId] })
      addToast('노드가 삭제되었습니다', 'success')
    },
    onError: () => addToast('노드 삭제에 실패했습니다', 'error'),
  })
}
