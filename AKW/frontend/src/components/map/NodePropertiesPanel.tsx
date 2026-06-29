import { useState, useEffect, useRef } from 'react'
import { Save, FileText, Settings2, ArrowLeft, Edit2, Search, Plus, FolderOpen, LayoutDashboard, Trash2, ArrowRight, Link2Off, Network } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'
import { useNodes, useUpdateNode } from '@/hooks/useNodes'
import { useEdges, useUpdateEdge, useDeleteEdge } from '@/hooks/useEdges'
import { useDocument, useNodeDocuments, useVersionDocuments, useDeleteDocument } from '@/hooks/useDocuments'
import { useDocumentStore } from '@/store/documentStore'
import { useRelationTypeStore } from '@/store/relationTypeStore'
import { DocumentEditor } from '@/components/document/DocumentEditor'
import { DocumentViewer } from '@/components/document/DocumentViewer'
import { DocTypeBadge, NodeTypeBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/lib/cn'
import {
  NODE_TYPES, NODE_STATUSES, NODE_STATUS_COLORS, NODE_STATUS_LABELS,
  NODE_TYPE_COLORS, type NodeType, type NodeStatus,
} from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ArchitectureNode } from '@/types'

type Tab = 'props' | 'docs'

interface Props {
  projectId: string
  versionId: string
}

const AREA_COLORS = [
  { text: '#60a5fa' },
  { text: '#a78bfa' },
  { text: '#4ade80' },
  { text: '#fb923c' },
  { text: '#9ca3af' },
]

// ── 문서 목록 공통 UI ─────────────────────────────────────────────────────────
function DocList({
  docs,
  isLoading,
  onSelect,
  onNew,
}: {
  docs: { id: string; title: string; type: string; updated_at: string; linked_node_ids?: string[] }[] | undefined
  isLoading: boolean
  onSelect: (id: string, linkedNodeIds?: string[]) => void
  onNew: () => void
}) {
  const deleteDocument = useDeleteDocument()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    await deleteDocument.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  return (
    <>
      <div className="flex justify-end px-3 py-1.5 border-b border-gray-800/50">
        <button
          onClick={onNew}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={13} />
          새 문서
        </button>
      </div>
      {isLoading ? (
        <Spinner className="mx-auto mt-6" />
      ) : (
        <>
          {(!docs || docs.length === 0) && (
            <p className="text-xs text-gray-500 text-center mt-4 px-3">연결된 문서가 없습니다</p>
          )}
          {docs?.map(doc => (
            <div
              key={doc.id}
              className="group px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
              onClick={() => onSelect(doc.id, doc.linked_node_ids)}
            >
              <div className="flex items-center gap-2">
                <DocTypeBadge type={doc.type} />
                <span className="text-sm text-gray-200 truncate flex-1">{doc.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDeleteId(doc.id) }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 rounded flex-shrink-0"
                  title="문서 삭제"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
              </p>
            </div>
          ))}
        </>
      )}

      <Modal open={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)} title="문서 삭제">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(null)}>취소</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteDocument.isPending}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── 엣지 패널 ─────────────────────────────────────────────────────────────────
