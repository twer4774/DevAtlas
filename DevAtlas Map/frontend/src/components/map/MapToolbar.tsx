import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  ZoomIn, ZoomOut, Maximize2, ChevronsDown, ChevronsUp,
  Plus, Undo2, Redo2, Wand2, Keyboard, Filter, Spline, RectangleHorizontal, FileText,
  FolderOpen, Network, Download, Search,
} from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { useEdgeFilterStore } from '@/store/edgeFilterStore'
import { useRelationTypeStore } from '@/store/relationTypeStore'
import { useQueryClient } from '@tanstack/react-query'
import { useNodes as useNodesData, useCreateNode, useUpdateNode } from '@/hooks/useNodes'
import { useEdges } from '@/hooks/useEdges'
import { useVersionDocuments } from '@/hooks/useDocuments'
import { useDocumentStore } from '@/store/documentStore'
import { DocTypeBadge } from '@/components/common/Badge'
import {
  PLACE_NODE_W,
  PLACE_NODE_H,
  PLACE_GROUP_W,
  PLACE_GROUP_H,
  findFreeTopLevelPos,
  findFreeChildInGroupPos,
} from '@/lib/mapPlacement'
import { applyGroupFitOptimistic } from '@/lib/groupFit'
import { useHistory } from '@/hooks/useHistory'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { RelationTypeManager } from './RelationTypeManager'
import { NODE_TYPES, INFRA_TYPES, getNodeTypeLabel, NODE_TYPE_COLORS, type NodeType } from '@/lib/constants'
import { generateExportHtml } from '@/lib/exportHtml'
import { buildLayout } from '@/lib/nodeLayout'
import { cn } from '@/lib/cn'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

/** 패딩: 영역 헤더 아래 첫 줄에 노드 두기 */
const GROUP_INNER_X = 20
const GROUP_INNER_Y = 52

const SHORTCUTS = [
  { keys: ['⌘', 'Z'], label: '실행 취소' },
  { keys: ['⌘', '⇧', 'Z'], label: '다시 실행' },
  { keys: ['⌘', '⇧', 'L'], label: '자동 정렬' },
  { keys: ['Delete'], label: '선택 노드 삭제' },
  { keys: ['Backspace'], label: '선택 노드 삭제' },
  { keys: ['Esc'], label: '선택 해제' },
]

interface Props {
  versionId: string
  onSearchOpen?: () => void
}

