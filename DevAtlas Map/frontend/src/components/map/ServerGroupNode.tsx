import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Server, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMapStore } from '@/store/mapStore'
import type { ArchitectureNode } from '@/types'

interface ServerGroupData {
  node: ArchitectureNode
  childCount: number
  isExpanded: boolean
  groupWidth: number
  groupHeight: number
  [key: string]: unknown
}

const COLOR = '#1d4ed8'

export const ServerGroupNode = memo(({ data, selected }: NodeProps) => {
  const { node, childCount, isExpanded } = data as ServerGroupData
  const { toggleExpand } = useMapStore()

  return (
    <div
      className={cn(
        'h-full w-full rounded-xl border-2 border-dashed transition-colors',
        selected ? 'border-blue-400' : 'border-blue-800/60',
        isExpanded ? 'bg-blue-950/20' : 'bg-gray-900',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-blue-900/40 rounded-t-xl">
        <div
          className="flex items-center justify-center w-5 h-5 rounded flex-shrink-0"
          style={{ backgroundColor: COLOR + '33', color: COLOR }}
        >
          <Server size={11} strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold text-blue-300 flex-1 truncate">{node.title}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
          className="text-blue-500/70 hover:text-blue-300 transition-colors flex-shrink-0"
          title={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* Collapsed state */}
      {!isExpanded && (
        <div className="px-3 py-2 text-[11px] text-gray-500">
          {childCount}개 노드 포함
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-700 !border-blue-600 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-700 !border-blue-600 !w-3 !h-3"
      />
    </div>
  )
})

ServerGroupNode.displayName = 'ServerGroupNode'
