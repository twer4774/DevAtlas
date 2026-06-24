import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { getNodeTypeColor, getNodeTypeLabel } from '@/lib/constants'
import type { ArchitectureNode } from '@/types'

interface Props {
  nodes: ArchitectureNode[]
  open: boolean
  onClose: () => void
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-blue-500/30 text-blue-200 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

export function NodeSearchBar({ nodes, open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const { expandedNodeIds, expandAll, setSelectedNode, setPendingFocusNode } = useMapStore()

  // ancestor id 체인 수집
  const getAncestors = useCallback((nodeId: string): string[] => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const ancestors: string[] = []
    let cur = nodeMap.get(nodeId)
    while (cur?.parent_id) {
      ancestors.push(cur.parent_id)
      cur = nodeMap.get(cur.parent_id)
    }
    return ancestors
  }, [nodes])

  const filtered = query.trim()
    ? nodes.filter(n => {
        const q = query.toLowerCase()
        const desc = (n.metadata_?.description as string | undefined) ?? ''
        return (
          n.title.toLowerCase().includes(q) ||
          getNodeTypeLabel(n.type).toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q)
        )
      })
    : nodes.slice(0, 30)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [query])

  // 활성 항목이 뷰포트 안에 오도록 스크롤
  useEffect(() => {
    const item = listRef.current?.children[activeIdx] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const selectNode = useCallback((node: ArchitectureNode) => {
    const ancestors = getAncestors(node.id)
    if (ancestors.length > 0) {
      expandAll([...Array.from(expandedNodeIds), ...ancestors])
    }
    setSelectedNode(node.id)
    setPendingFocusNode(node.id)
    onClose()
  }, [getAncestors, expandedNodeIds, expandAll, setSelectedNode, setPendingFocusNode, onClose])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (filtered[activeIdx]) selectNode(filtered[activeIdx])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh]"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: '#0d1117' }}
      >
        {/* 입력 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
          <Search size={15} className="text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="노드 이름, 타입, 설명으로 검색..."
            className="flex-1 min-w-0 w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none"
          />
          <span className="text-[10px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5">Esc</span>
        </div>

        {/* 결과 목록 */}
        <ul ref={listRef} className="max-h-[360px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-gray-600">검색 결과 없음</li>
          ) : (
            filtered.map((node, i) => {
              const color = getNodeTypeColor(node.type)
              const typeLabel = getNodeTypeLabel(node.type)
              const desc = (node.metadata_?.description as string | undefined) ?? ''
              const isActive = i === activeIdx

              return (
                <li
                  key={node.id}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={() => selectNode(node)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ background: isActive ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  {/* 타입 색상 점 */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-100 truncate">
                        {highlight(node.title, query)}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ color, background: color + '20' }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    {desc && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {highlight(desc, query)}
                      </p>
                    )}
                  </div>

                  {isActive && (
                    <CornerDownLeft size={12} className="text-gray-600 flex-shrink-0" />
                  )}
                </li>
              )
            })
          )}
        </ul>

        {/* 하단 힌트 */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/8 text-[10px] text-gray-600">
          <span>↑↓ 이동</span>
          <span>Enter 선택</span>
          <span className="ml-auto">{filtered.length}개 노드</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
