import { NodePropertiesPanel } from '@/components/map/NodePropertiesPanel'

interface Props {
  projectId: string
  versionId: string | null
}

export function RightPanel({ projectId, versionId }: Props) {
  if (!versionId) {
    return (
      <div className="h-full bg-gray-900 border-l border-gray-800 flex items-center justify-center text-gray-500 text-xs">
        버전을 선택하세요
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800">
      <NodePropertiesPanel projectId={projectId} versionId={versionId} />
    </div>
  )
}
