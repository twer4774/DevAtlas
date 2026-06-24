import { memo, useState } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { LayoutDashboard, Trash2, Maximize2 } from 'lucide-react'
import { nodesApi } from '@/api/nodes'
import { useUpdateNode, useDeleteNode } from '@/hooks/useNodes'
import { useMapStore } from '@/store/mapStore'
import type { ArchitectureNode } from '@/types'

interface GroupAreaData {
  node: ArchitectureNode
  [key: string]: unknown
}

const COLORS = [
  { label: '파랑', bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.28)',  text: '#60a5fa' },
  { label: '보라', bg: 'rgba(139,92,246,0.07)',   border: 'rgba(139,92,246,0.28)', text: '#a78bfa' },
  { label: '초록', bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.28)',  text: '#4ade80' },
  { label: '주황', bg: 'rgba(249,115,22,0.07)',   border: 'rgba(249,115,22,0.28)', text: '#fb923c' },
  { label: '회색', bg: 'rgba(107,114,128,0.07)',  border: 'rgba(107,114,128,0.28)', text: '#9ca3af' },
]

export const GroupAreaNode = memo(({ data, selected }: NodeProps) => {
  const { node } = data as GroupAreaData
  const colorIdx = (node.metadata_?.colorIdx as number) ?? 0
  const color = COLORS[colorIdx % COLORS.length]
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(node.title)
  const updateNode = useUpdateNode(node.version_id)
  const deleteNode = useDeleteNode(node.version_id)
  const { setSelectedNode, enterDrillDown, drillRootId, selectedNodeId } = useMapStore()
  const [areaHovered, setAreaHovered] = useState(false)

  const saveTitle = () => {
    if (draftTitle.trim() && draftTitle !== node.title) {
      updateNode.mutate({ id: node.id, title: draftTitle.trim() })
    }
    setEditing(false)
  }

  const borderColor = selected ? color.text + 'cc' : color.border
  const boxShadow = selected
    ? `0 0 0 1px ${color.text}33, inset 0 0 60px ${color.text}0a, 0 8px 32px rgba(0,0,0,0.35)`
    : `inset 0 0 40px ${color.text}07, 0 4px 20px rgba(0,0,0,0.25)`

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={280}
        minHeight={180}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color.text + '99', borderColor: color.text }}
        lineStyle={{ borderColor: color.text + '66' }}
        onResizeEnd={(_, params) => {
          nodesApi.update(node.id, {
            position: { x: params.x, y: params.y },
            metadata_: { ...node.metadata_, width: params.width, height: params.height },
          })
        }}
      />

      <div
        className="h-full w-full rounded-2xl overflow-hidden transition-shadow duration-200 group"
        style={{
          background: `linear-gradient(160deg, ${color.text}0e 0%, ${color.bg} 40%)`,
          border: `1px solid ${borderColor}`,
          boxShadow,
          opacity: (selectedNodeId != null && selectedNodeId !== node.id && !areaHovered) ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={() => setAreaHovered(true)}
        onMouseLeave={() => setAreaHovered(false)}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${color.text}88 0%, ${color.text}00 70%)` }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 pt-2 pb-2"
          style={{ background: `linear-gradient(90deg, ${color.text}12 0%, transparent 60%)` }}
        >
          <LayoutDashboard size={11} style={{ color: color.text }} className="flex-shrink-0" />

          {editing ? (
            <input
              autoFocus
              className="flex-1 bg-transparent text-xs font-bold focus:outline-none border-b"
              style={{ color: color.text, borderColor: color.text + '55' }}
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-[11px] font-bold tracking-wide truncate cursor-text flex-1"
              style={{ color: color.text }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
              title={node.title}
            >
              {node.title}
            </span>
          )}

          {/* description badge */}
          {!editing && (node.metadata_?.description as string | undefined) && !selected && (
            <span
              className="text-[9px] truncate max-w-[110px] font-medium"
              style={{ color: color.text + '66' }}
              title={node.metadata_?.description as string}
            >
              {node.metadata_?.description as string}
            </span>
          )}

          {/* 집중해서 보기 — hover 시 표시 */}
          {!editing && drillRootId !== node.id && (
            <button
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
              style={{ color: color.text + '88' }}
              onClick={e => { e.stopPropagation(); enterDrillDown(node.id, node.title) }}
              onMouseEnter={e => {
                e.currentTarget.style.color = color.text
                e.currentTarget.style.background = color.text + '22'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = color.text + '88'
                e.currentTarget.style.background = 'transparent'
              }}
              title="이 영역 집중해서 보기"
            >
              <Maximize2 size={10} />
            </button>
          )}

          {/* 색상 선택 + 삭제 — 선택 시 표시 */}
          {selected && !editing && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  title={c.label}
                  onClick={() => updateNode.mutate({ id: node.id, metadata_: { ...node.metadata_, colorIdx: i } })}
                  className="w-3 h-3 rounded-full border transition-all"
                  style={{
                    backgroundColor: c.text + '44',
                    borderColor: colorIdx === i ? c.text : 'transparent',
                  }}
                />
              ))}
              <div className="w-px h-3 bg-white/15 mx-0.5" />
              <button
                title="영역 삭제"
                onClick={() => {
                  if (window.confirm(`"${node.title}" 영역을 삭제하시겠습니까?\n내부 노드는 삭제되지 않습니다.`)) {
                    deleteNode.mutate({ id: node.id, reason: '영역 삭제', author: 'user' })
                    setSelectedNode(null)
                  }
                }}
                className="p-0.5 rounded transition-colors"
                style={{ color: 'rgba(239,68,68,0.5)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </>
  )
})

GroupAreaNode.displayName = 'GroupAreaNode'