function EdgePanel({ edgeId, versionId }: { edgeId: string; versionId: string }) {
  const { data: nodes } = useNodes(versionId)
  const { data: edges } = useEdges(versionId)
  const updateEdge = useUpdateEdge(versionId)
  const deleteEdge = useDeleteEdge(versionId)
  const { setSelectedEdge } = useMapStore()
  const { types: relationTypes } = useRelationTypeStore()

  const edge = edges?.find(e => e.id === edgeId)
  const sourceNode = nodes?.find(n => n.id === edge?.source_id)
  const targetNode = nodes?.find(n => n.id === edge?.target_id)
  const currentType = relationTypes.find(rt => rt.id === edge?.relation_type)

  const handleDelete = async () => {
    if (!edge) return
    await deleteEdge.mutateAsync({ id: edgeId })
    setSelectedEdge(null)
  }

  if (!edge) return <Spinner className="mx-auto mt-10" />

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 p-3 space-y-3">
        <div className="flex items-center gap-1.5">
          <Link2Off size={13} className="text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">연결 엣지</span>
        </div>

        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">출발</p>
            <p className="text-sm font-medium text-white truncate">{sourceNode?.title ?? '알 수 없음'}</p>
          </div>
          <ArrowRight size={14} className="text-gray-600 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-gray-400 mb-0.5">도착</p>
            <p className="text-sm font-medium text-white truncate">{targetNode?.title ?? '알 수 없음'}</p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">관계 타입</label>
          <div className="grid grid-cols-2 gap-1.5">
            {relationTypes.map(rt => {
              const selected = edge.relation_type === rt.id
              return (
                <button
                  key={rt.id}
                  onClick={() => updateEdge.mutate({ id: edgeId, relation_type: rt.id })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all text-xs"
                  style={{
                    borderColor: selected ? rt.color : '#374151',
                    backgroundColor: selected ? rt.color + '18' : 'transparent',
                    color: selected ? rt.color : '#6b7280',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rt.color }} />
                  {rt.label}
                </button>
              )
            })}
          </div>
        </div>

        {currentType && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentType.color }}
            />
            <span className="text-xs" style={{ color: currentType.color }}>{currentType.label}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <Button
          variant="danger"
          size="sm"
          className="w-full"
          onClick={handleDelete}
          disabled={deleteEdge.isPending}
        >
          <Trash2 size={12} /> 엣지 삭제
        </Button>
      </div>
    </div>
  )
}

