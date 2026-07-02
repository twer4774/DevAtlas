import { ReactFlowProvider } from '@xyflow/react'
import { MindmapCanvas } from '@/components/map/MindmapCanvas'
import { useMapStore } from '@/store/mapStore'
import { useDeleteNode, useNodes } from '@/hooks/useNodes'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

interface Props {
  versionId: string | null
}

export function CenterPanel({ versionId }: Props) {
  const { pendingDeleteNodeId, setPendingDeleteNode, setSelectedNode } = useMapStore()
  const deleteNode = useDeleteNode(versionId ?? '')
  const { data: nodes } = useNodes(versionId ?? '')

  const pendingNode = nodes?.find(n => n.id === pendingDeleteNodeId)
  const isGroup = pendingNode?.type === 'group'

  const handleConfirmDelete = () => {
    if (!pendingDeleteNodeId) return
    deleteNode.mutate({ id: pendingDeleteNodeId, reason: isGroup ? '영역 삭제' : '키보드 삭제', author: 'user' })
    setSelectedNode(null)
    setPendingDeleteNode(null)
  }

  return (
    <div className="h-full relative">
      {versionId ? (
        <ReactFlowProvider>
          <MindmapCanvas versionId={versionId} />
        </ReactFlowProvider>
      ) : (
        <div
          className="h-full flex flex-col items-center justify-center gap-3"
          style={{
            backgroundImage: 'radial-gradient(circle, #30363d 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          <p className="text-sm" style={{ color: '#484f58' }}>좌측에서 버전을 선택하세요</p>
        </div>
      )}

      <Modal
        open={!!pendingDeleteNodeId}
        onClose={() => setPendingDeleteNode(null)}
        title={isGroup ? '영역 삭제' : '노드 삭제'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {isGroup
              ? '영역을 삭제하시겠습니까? 영역 안의 노드는 삭제되지 않습니다.'
              : '선택한 노드를 삭제하시겠습니까?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingDeleteNode(null)}>취소</Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={deleteNode.isPending}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
