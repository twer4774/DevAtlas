import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import { useDocument } from '@/hooks/useDocuments'
import { useNodes } from '@/hooks/useNodes'
import { documentsApi } from '@/api/documents'
import { useDocumentStore } from '@/store/documentStore'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { DOC_TYPES, DOC_TYPE_LABELS, NODE_TYPE_COLORS, type NodeType } from '@/lib/constants'
import { cn } from '@/lib/cn'

interface Props {
  docId: string | null
  projectId: string
  versionId: string
  linkedNodeId?: string | null
}

export function DocumentEditor({ docId, projectId, versionId, linkedNodeId }: Props) {
  const { data: doc, isLoading } = useDocument(docId)
  const { data: nodes } = useNodes(versionId)
  const { setActiveDocument, setView } = useDocumentStore()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('planning')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)
  const [linkedNodeIds, setLinkedNodeIds] = useState<string[]>([])
  const [nodeSearch, setNodeSearch] = useState('')
  const [showNodeDropdown, setShowNodeDropdown] = useState(false)

  // 기존 문서 로드: title/type/linkedNodes 초기화
  useEffect(() => {
    if (doc) {
      setTitle(doc.title)
      setType(doc.type)
      setLinkedNodeIds(doc.linked_node_ids ?? [])
    }
  }, [doc?.id]) // eslint-disable-line

  // 기존 문서 로드: S3에서 마크다운 내용 fetch
  useEffect(() => {
    if (!doc?.content_url) return
    setContentLoading(true)
    fetch(doc.content_url)
      .then((r) => r.text())
      .then((text) => {
        setContent(text)
        setOriginalContent(text)
      })
      .catch(() => {
        setContent('')
        setOriginalContent('')
      })
      .finally(() => setContentLoading(false))
  }, [doc?.content_url])

  // 새 문서 모드(docId 없음) 진입 시 상태 초기화
  useEffect(() => {
    if (!docId) {
      setTitle('')
      setType('planning')
      setContent('')
      setOriginalContent('')
      setLinkedNodeIds(linkedNodeId ? [linkedNodeId] : [])
      setNodeSearch('')
      setShowNodeDropdown(false)
    }
  }, [docId]) // eslint-disable-line

  const filteredNodes = useMemo(() =>
    (nodes ?? []).filter(n =>
      n.type !== 'group' &&
      !linkedNodeIds.includes(n.id) &&
      (nodeSearch === '' || n.title.toLowerCase().includes(nodeSearch.toLowerCase()))
    ),
    [nodes, linkedNodeIds, nodeSearch]
  )

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      if (docId) {
        // 기존 문서 수정
        await documentsApi.update(docId, { title, type, linked_node_ids: linkedNodeIds })
        if (content !== originalContent) {
          const blob = new Blob([content], { type: 'text/markdown' })
          const formData = new FormData()
          formData.append('file', blob, 'document.md')
          await documentsApi.updateContent(docId, formData)
        }
        await qc.invalidateQueries({ queryKey: ['documents'] })
        setView('view')
      } else {
        // 새 문서 생성
        const blob = new Blob([content], { type: 'text/markdown' })
        const formData = new FormData()
        formData.append('project_id', projectId)
        formData.append('version_id', versionId)
        formData.append('type', type)
        formData.append('title', title)
        formData.append('linked_node_ids', JSON.stringify(linkedNodeIds))
        formData.append('file', blob, 'document.md')
        const newDoc = await documentsApi.upload(formData)
        await qc.invalidateQueries({ queryKey: ['documents'] })
        setActiveDocument(newDoc.id)
        setView('view')
      }
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || contentLoading) return <Spinner className="mx-auto mt-6" />

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 메타데이터 영역 */}
      <div className="p-3 space-y-2.5 border-b border-gray-800">
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          placeholder="문서 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
          ))}
        </select>

        {/* 연결 노드 선택 */}
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            연결 노드
          </label>

          {/* 선택된 노드 칩 */}
          {linkedNodeIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {linkedNodeIds.map(nodeId => {
                const node = nodes?.find(n => n.id === nodeId)
                const color = NODE_TYPE_COLORS[node?.type as NodeType] ?? '#6b7280'
                return (
                  <span
                    key={nodeId}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: color + '22',
                      border: `1px solid ${color}55`,
                      color,
                    }}
                  >
                    <span className="truncate max-w-[80px]">{node?.title ?? '알 수 없음'}</span>
                    <button
                      onClick={() => setLinkedNodeIds(ids => ids.filter(id => id !== nodeId))}
                      className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {/* 노드 검색 */}
          <div className="relative">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="노드 검색하여 연결..."
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
              onFocus={() => setShowNodeDropdown(true)}
              onBlur={() => setTimeout(() => setShowNodeDropdown(false), 150)}
            />
            {showNodeDropdown && (
              <div
                className="absolute z-20 top-full left-0 right-0 mt-0.5 rounded-lg shadow-xl overflow-hidden border"
                style={{ background: '#161b22', borderColor: '#30363d', maxHeight: '140px', overflowY: 'auto' }}
              >
                {filteredNodes.length === 0 ? (
                  <p className="px-3 py-2 text-xs" style={{ color: '#6e7681' }}>
                    {nodeSearch ? '일치하는 노드 없음' : nodes && nodes.filter(n => n.type !== 'group').length === 0 ? '노드 없음' : '검색어를 입력하세요'}
                  </p>
                ) : (
                  filteredNodes.slice(0, 6).map(node => {
                    const color = NODE_TYPE_COLORS[node.type as NodeType] ?? '#6b7280'
                    return (
                      <button
                        key={node.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
                        style={{ color: '#c9d1d9', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#21262d')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onMouseDown={() => {
                          setLinkedNodeIds(ids => [...ids, node.id])
                          setNodeSearch('')
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate flex-1">{node.title}</span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: '#6e7681' }}>{node.type}</span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 편집 탭 */}
      <div className="flex border-b border-gray-800">
        {(['write', 'preview'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 text-xs font-medium transition-colors',
              tab === t ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {t === 'write' ? '작성' : '미리보기'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'write' ? (
          <textarea
            className="w-full h-full bg-transparent text-sm text-gray-200 p-4 focus:outline-none resize-none font-mono leading-relaxed"
            placeholder="마크다운으로 작성하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="p-4 prose prose-invert prose-sm max-w-none">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-gray-500 text-xs">내용이 없습니다</p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