// ── 프로젝트 문서 패널 (노드 미선택 시) ──────────────────────────────────────
function ProjectDocsPanel({
  versionId,
  projectId: _projectId,
}: {
  versionId: string
  projectId: string
}) {
  void _projectId
  const { data: allDocs, isLoading } = useVersionDocuments(versionId)
  const { setActiveDocument, startNewDocument } = useDocumentStore()
  const { setSelectedNode, setPendingFocusNode } = useMapStore()

  const docs = allDocs?.filter(d => !d.linked_node_ids?.length)

  const handleSelect = (id: string, linkedNodeIds?: string[]) => {
    setActiveDocument(id)
    if (linkedNodeIds?.length) {
      setSelectedNode(linkedNodeIds[0])
      setPendingFocusNode(linkedNodeIds[0])
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800">
        <FolderOpen size={14} className="text-blue-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-200 flex-1">프로젝트 문서</span>
        <span className="text-xs text-gray-500">{docs?.length ?? 0}개</span>
      </div>
      <p className="text-[11px] text-gray-600 px-3 py-2 border-b border-gray-800/50">
        특정 노드에 속하지 않는 전체 문서입니다
      </p>
      <div className="flex-1 overflow-y-auto">
        <DocList
          docs={docs}
          isLoading={isLoading}
          onSelect={handleSelect}
          onNew={startNewDocument}
        />
      </div>
    </div>
  )
}

// ── 영역 패널 (group 노드 선택 시) ────────────────────────────────────────────
function AreaPanel({ node, versionId }: { node: ArchitectureNode; versionId: string }) {
  const colorIdx = (node.metadata_?.colorIdx as number) ?? 0
  const color = AREA_COLORS[colorIdx % AREA_COLORS.length]

  const { data: allNodes } = useNodes(versionId)
  const { data: allDocs, isLoading } = useVersionDocuments(versionId)
  const deleteDocument = useDeleteDocument()
  const { setActiveDocument, startNewDocument } = useDocumentStore()
  const { setSelectedNode, setPendingFocusNode } = useMapStore()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // 영역 내 자식 노드
  const childNodes = allNodes?.filter(n => n.parent_id === node.id) ?? []
  const childNodeIds = childNodes.map(n => n.id)
  const relevantIds = new Set([node.id, ...childNodeIds])

  // 영역 또는 자식 노드에 연결된 문서 전체
  const docs = allDocs?.filter(d => d.linked_node_ids?.some(id => relevantIds.has(id))) ?? []

  // 영역 자체 문서 vs 노드별 문서 분리
  const areaDocs = docs.filter(d => d.linked_node_ids?.includes(node.id))
  const childDocsList = docs.filter(d => !d.linked_node_ids?.includes(node.id))

  // 노드별 그룹핑
  const nodeGroupOrder: string[] = []
  const nodeGroupMap = new Map<string, typeof docs>()
  childDocsList.forEach(doc => {
    const nodeId = doc.linked_node_ids!.find(id => childNodeIds.includes(id))
    if (!nodeId) return
    if (!nodeGroupMap.has(nodeId)) { nodeGroupMap.set(nodeId, []); nodeGroupOrder.push(nodeId) }
    nodeGroupMap.get(nodeId)!.push(doc)
  })

  const handleSelect = (id: string, linkedNodeIds?: string[]) => {
    setActiveDocument(id)
    if (linkedNodeIds?.length) {
      setSelectedNode(linkedNodeIds[0])
      setPendingFocusNode(linkedNodeIds[0])
    }
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    await deleteDocument.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const DocItem = ({ doc }: { doc: NonNullable<typeof allDocs>[0] }) => (
    <div
      className="group relative flex items-start gap-2 px-3 py-2.5 border-b border-gray-800/40 cursor-pointer transition-colors hover:bg-gray-800/40"
      onClick={() => handleSelect(doc.id, doc.linked_node_ids)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <DocTypeBadge type={doc.type} />
        </div>
        <p className="text-sm font-medium leading-tight truncate text-gray-200">{doc.title}</p>
        <p className="text-[10px] mt-0.5 text-gray-600">
          {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(doc.id) }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 mt-0.5 text-gray-600 hover:text-red-400"
        title="문서 삭제"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.text }} />
        <LayoutDashboard size={13} style={{ color: color.text }} className="flex-shrink-0" />
        <span className="text-sm font-medium flex-1 truncate" style={{ color: color.text }}>{node.title}</span>
        <button
          onClick={startNewDocument}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
          title="새 문서"
        >
          <Plus size={11} /> New
        </button>
      </div>

      {isLoading && <Spinner className="mx-auto mt-6" />}

      {!isLoading && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4">
          <FileText size={20} className="text-gray-700" />
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            이 영역에 연결된 문서가 없습니다
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* 영역 자체 문서 */}
        {areaDocs.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.text }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">영역 문서</span>
              <span className="text-[10px] text-gray-700 ml-auto">{areaDocs.length}</span>
            </div>
            {areaDocs.map(doc => <DocItem key={doc.id} doc={doc} />)}
          </>
        )}

        {/* 노드별 문서 */}
        {nodeGroupOrder.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 mt-1">
              <Network size={11} className="text-gray-600" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">노드별 문서</span>
              <span className="text-[10px] text-gray-700 ml-auto">{childDocsList.length}</span>
            </div>
            {nodeGroupOrder.map(nodeId => {
              const childNode = childNodes.find(n => n.id === nodeId)
              const groupDocs = nodeGroupMap.get(nodeId)!
              const typeColor = NODE_TYPE_COLORS[childNode?.type as NodeType] ?? '#6b7280'
              return (
                <div key={nodeId}>
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColor }} />
                    <span className="text-xs font-semibold text-gray-400 truncate flex-1">
                      {childNode?.title ?? '알 수 없음'}
                    </span>
                    <span className="text-[10px] text-gray-700">{groupDocs.length}</span>
                  </div>
                  <div className="pl-2">
                    {groupDocs.map(doc => <DocItem key={doc.id} doc={doc} />)}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <Modal open={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)} title="문서 삭제">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(null)}>취소</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteDocument.isPending}>삭제</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export function NodePropertiesPanel({ projectId, versionId }: Props) {
  const { selectedNodeId, selectedEdgeId, enterDrillDown, setSelectedNode, setPendingFocusNode } = useMapStore()
  const { activePanelView, activeDocumentId, setActiveDocument, setView, startNewDocument } = useDocumentStore()
  const { data: nodes } = useNodes(versionId)
  const { data: edges } = useEdges(versionId)
  const updateNode = useUpdateNode(versionId)
  const { data: nodeDocs, isLoading: docsLoading } = useNodeDocuments(selectedNodeId)
  const { data: viewingDoc } = useDocument(activeDocumentId)

  // 문서 뷰 모드 진입 시 연결된 노드로 자동 포커스
  useEffect(() => {
    if (activePanelView !== 'view') return
    if (!viewingDoc?.linked_node_ids?.length) return
    setSelectedNode(viewingDoc.linked_node_ids[0])
    setPendingFocusNode(viewingDoc.linked_node_ids[0])
  }, [viewingDoc?.id, activePanelView]) // eslint-disable-line

  const [tab, setTab] = useState<Tab>('props')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState<NodeStatus | ''>('')
  const [description, setDescription] = useState('')

  const prevNodeIdRef = useRef<string | null>(null)

  const node = nodes?.find(n => n.id === selectedNodeId)
  const childCount = selectedNodeId ? (edges ?? []).filter(e => e.source_id === selectedNodeId).length : 0

  useEffect(() => {
    if (node && node.type !== 'group') {
      const prevId = prevNodeIdRef.current
      // 이전 노드가 있고, 편집 중이었고, 노드가 바뀌었을 때
      if (prevId && prevId !== node.id && editing) {
        const confirmed = window.confirm('저장하지 않은 변경 사항이 있습니다. 저장하시겠습니까?')
        if (confirmed) {
          // 현재 편집 중인 값(title/type/status/description state)으로 이전 노드 저장
          updateNode.mutate({
            id: prevId,
            title,
            type,
            metadata_: { status: status || undefined, description: description || undefined },
            author: 'user',
          })
        }
      }
      prevNodeIdRef.current = node.id
      setTitle(node.title)
      setType(node.type)
      setStatus((node.metadata_?.status as NodeStatus) ?? '')
      setDescription((node.metadata_?.description as string) ?? '')
      setEditing(false)
    }
  }, [node?.id]) // eslint-disable-line

  // ── 문서 보기 / 편집 오버레이 ──────────────────────────────────────────────
  if (activePanelView === 'view' && activeDocumentId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800">
          <button onClick={() => { setView('list'); setTab('docs') }} className="text-gray-400 hover:text-white">
            <ArrowLeft size={15} />
          </button>
          <span className="text-sm text-gray-300 flex-1 truncate">문서 보기</span>
          <button onClick={() => setView('edit')} className="text-gray-400 hover:text-white">
            <Edit2 size={13} />
          </button>
        </div>
        <DocumentViewer docId={activeDocumentId} />
      </div>
    )
  }

  if (activePanelView === 'edit') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800">
          <button
            onClick={() => activeDocumentId ? setView('view') : setView('list')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-sm text-gray-300">{activeDocumentId ? '문서 편집' : '새 문서'}</span>
        </div>
        <DocumentEditor
          docId={activeDocumentId}
          projectId={projectId}
          versionId={versionId}
          linkedNodeId={selectedNodeId}
        />
      </div>
    )
  }

  // ── 엣지 선택 → 엣지 패널 ────────────────────────────────────────────────────
  if (selectedEdgeId && !selectedNodeId) {
    return <EdgePanel edgeId={selectedEdgeId} versionId={versionId} />
  }

  // ── 노드 미선택 → 프로젝트 문서 ────────────────────────────────────────────
  if (!selectedNodeId) {
    return <ProjectDocsPanel versionId={versionId} projectId={projectId} />
  }

  // ── 영역(group) 노드 선택 ───────────────────────────────────────────────────
  if (node?.type === 'group') {
    return <AreaPanel node={node} versionId={versionId} />
  }

  // ── 노드 로딩 중 ────────────────────────────────────────────────────────────
  if (!node) {
    return <Spinner className="mx-auto mt-10" />
  }

  // ── 일반 노드 속성 패널 ────────────────────────────────────────────────────
  const typeColor = NODE_TYPE_COLORS[node.type as NodeType] ?? '#6b7280'
  const statusColor = status ? NODE_STATUS_COLORS[status as NodeStatus] : undefined

  const handleSave = async () => {
    await updateNode.mutateAsync({
      id: node.id,
      title,
      type,
      metadata_: { ...node.metadata_, status: status || undefined, description: description || undefined },
      author: 'user',
    })
    setEditing(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Node header */}
      <div className="border-b border-gray-800 p-3 space-y-2.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white leading-snug flex-1 min-w-0 truncate">{node.title}</h3>
                {childCount > 0 && (
                  <button
                    onClick={() => enterDrillDown(node.id, node.title)}
                    className="flex-shrink-0 text-gray-500 hover:text-blue-400 transition-colors"
                    title="드릴다운"
                  >
                    <Search size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => editing ? setEditing(false) : setEditing(true)}
            className="text-gray-500 hover:text-white flex-shrink-0 transition-colors"
          >
            <Edit2 size={13} />
          </button>
        </div>

        {editing ? (
          <div className="flex gap-2">
            <select
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
              value={status}
              onChange={e => setStatus(e.target.value as NodeStatus | '')}
            >
              <option value="">상태 없음</option>
              {NODE_STATUSES.map(s => (
                <option key={s} value={s}>{NODE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <NodeTypeBadge type={node.type} />
            {status && statusColor && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statusColor + '22', color: statusColor }}
              >
                {NODE_STATUS_LABELS[status as NodeStatus]}
              </span>
            )}
          </div>
        )}

        {editing ? (
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="설명 (선택)"
          />
        ) : description ? (
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        ) : null}

        <div className="h-0.5 rounded-full" style={{ backgroundColor: typeColor }} />

        {editing && (
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>취소</Button>
            <Button size="sm" onClick={handleSave} disabled={updateNode.isPending}>
              <Save size={12} /> 저장
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['props', 'docs'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
              tab === t ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {t === 'props' ? <Settings2 size={12} /> : <FileText size={12} />}
            {t === 'props' ? '속성' : `문서 ${nodeDocs?.length ? `(${nodeDocs.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'props' && (
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">ID</label>
              <p className="text-[11px] text-gray-600 font-mono break-all">{node.id}</p>
            </div>
            {node.metadata_?.port && (
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">PORT</label>
                <p className="text-xs text-gray-400 font-mono">{String(node.metadata_.port)}</p>
              </div>
            )}
            {node.metadata_?.tech && (
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">TECH</label>
                <p className="text-xs text-gray-400">{String(node.metadata_.tech)}</p>
              </div>
            )}
            {/* 연결된 노드 목록 */}
            {(() => {
              const outgoing = (edges ?? []).filter(e => e.source_id === node.id)
              const incoming = (edges ?? []).filter(e => e.target_id === node.id)
              if (!outgoing.length && !incoming.length) return null
              return (
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">연결된 노드</label>
                  <div className="space-y-1">
                    {outgoing.map(e => {
                      const target = nodes?.find(n => n.id === e.target_id)
                      if (!target) return null
                      return (
                        <button
                          key={e.id}
                          onClick={() => { setSelectedNode(target.id); setPendingFocusNode(target.id) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-800 transition-colors group"
                        >
                          <span className="text-gray-600 text-[10px] font-mono flex-shrink-0">→</span>
                          <span className="text-xs text-gray-300 truncate flex-1 group-hover:text-white">{target.title}</span>
                          <span className="text-[9px] text-gray-600 flex-shrink-0 truncate max-w-[60px]">{e.relation_type}</span>
                        </button>
                      )
                    })}
                    {incoming.map(e => {
                      const source = nodes?.find(n => n.id === e.source_id)
                      if (!source) return null
                      return (
                        <button
                          key={e.id}
                          onClick={() => { setSelectedNode(source.id); setPendingFocusNode(source.id) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-800 transition-colors group"
                        >
                          <span className="text-gray-600 text-[10px] font-mono flex-shrink-0">←</span>
                          <span className="text-xs text-gray-300 truncate flex-1 group-hover:text-white">{source.title}</span>
                          <span className="text-[9px] text-gray-600 flex-shrink-0 truncate max-w-[60px]">{e.relation_type}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">마지막 수정</label>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(node.updated_at), { addSuffix: true, locale: ko })}
              </p>
            </div>
          </div>
        )}

        {tab === 'docs' && (
          <DocList
            docs={nodeDocs}
            isLoading={docsLoading}
            onSelect={(id, linkedNodeIds) => {
              setActiveDocument(id)
              if (linkedNodeIds?.length) {
                setSelectedNode(linkedNodeIds[0])
                setPendingFocusNode(linkedNodeIds[0])
              }
            }}
            onNew={startNewDocument}
          />
        )}
      </div>
    </div>
  )
}
