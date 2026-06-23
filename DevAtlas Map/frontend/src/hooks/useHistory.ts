import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useHistoryStore } from '@/store/historyStore'
import { useToastStore } from '@/store/toastStore'
import { nodesApi } from '@/api/nodes'

export function useHistory() {
  const { undo: popUndo, redo: popRedo, canUndo, canRedo, replaceTopFuture } = useHistoryStore()
  const { add: addToast } = useToastStore()
  const qc = useQueryClient()

  const undo = useCallback(async () => {
    const entry = popUndo()
    if (!entry) return

    if (entry.kind === 'node_updated') {
      try {
        await nodesApi.update(entry.nodeId, entry.before)
        qc.invalidateQueries({ queryKey: ['nodes', entry.versionId] })
        addToast('실행 취소됨', 'info')
      } catch {
        addToast('실행 취소 실패', 'error')
      }
    }

    if (entry.kind === 'node_deleted') {
      try {
        const { snapshot } = entry
        const newNode = await nodesApi.create(entry.versionId, {
          title: snapshot.title,
          type: snapshot.type,
          position: snapshot.position,
          reason: 'undo delete',
          author: 'user',
        })
        // redo가 가능하도록 새 ID로 future 엔트리 교체
        replaceTopFuture({ kind: 'node_created', versionId: entry.versionId, nodeId: newNode.id })
        qc.invalidateQueries({ queryKey: ['nodes', entry.versionId] })
        addToast('삭제가 취소되었습니다', 'info')
      } catch {
        addToast('실행 취소 실패', 'error')
      }
    }
  }, [popUndo, replaceTopFuture, qc, addToast])

  const redo = useCallback(async () => {
    const entry = popRedo()
    if (!entry) return

    if (entry.kind === 'node_updated') {
      try {
        await nodesApi.update(entry.nodeId, entry.after)
        qc.invalidateQueries({ queryKey: ['nodes', entry.versionId] })
        addToast('다시 실행됨', 'info')
      } catch {
        addToast('다시 실행 실패', 'error')
      }
    }

    if (entry.kind === 'node_created') {
      try {
        await nodesApi.delete(entry.nodeId, 'redo delete', 'user')
        qc.invalidateQueries({ queryKey: ['nodes', entry.versionId] })
        addToast('다시 실행됨', 'info')
      } catch {
        addToast('다시 실행 실패', 'error')
      }
    }
  }, [popRedo, qc, addToast])

  return { undo, redo, canUndo, canRedo }
}
