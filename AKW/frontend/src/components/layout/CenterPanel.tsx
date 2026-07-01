import { ReactFlowProvider } from '@xyflow/react'
import { MindmapCanvas } from '@/components/map/MindmapCanvas'
import { useMapStore } from '@/store/mapStore'
import { useDeleteNode, useNodes } from '@/hooks/useNodes'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Sparkles, MousePointer2, Keyboard } from 'lucide-react'

interface Props {
  versionId: string | null
}

const MCP_EXAMPLES = [
  '"백엔드 API 서버 노드 추가해줘"',
  '"Redis 캐시와 PostgreSQL DB 노드 만들고 API 서버에 연결해줘"',
  '"프론트엔드→API→DB 흐름으로 아키텍처 설계해줘"',
]

function EmptyCanvasOverlay() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* 도트 그리드 배경 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #30363d 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.35,
        }}
      />

      {/* 중앙 카드 */}
      <div
        className="relative pointer-events-auto rounded-2xl p-8 max-w-md w-full mx-4 space-y-5"
        style={{
          background: 'rgba(13,17,23,0.92)',
          border: '1px solid #30363d',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="text-base font-bold" style={{ color: '#e6edf3' }}>
            캔버스가 비어 있어요
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: '#8b949e' }}>
            아키텍처 노드를 추가해서 시스템 구조를 시각화하세요.
          </p>
        </div>

        {/* AI 시작 섹션 */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} style={{ color: '#a78bfa' }} />
            <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>Claude에게 요청하기</span>
          </div>
          <div className="space-y-1.5">
            {MCP_EXAMPLES.map((ex, i) => (
              <div
                key={i}
                className="text-[11px] px-3 py-2 rounded-lg font-mono leading-relaxed"
                style={{ background: '#0d1117', color: '#8b949e', border: '1px solid #21262d' }}
              >
                {ex}
              </div>
            ))}
          </div>
        </div>

        {/* 직접 추가 힌트 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#6e7681' }}>
            <MousePointer2 size={12} />
            툴바에서 노드 직접 추가
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#6e7681' }}>
            <Keyboard size={12} />
            <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#21262d', color: '#8b949e' }}>N</kbd>
            빠른 노드 추가
          </div>
        </div>
      </div>
    </div>
  )
}

export function CenterPanel({ versionId }: Props) {
  const { pendingDeleteNodeId, setPendingDeleteNode, setSelectedNode } = useMapStore()
  const deleteNode = useDeleteNode(versionId ?? '')
  const { data: nodes, isLoading } = useNodes(versionId ?? '')

  const pendingNode = nodes?.find(n => n.id === pendingDeleteNodeId)
  const isGroup = pendingNode?.type === 'group'
  const isEmpty = !isLoading && nodes?.length === 0

  const handleConfirmDelete = () => {
    if (!pendingDeleteNodeId) return
    deleteNode.mutate({ id: pendingDeleteNodeId, reason: isGroup ? '영역 삭제' : '키보드 삭제', author: 'user' })
    setSelectedNode(null)
    setPendingDeleteNode(null)
  }

  return (
    <div className="h-full relative">
      {versionId ? (
        <>
          <ReactFlowProvider>
            <MindmapCanvas versionId={versionId} />
          </ReactFlowProvider>
          {isEmpty && <EmptyCanvasOverlay />}
        </>
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
