import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useChangelog } from '@/hooks/useChangelog'
import { useNodes } from '@/hooks/useNodes'
import { useMapStore } from '@/store/mapStore'
import { Spinner } from '@/components/common/Spinner'
import { History } from 'lucide-react'

const ACTION_META: Record<string, { color: string; bg: string; label: string }> = {
  'node.create': { color: '#3fb950', bg: '#0f2a15', label: 'create' },
  'node.update': { color: '#e3b341', bg: '#2d1f00', label: 'update' },
  'node.delete': { color: '#f85149', bg: '#2d0f0f', label: 'delete' },
  'doc.link':    { color: '#58a6ff', bg: '#0d1f3c', label: 'link'   },
  'doc.unlink':  { color: '#8b949e', bg: '#1c2128', label: 'unlink' },
}
const DEFAULT_META = { color: '#8b949e', bg: '#1c2128', label: '' }

const FILTERS = [
  { key: 'all',    label: '전체' },
  { key: 'node.create', label: '생성' },
  { key: 'node.update', label: '수정' },
  { key: 'node.delete', label: '삭제' },
]

interface Props {
  versionId: string
}

export function ChangelogPanel({ versionId }: Props) {
  const { data: entries, isLoading } = useChangelog(versionId)
  const { data: nodes } = useNodes(versionId)
  const { setSelectedNode, setPendingFocusNode, expandedNodeIds, expandAll } = useMapStore()
  const [filter, setFilter] = useState('all')

  if (isLoading) return <Spinner className="mx-auto mt-8" />

  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4 text-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#21262d' }}>
          <History size={16} style={{ color: '#484f58' }} />
        </div>
        <p className="text-xs" style={{ color: '#484f58' }}>변경 이력이 없습니다</p>
      </div>
    )
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.action === filter)

  const handleEntryClick = (targetId: string) => {
    const node = nodes?.find(n => n.id === targetId)
    if (!node) return
    const ancestors: string[] = []
    const nodeMap = new Map(nodes?.map(n => [n.id, n]) ?? [])
    let cur = nodeMap.get(node.id)
    while (cur?.parent_id) {
      ancestors.push(cur.parent_id)
      cur = nodeMap.get(cur.parent_id)
    }
    if (ancestors.length) expandAll([...Array.from(expandedNodeIds), ...ancestors])
    setSelectedNode(targetId)
    setPendingFocusNode(targetId)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6e7681' }}>
          Changelog
        </span>
        <span className="text-[10px]" style={{ color: '#484f58' }}>{filtered.length}건</span>
      </div>

      {/* 필터 칩 */}
      <div className="flex gap-1 px-4 pb-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
            style={{
              background: filter === f.key ? '#1f3250' : '#1c2128',
              color: filter === f.key ? '#58a6ff' : '#6e7681',
              border: `1px solid ${filter === f.key ? '#1f4682' : '#30363d'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="relative">
          <div
            className="absolute top-3 bottom-3"
            style={{ left: '7px', width: '1px', background: '#21262d' }}
          />

          <div className="space-y-1">
            {filtered.map((entry) => {
              const meta = ACTION_META[entry.action] ?? DEFAULT_META
              const targetNode = nodes?.find(n => n.id === entry.target_id)
              const isNodeAction = entry.action.startsWith('node.')
              const clickable = isNodeAction && !!targetNode

              return (
                <div key={entry.id} className="relative flex gap-3">
                  <div className="relative z-10 flex-shrink-0 mt-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                      style={{ background: meta.bg, borderColor: meta.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                    </div>
                  </div>

                  <div
                    className={`flex-1 min-w-0 rounded-lg px-3 py-2.5 mb-1 transition-colors ${clickable ? 'cursor-pointer' : ''}`}
                    style={{ background: '#1c2128', border: '1px solid #21262d' }}
                    onClick={() => clickable && handleEntryClick(entry.target_id)}
                    onMouseEnter={e => { if (clickable) (e.currentTarget as HTMLElement).style.borderColor = '#30363d' }}
                    onMouseLeave={e => { if (clickable) (e.currentTarget as HTMLElement).style.borderColor = '#21262d' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {entry.action}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#484f58' }}>
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                    {targetNode && (
                      <p className="text-xs font-medium leading-snug mb-1" style={{ color: '#c9d1d9' }}>
                        {targetNode.title}
                      </p>
                    )}
                    {entry.reason && (
                      <p className="text-xs leading-snug" style={{ color: '#8b949e' }}>
                        {entry.reason}
                      </p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: '#484f58' }}>
                      by {entry.author}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
