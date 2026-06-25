import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Layers, Target, Zap, Shield, ExternalLink,
  Box, ChevronRight, ChevronDown, Server,
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
import { useUpdateNode } from '@/hooks/useNodes'
import type { ArchitectureNode } from '@/types'

interface ArchNodeData {
  node: ArchitectureNode
  hasChildren: boolean
  childCount: number
  isAncestorHighlighted?: boolean
  [key: string]: unknown
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  Program: Layers,
  Capability: Target,
  Feature: Zap,
  Policy: Shield,
  External: ExternalLink,
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
  const { expandedNodeIds, toggleExpand, selectedNodeId } = useMapStore()
  const { isDiffMode, diffResult } = useDiffStore()
  const [nodeHovered, setNodeHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(node.title)
  const updateNode = useUpdateNode(node.version_id)

  const commitEdit = () => {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== node.title) {
      updateNode.mutate({ id: node.id, title: trimmed })
    }
    setEditing(false)
  }
  const cancelEdit = () => { setDraftTitle(node.title); setEditing(false) }

  const isExpanded = expandedNodeIds.has(node.id)
  const typeColor = getNodeTypeColor(node.type)
  const typeLabel = getNodeTypeLabel(node.type)
  const Icon = TYPE_ICONS[node.type] ?? Box

  const status = node.metadata_?.status as NodeStatus | undefined
  const description = node.metadata_?.description as string | undefined
  const statusColor = status ? NODE_STATUS_COLORS[status] : undefined
  const statusLabel = status ? NODE_STATUS_LABELS[status] : undefined

  // Diff mode overrides
  let diffBorder = ''
  let diffBg = ''
  if (isDiffMode && diffResult) {
    if (diffResult.added.includes(node.id)) {
      diffBorder = '2px solid #22c55e'
      diffBg = 'rgba(34,197,94,0.05)'
    } else if (diffResult.deleted.includes(node.id)) {
      diffBorder = '2px dashed #ef4444'
      diffBg = 'rgba(239,68,68,0.05)'
    } else if (diffResult.changed.includes(node.id)) {
      diffBorder = '2px solid #facc15'
      diffBg = 'rgba(250,204,21,0.05)'
    }
  }

  const isHighlighted = isAncestorHighlighted && !selected

  const border = diffBorder || (
    selected
      ? `1.5px solid ${typeColor}99`
      : isHighlighted
        ? '1.5px solid rgba(251,146,60,0.5)'
        : `1px solid ${typeColor}22`
  )

  const boxShadow = selected
    ? `0 0 0 1px ${typeColor}44, 0 0 24px ${typeColor}44, 0 8px 32px rgba(0,0,0,0.5)`
    : isHighlighted
      ? '0 0 16px rgba(251,146,60,0.2), 0 4px 16px rgba(0,0,0,0.4)'
      : '0 4px 20px rgba(0,0,0,0.4)'

  const isDimmedBySelection = selectedNodeId != null && selectedNodeId !== node.id
  const nodeOpacity = (isDimmedBySelection && !nodeHovered) ? 0.5 : 1

  return (
    // overflow-hidden을 내부 wrapper로 분리 → Handle이 클리핑되지 않음
    <div
      className={cn('relative w-[210px] rounded-xl group will-change-transform')}
      style={{ border, boxShadow, opacity: nodeOpacity, transition: 'opacity 0.2s' }}
      onMouseEnter={() => setNodeHovered(true)}
      onMouseLeave={() => setNodeHovered(false)}
    >
      {/* 콘텐츠 영역 — rounded + overflow-hidden을 여기에만 적용 */}
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ background: diffBg || `linear-gradient(145deg, ${typeColor}12 0%, #0d1117 55%)` }}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${typeColor}cc 0%, ${typeColor}00 100%)` }}
        />

        {/* Header: icon + type label + status */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: typeColor + '20',
              border: `1px solid ${typeColor}40`,
              color: typeColor,
            }}
          >
            <Icon size={14} strokeWidth={1.8} />
          </div>

          <span
            className="text-[9px] font-bold uppercase tracking-widest flex-1 truncate"
            style={{ color: typeColor + 'bb' }}
          >
            {typeLabel}
          </span>

          {statusLabel && statusColor && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
              style={{
                backgroundColor: statusColor + '20',
                border: `1px solid ${statusColor}40`,
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* Title + description — 더블클릭으로 인라인 편집 */}
        <div
          className="px-3 pb-2"
          onDoubleClick={(e) => { e.stopPropagation(); setDraftTitle(node.title); setEditing(true) }}
        >
          {editing ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                if (e.key === 'Escape') cancelEdit()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-[13px] font-bold text-white leading-snug tracking-tight outline-none border-b pb-0.5"
              style={{ borderColor: 'rgba(255,255,255,0.35)' }}
            />
          ) : (
            <span className="text-[13px] font-bold text-white leading-snug line-clamp-2 block tracking-tight cursor-text" title="더블클릭으로 편집">
              {node.title}
            </span>
          )}
          {!editing && description && (
            <span className="text-[10px] leading-relaxed line-clamp-2 block mt-1" style={{ color: '#6b7280' }}>
              {description}
            </span>
          )}
        </div>

        {/* Expand / drill-down */}
        {hasChildren && (
          <div className="flex items-center gap-1 px-2.5 pb-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all flex-1',
                isExpanded
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  : 'text-white/80 hover:text-white'
              )}
              style={!isExpanded ? {
                background: `linear-gradient(90deg, ${typeColor}30, ${typeColor}15)`,
                border: `1px solid ${typeColor}30`,
              } : undefined}
            >
              {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>{isExpanded ? '접기' : `${childCount}개 펼치기`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Handle은 overflow-hidden 바깥 — 클리핑 없이 완전히 표시됨 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!border-0 !w-3 !h-3 !opacity-0 group-hover:!opacity-100 !transition-opacity"
        style={{ backgroundColor: typeColor + 'cc' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!border-0 !w-3 !h-3 !opacity-0 group-hover:!opacity-100 !transition-opacity"
        style={{ backgroundColor: typeColor + 'cc' }}
      />
    </div>
  )
})

ArchNodeComponent.displayName = 'ArchNode'
