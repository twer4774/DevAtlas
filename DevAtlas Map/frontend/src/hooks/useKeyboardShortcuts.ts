import { useEffect } from 'react'
import { useHistory } from '@/hooks/useHistory'
import { useDeleteNode } from '@/hooks/useNodes'
import { useMapStore } from '@/store/mapStore'
import { useToastStore } from '@/store/toastStore'

function isEditingText(): boolean {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable
}

export function useKeyboardShortcuts(versionId: string | null) {
  const { undo, redo, canUndo, canRedo } = useHistory()
  const deleteNode = useDeleteNode(versionId ?? '')
  const { selectedNodeId, setSelectedNode } = useMapStore()
  const { add: addToast } = useToastStore()
  const triggerAutoLayout = useMapStore(s => s.triggerAutoLayout)

  useEffect(() => {
    if (!versionId) return

    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      // Shift가 눌리면 e.key가 대문자가 되므로 소문자로 통일
      const key = e.key.toLowerCase()

      // Undo: Cmd+Z
      if (meta && key === 'z' && !e.shiftKey) {
        if (isEditingText()) return
        e.preventDefault()
        if (canUndo) undo()
        else addToast('더 이상 취소할 작업이 없습니다', 'info')
        return
      }

      // Redo: Cmd+Shift+Z or Cmd+Y
      if ((meta && e.shiftKey && key === 'z') || (meta && key === 'y')) {
        if (isEditingText()) return
        e.preventDefault()
        if (canRedo) redo()
        else addToast('더 이상 다시 실행할 작업이 없습니다', 'info')
        return
      }

      // Auto layout: Cmd+Shift+L
      if (meta && e.shiftKey && key === 'l') {
        if (isEditingText()) return
        e.preventDefault()
        triggerAutoLayout()
        return
      }

      // Delete selected node: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        if (isEditingText()) return
        e.preventDefault()
        if (window.confirm('선택한 노드를 삭제하시겠습니까?')) {
          deleteNode.mutate({ id: selectedNodeId, reason: '키보드 삭제', author: 'user' })
          setSelectedNode(null)
        }
        return
      }

      // Escape: deselect node
      if (e.key === 'Escape' && selectedNodeId) {
        if (isEditingText()) return
        setSelectedNode(null)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [versionId, canUndo, canRedo, undo, redo, selectedNodeId, deleteNode, setSelectedNode, addToast, triggerAutoLayout])
}
