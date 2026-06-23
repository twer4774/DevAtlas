import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Layers, Target, Zap, Shield, ExternalLink,
  Box, ChevronRight, ChevronDown, Search, Server,
  Database, Archive, Globe, Radio, Workflow, Cloud,
  Lock, Cpu, HardDrive, List, ArrowRightLeft, Code, Cog, Network,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  getNodeTypeColor, getNodeTypeLabel,
  NODE_STATUS_COLORS, NODE_STATUS_LABELS,
  type NodeStatus,
} from '@/lib/constants'
import { useMapStore } from '@/store/mapStore'
import { useDiffStore } from '@/store/diffStore'
import type { ArchitectureNode } from '@/types'

interface ArchNodeData {
  node: ArchitectureNode
  hasChildren: boolean
  childCount: number
  isAncestorHighlighted?: boolean
  [key: string]: unknown
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  // PRD taxonomy
  Program: Layers,
  Capability: Target,
  Feature: Zap,
  Policy: Shield,
  External: ExternalLink,
  // Infrastructure / cloud
  service: Server,
  backend: Server,
  api: Code,
  frontend: Globe,
  database: Database,
  storage: Archive,
  broker: Radio,
  queue: List,
  function: Workflow,
  worker: Cog,
  cache: HardDrive,
  'cloud-service': Cloud,
  'auth-service': Lock,
  device: Cpu,
  'device-planned': Cpu,
  gateway: ArrowRightLeft,
  network: Network,
}

export const ArchNodeComponent = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ArchNodeData
  const { node, hasChildren, childCount, isAncestorHighlighted } = nodeData
  const { expandedNodeIds, toggleExpand, enterDrillDown } = useMapStore()
  const { isDiffMode, diffResult } = useDiffStore()

  const isExpanded = expandedNodeIds.has(node.id)
  const typeColor = getNodeTypeColor(node.type)
  const typeLabel = getNodeTypeLabel(node.type)
  const Icon = TYPE_ICONS[node.type] ?? Box

  const status = node.metadata_?.status as NodeStatus | undefined
  const description = node.metadata_?.description as string | undefined
  const statusColor = status ? NODE_STATUS_COLORS[status] : undefined
  const statusLabel = status ? NODE_STATUS_LABELS[status] : undefined

  let ringStyle = ''
  let bgStyle = ''
  if (isDiffMode && diffResult) {
    if (diffResult.added.includes(node.id)) {
      ringStyle = 'ring-2 ring-green-500'
      bgStyle = 'bg-green-500/5'
    } else if (diffResult.deleted.includes(node.id)) {
      ringStyle = 'ring-2 ring-red-500 ring-dashed'
      bgStyle = 'bg-red-500/5'
    } else if (diffResult.changed.includes(node.id)) {
      ringStyle = 'ring-2 ring-yellow-400'
      bgStyle = 'bg-yellow-400/5'
    }
  }

  return (
    <div
      className={cn(
        // 드래그 중 위치(transform) 업데이트에 transition이 걸리면 깜빡/지연처럼 느껴질 수 있어,
        // 색/그림자 등 시각적 상태 변화에만 transition을 제한한다.
        'relative flex flex-col w-[210px] rounded-xl border bg-gray-900 shadow-xl transition-colors duration-150 group',
        'will-change-transform',
        'overflow-hidden',
        selected
          ? 'border-blue-500 shadow-blue-500/30 shadow-lg'
          : isAncestorHighlighted
            ? 'border-orange-400/60 shadow-orange-400/20 shadow-lg'
            : ringStyle || 'border-gray-700/80 hover:border-gray-500',
        bgStyle,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <div
          className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
          style={{ backgroundColor: typeColor + '22', color: typeColor }}
        >
          <Icon size={13} strokeWidth={2} />
        </div>

        <span
          className="text-[10px] font-medium uppercase tracking-wider flex-1 truncate"
          style={{ color: typeColor }}
        >
          {typeLabel}
        </span>

        {statusLabel && statusColor && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
            style={{ backgroundColor: statusColor + '22', color: statusColor }}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="px-3 pb-1.5">
        <span className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2 block">
          {node.title}
        </span>
        {description && (
          <span className="text-[11px] text-gray-500 leading-snug line-clamp-2 block mt-0.5">
            {description}
          </span>
        )}
      </div>

      {/* Action row */}
      {hasChildren && (
        <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
            className={cn(
              'flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md transition-all flex-1',
              isExpanded
                ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300'
            )}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>{isExpanded ? '접기' : `${childCount}개 펼치기`}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); enterDrillDown(node.id, node.title) }}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-gray-600 hover:text-blue-400 hover:bg-gray-700/60 transition-all opacity-0 group-hover:opacity-100"
            title="드릴다운"
          >
            <Search size={11} />
          </button>
        </div>
      )}

      {/* Bottom color bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: typeColor }} />

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-600 !border-gray-500 !w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-600 !border-gray-500 !w-2.5 !h-2.5 !opacity-0 group-hover:!opacity-100 transition-opacity"
      />
    </div>
  )
})

ArchNodeComponent.displayName = 'ArchNode'
