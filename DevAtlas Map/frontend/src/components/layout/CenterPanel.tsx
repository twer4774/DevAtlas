import { ReactFlowProvider } from '@xyflow/react'
import { MindmapCanvas } from '@/components/map/MindmapCanvas'

interface Props {
  versionId: string | null
}

export function CenterPanel({ versionId }: Props) {
  if (!versionId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500 text-sm">
        좌측에서 버전을 선택하세요
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <MindmapCanvas versionId={versionId} />
    </ReactFlowProvider>
  )
}