export function MapToolbar({ versionId, onSearchOpen }: Props) {
  const { zoomIn, zoomOut, fitView, getNodes, getEdges, getViewport } = useReactFlow()
  const { expandAll, collapseAll, triggerAutoLayout } = useMapStore()
  const { hiddenTypes, toggleType, showAll } = useEdgeFilterStore()
  const { types: relationTypes } = useRelationTypeStore()
  const { data: nodes } = useNodesData(versionId)
  const { data: edges } = useEdges(versionId)
  const qc = useQueryClient()
  const createNode = useCreateNode(versionId)
  const updateGroup = useUpdateNode(versionId)
  const { undo, redo, canUndo, canRedo } = useHistory()
  const { data: docs } = useVersionDocuments(versionId)
  const { setActiveDocument, startNewDocument } = useDocumentStore()
  const { setSelectedNode, setPendingFocusNode } = useMapStore()

  const [addOpen, setAddOpen] = useState(false)
  const [addAreaOpen, setAddAreaOpen] = useState(false)
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Program')
  const [areaTitle, setAreaTitle] = useState('')
  const [areaColorIdx, setAreaColorIdx] = useState(0)

  const AREA_COLORS = [
    { label: '파랑', text: '#60a5fa' },
    { label: '보라', text: '#a78bfa' },
    { label: '초록', text: '#4ade80' },
    { label: '주황', text: '#fb923c' },
    { label: '회색', text: '#9ca3af' },
  ]

  const { drillRootId, selectedNodeId } = useMapStore()
  const hasActiveFilter = hiddenTypes.size > 0

  const handleExpand = () => {
    const all = nodes ?? []
    const allEdges = edges ?? []
    if (drillRootId) {
      const subtreeIds: string[] = []
      const q = [drillRootId]
      while (q.length) {
        const id = q.shift()!
        subtreeIds.push(id)
        allEdges.filter(e => e.source_id === id).forEach(e => q.push(e.target_id))
      }
      expandAll(subtreeIds)
    } else {
      expandAll(all.map(n => n.id))
    }
  }

  const getViewportCenter = () => {
    const vp = getViewport()
    return {
      x: (-vp.x + window.innerWidth / 2) / vp.zoom,
      y: (-vp.y + window.innerHeight / 2) / vp.zoom,
    }
  }

  const handleAdd = async () => {
    if (!title.trim()) return
    const rfNodes = getNodes()

    const targetGroup = nodes?.find(n => n.id === selectedNodeId && n.type === 'group')

    if (targetGroup) {
      const childrenRf = rfNodes.filter(n => n.parentId === targetGroup.id)
      const innerPos = findFreeChildInGroupPos(
        childrenRf,
        PLACE_NODE_W,
        PLACE_NODE_H,
        GROUP_INNER_X,
        GROUP_INNER_Y,
      )
      await createNode.mutateAsync({
        title,
        type,
        position: innerPos,
        parent_id: targetGroup.id,
      })
      await qc.refetchQueries({ queryKey: ['nodes', versionId] })
      const fitPatch = applyGroupFitOptimistic(qc, versionId, targetGroup.id)
      if (fitPatch) {
        await updateGroup.mutateAsync({ id: fitPatch.id, metadata_: fitPatch.metadata_ })
      }
    } else {
      const center = getViewportCenter()
      const startX = center.x - PLACE_NODE_W / 2
      const startY = center.y - PLACE_NODE_H / 2
      const position = findFreeTopLevelPos(rfNodes, PLACE_NODE_W, PLACE_NODE_H, startX, startY)
      await createNode.mutateAsync({ title, type, position })
    }
    setTitle('')
    setType('Program')
    setAddOpen(false)
  }

  const handleExportHtml = async () => {
    // Build layout with ALL nodes expanded so collapsed children are included
    const allExpandedIds = new Set((nodes ?? []).map(n => n.id))
    const { nodes: rfNodes, edges: rfEdges } = buildLayout(
      nodes ?? [],
      edges ?? [],
      allExpandedIds,
      false,
      new Set(),       // show all edge types in export
      null,
      relationTypes,
    )
    // Fetch markdown content for each document at export time
    const docsWithContent = await Promise.all(
      (docs ?? []).map(async d => {
        const content = d.content_url
          ? await fetch(`/api/documents/${d.id}/raw`)
              .then(r => {
                const ct = r.headers.get('content-type') ?? ''
                if (!r.ok || ct.includes('text/html')) return null
                return r.text()
              })
              .catch(() => null)
          : null
        return { ...d, content }
      })
    )
    const html = generateExportHtml(rfNodes, rfEdges, docsWithContent, 'Architecture Map')
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `architecture-map-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddArea = async () => {
    if (!areaTitle.trim()) return
    const center = getViewportCenter()
    const startX = center.x - PLACE_GROUP_W / 2
    const startY = center.y - PLACE_GROUP_H / 2
    const position = findFreeTopLevelPos(getNodes(), PLACE_GROUP_W, PLACE_GROUP_H, startX, startY)
    await createNode.mutateAsync({
      title: areaTitle,
      type: 'group',
      position,
      metadata_: { width: PLACE_GROUP_W, height: PLACE_GROUP_H, colorIdx: areaColorIdx },
    })
    setAreaTitle('')
    setAreaColorIdx(0)
    setAddAreaOpen(false)
  }

  return (
    <>
      <div className={`absolute ${drillRootId ? 'top-14' : 'top-4'} left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/95 border border-gray-700 rounded-full px-2 py-1 shadow-xl z-10 backdrop-blur-sm`}>
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="실행 취소 (⌘Z)"
          className={cn('p-1.5 rounded transition-colors', canUndo ? 'text-gray-400 hover:text-white' : 'text-gray-700 cursor-not-allowed')}
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="다시 실행 (⌘⇧Z)"
          className={cn('p-1.5 rounded transition-colors', canRedo ? 'text-gray-400 hover:text-white' : 'text-gray-700 cursor-not-allowed')}
        >
          <Redo2 size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* Create */}
        <button onClick={() => setAddOpen(true)} className="p-1.5 text-blue-400 hover:text-blue-300 rounded transition-colors" title="노드 추가">
          <Plus size={15} />
        </button>
        <button onClick={() => setAddAreaOpen(true)} className="p-1.5 text-blue-400 hover:text-blue-300 rounded transition-colors" title="영역 추가">
          <RectangleHorizontal size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* Search */}
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            title="노드 검색 (⌘K)"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-white/8"
          >
            <Search size={13} />
            <span className="text-[11px]">검색</span>
            <span className="text-[9px] text-gray-600 border border-white/10 rounded px-1 py-0.5 leading-none">⌘K</span>
          </button>
        )}
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* View / Zoom */}
        <button onClick={() => zoomOut()} title="줌 아웃" className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
          <ZoomOut size={15} />
        </button>
        <button onClick={() => zoomIn()} title="줌 인" className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
          <ZoomIn size={15} />
        </button>
        <button onClick={() => fitView()} title="전체 보기" className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
          <Maximize2 size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* Expand / Collapse / Auto-layout */}
        <button onClick={handleExpand} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="모두 펼치기">
          <ChevronsDown size={15} />
        </button>
        <button onClick={collapseAll} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="모두 접기">
          <ChevronsUp size={15} />
        </button>
        <button
          onClick={triggerAutoLayout}
          className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
          title="자동 정렬 (⌘⇧L)"
        >
          <Wand2 size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* 관계 필터 */}
        <button
          onClick={() => setFilterOpen(true)}
          className={cn(
            'p-1.5 rounded transition-colors relative',
            hasActiveFilter ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-white'
          )}
          title="관계 타입 필터"
        >
          <Filter size={15} />
          {hasActiveFilter && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        {/* 관계 타입 설정 */}
        <button
          onClick={() => setManageOpen(true)}
          className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
          title="관계 타입 설정"
        >
          <Spline size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />
        <button
          onClick={() => setDocsOpen(v => !v)}
          className={cn('p-1.5 rounded transition-colors relative', docsOpen ? 'text-indigo-400' : 'text-gray-400 hover:text-white')}
          title="문서 목록"
        >
          <FileText size={15} />
          {docs && docs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
              {docs.length > 9 ? '9+' : docs.length}
            </span>
          )}
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />
        <button
          onClick={handleExportHtml}
          className="p-1.5 text-gray-400 hover:text-emerald-400 rounded transition-colors"
          title="HTML로 내보내기"
        >
          <Download size={15} />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1" />
        <button onClick={() => setShortcutOpen(true)} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="단축키 목록">
          <Keyboard size={15} />
        </button>
      </div>

      {/* 문서 패널 */}
      {docsOpen && (
        <div
          className="absolute z-20 shadow-2xl rounded-xl overflow-hidden"
          style={{
            top: drillRootId ? '68px' : '54px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '340px',
            maxHeight: '420px',
            background: '#0d1117',
            border: '1px solid #21262d',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#21262d' }}>
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color: '#6e7aff' }} />
              <span className="text-sm font-semibold" style={{ color: '#e6edf3' }}>문서</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#1f2937', color: '#8b949e' }}>
                {docs?.length ?? 0}
              </span>
            </div>
            <button
              onClick={startNewDocument}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: '#58a6ff' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#79b8ff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#58a6ff')}
            >
              <Plus size={11} /> 새 문서
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
            {(!docs || docs.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <FileText size={20} style={{ color: '#30363d' }} />
                <p className="text-xs" style={{ color: '#6e7681' }}>문서가 없습니다</p>
              </div>
            )}

            {(() => {
              if (!docs || docs.length === 0) return null
              const projectDocs = docs.filter(d => !d.linked_node_ids?.length)
              const linkedDocs = docs.filter(d => d.linked_node_ids && d.linked_node_ids.length > 0)

              const nodeGroupOrder: string[] = []
              const nodeGroupMap = new Map<string, typeof docs>()
              linkedDocs.forEach(doc => {
                const nodeId = doc.linked_node_ids![0]
                if (!nodeGroupMap.has(nodeId)) {
                  nodeGroupMap.set(nodeId, [])
                  nodeGroupOrder.push(nodeId)
                }
                nodeGroupMap.get(nodeId)!.push(doc)
              })

              const DocBtn = ({ doc }: { doc: typeof docs[0] }) => (
                <button
                  key={doc.id}
                  className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#161b22')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setActiveDocument(doc.id)
                    if (doc.linked_node_ids?.length) {
                      setSelectedNode(doc.linked_node_ids[0])
                      setPendingFocusNode(doc.linked_node_ids[0])
                    }
                    setDocsOpen(false)
                  }}
                >
                  <DocTypeBadge type={doc.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#c9d1d9' }}>{doc.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>
                      {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
                    </p>
                  </div>
                </button>
              )

              const SectionHeader = ({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) => (
                <div className="flex items-center gap-2 px-4 py-2 mt-1" style={{ borderTop: '1px solid #21262d' }}>
                  <span style={{ color: '#484f58' }}>{icon}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6e7681' }}>{label}</span>
                  <span className="text-[10px] px-1.5 rounded-full ml-auto" style={{ background: '#21262d', color: '#6e7681' }}>{count}</span>
                </div>
              )

              return (
                <>
                  {projectDocs.length > 0 && (
                    <>
                      <SectionHeader icon={<FolderOpen size={11} />} label="프로젝트 문서" count={projectDocs.length} />
                      {projectDocs.map(doc => <DocBtn key={doc.id} doc={doc} />)}
                    </>
                  )}
                  {nodeGroupOrder.length > 0 && (
                    <>
                      <SectionHeader icon={<Network size={11} />} label="노드별 문서" count={linkedDocs.length} />
                      {nodeGroupOrder.map(nodeId => {
                        const node = nodes?.find(n => n.id === nodeId)
                        const groupDocs = nodeGroupMap.get(nodeId)!
                        const typeColor = NODE_TYPE_COLORS[node?.type as NodeType] ?? '#6b7280'
                        return (
                          <div key={nodeId}>
                            <div className="flex items-center gap-2 px-4 py-1.5">
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor }} />
                              <span className="text-xs font-semibold truncate flex-1" style={{ color: '#8b949e' }}>
                                {node?.title ?? '알 수 없음'}
                              </span>
                              <span className="text-[10px]" style={{ color: '#484f58' }}>{groupDocs.length}</span>
                            </div>
                            <div className="pl-2">
                              {groupDocs.map(doc => <DocBtn key={doc.id} doc={doc} />)}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}


      {/* 관계 타입 설정 모달 */}
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="관계 타입 설정">
        <RelationTypeManager />
      </Modal>

      {/* 관계 필터 모달 */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="관계 타입 필터">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">체크 해제한 타입의 연결선은 숨겨집니다</p>
          <div className="space-y-1.5">
            {relationTypes.map(rt => {
              const visible = !hiddenTypes.has(rt.id)
              return (
                <button
                  key={rt.id}
                  onClick={() => toggleType(rt.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all"
                  style={{
                    borderColor: visible ? rt.color + '60' : '#374151',
                    backgroundColor: visible ? rt.color + '10' : 'transparent',
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: visible ? rt.color : '#374151' }}
                  />
                  <span className={cn('text-sm flex-1 text-left', visible ? 'text-gray-200' : 'text-gray-500')}>
                    {rt.label}
                  </span>
                  <span className={cn('text-xs', visible ? 'text-gray-400' : 'text-gray-600')}>
                    {visible ? '표시' : '숨김'}
                  </span>
                </button>
              )
            })}
          </div>
          {hasActiveFilter && (
            <button
              onClick={showAll}
              className="w-full text-xs text-blue-400 hover:text-blue-300 py-1.5 transition-colors"
            >
              모두 표시로 초기화
            </button>
          )}
        </div>
      </Modal>

      {/* 단축키 모달 */}
      <Modal open={shortcutOpen} onClose={() => setShortcutOpen(false)} title="키보드 단축키">
        <div className="space-y-1.5">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-sm text-gray-300">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <kbd key={ki} className="px-1.5 py-0.5 text-[11px] font-mono bg-gray-800 border border-gray-600 rounded text-gray-300">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 영역 추가 모달 */}
      <Modal open={addAreaOpen} onClose={() => setAddAreaOpen(false)} title="영역 추가">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">영역 이름</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={areaTitle}
              onChange={(e) => setAreaTitle(e.target.value)}
              placeholder="예: 메인서버, 클라이언트, 엣지서버"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddArea() }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">색상</label>
            <div className="flex gap-2">
              {AREA_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setAreaColorIdx(i)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.text + '22',
                    borderColor: areaColorIdx === i ? c.text : 'transparent',
                  }}
                  title={c.label}
                >
                  <span className="sr-only">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddAreaOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleAddArea} disabled={createNode.isPending}>추가</Button>
          </div>
        </div>
      </Modal>

      {/* 노드 추가 모달 */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="노드 추가">
        <div className="space-y-4">
          {nodes?.some(n => n.id === selectedNodeId && n.type === 'group') && (
            <p className="text-xs text-blue-400/90 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
              영역(대시보드 그룹)이 선택되어 있습니다. 새 노드는 이 영역 안에 추가되고, 필요하면 영역 크기가 자동으로 늘어납니다.
            </p>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">이름</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="노드 이름"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">타입</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <optgroup label="개념 타입">
                {NODE_TYPES.map((t) => (
                  <option key={t} value={t}>{getNodeTypeLabel(t)}</option>
                ))}
              </optgroup>
              <optgroup label="인프라 타입">
                {INFRA_TYPES.map((t) => (
                  <option key={t} value={t}>{getNodeTypeLabel(t)}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleAdd} disabled={createNode.isPending}>추가</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
