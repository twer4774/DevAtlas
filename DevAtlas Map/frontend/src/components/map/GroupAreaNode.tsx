import { memo, useState } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { LayoutDashboard, Trash2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { nodesApi } from '@/api/nodes'
import { useUpdateNode, useDeleteNode } from '@/hooks/useNodes'
import { useMapStore } from '@/store/mapStore'
import type { ArchitectureNode } from '@/types'

interface GroupAreaData {
  node: ArchitectureNode
  [key: string]: unknown
}

const COLORS = [
  { label: '파랑', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.35)', text: '#60a5fa' },
  { label: '보라', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.35)', text: '#a78bfa' },
  { label: '초록', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.35)',  text: '#4ade80' },
  { label: '주황', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.35)', text: '#fb923c' },
  { label: '회색', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.35)', text: '#9ca3af' },
]

export const GroupAreaNode = memo(({ data, selected }: NodeProps) => {
  const { node } = data as GroupAreaData
  const colorIdx = (node.metadata_?.colorIdx as number) ?? 0
  const color = COLORS[colorIdx % COLORS.length]
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(node.title)
  const updateNode = useUpdateNode(node.version_id)
  const deleteNode = useDeleteNode(node.version_id)
  const { setSelectedNode, enterDrillDown } = useMapStore()

  const saveTitle = () => {
    if (draftTitle.trim() && draftTitle !== node.title) {
      updateNode.mutate({ id: node.id, title: draftTitle.trim() })
    }
    setEditing(false)
  }

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={280}
        minHeight={180}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: color.border }}
        onResizeEnd={(_, params) => {
          nodesApi.update(node.id, {
            position: { x: params.x, y: params.y },
            metadata_: { ...node.metadata_, width: params.width, height: params.height },
          })
        }}
      />

      <div
        className={cn('h-full w-full rounded-xl border-2 border-dashed transition-colors group')}
        style={{
          backgroundColor: color.bg,
          borderColor: selected ? color.text : color.border,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-2">
          <LayoutDashboard size={11} style={{ color: color.text }} className="flex-shrink-0 opacity-70" />
          {editing ? (
            <input
              autoFocus
              className="flex-1 bg-transparent text-xs font-semibold focus:outline-none border-b"
              style={{ color: color.text, borderColor: color.border }}
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-xs font-semibold truncate cursor-text flex-1"
              style={{ color: color.text }}
              onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
              title={node.title}
            >
              {node.title}
            </span>
          )}
          {/* description badge — show when not editing */}
          {!editing && (node.metadata_?.description as string | undefined) && !selected && (
            <span
              className="text-[9px] truncate max-w-[120px] opacity-50"
              style={{ color: color.text }}
              title={node.metadata_?.description as string}
            >
              {node.metadata_?.description as string}
            </span>
          )}

          {/* 집중해서 보기 — hover 시 표시 */}
          {!editing && (
            <button
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover:opacity-100 transition-all"
              style={{ color: color.text + '99' }}
              onClick={e => { e.stopPropagation(); enterDrillDown(node.id, node.title) }}
              onMouseEnter={e => { e.currentTarget.style.color = color.text; e.currentTarget.style.background = color.border + '55' }}
              onMouseLeave={e => { e.currentTarget.style.color = color.text + '99'; e.currentTarget.style.background = 'transparent' }}
              title="이 영역 집중해서 보기"
            >
              <Maximize2 size={10} />
            </button>
          )}

          {/* 색상 선택 + 삭제 — 선택 시 표시 */}
          {selected && !editing && (
            <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  title={c.label}
                  onClick={() => {
                    updateNode.mutate({
                      id: node.id,
                      metadata_: { ...node.metadata_, colorIdx: i },
                    })
                  }}
                  className="w-3.5 h-3.5 rounded-full border transition-all"
                  style={{
                    backgroundColor: c.text + '33',
                    borderColor: colorIdx === i ? c.text : 'transparent',
                  }}
                />
              ))}
              <div className="w-px h-3 bg-white/20 mx-0.5" />
              <button
                title="영역 삭제"
                onClick={() => {
                  if (window.confirm(`"${node.title}" 영역을 삭제하시겠습니까?\n내부 노드는 삭제되지 않습니다.`)) {
                    deleteNode.mutate({ id: node.id, reason: '영역 삭제', author: 'user' })
                    setSelectedNode(null)
                  }
                }}
                className="p-0.5 text-red-400/60 hover:text-red-400 rounded transition-colors"
              >
                <Trash2 size={11} />
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
