import { useState } from 'react'
import { Layers, History, FileText, Plus, Trash2 } from 'lucide-react'
import { VersionTree } from '@/components/version/VersionTree'
import { ChangelogPanel } from '@/components/version/ChangelogPanel'
import { DiffSelector } from '@/components/version/DiffSelector'
import { useProjectStore } from '@/store/projectStore'
import { useDocumentStore } from '@/store/documentStore'
import { useMapStore } from '@/store/mapStore'
import { useVersionDocuments, useDeleteDocument } from '@/hooks/useDocuments'
import { DocTypeBadge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/lib/cn'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  projectId: string
}

type Tab = 'versions' | 'changelog' | 'docs'

function DocsTab({ versionId }: { versionId: string }) {
  const { data: docs, isLoading } = useVersionDocuments(versionId)
  const { setActiveDocument, startNewDocument } = useDocumentStore()
  const { setSelectedNode, setPendingFocusNode } = useMapStore()
  const deleteDocument = useDeleteDocument()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    await deleteDocument.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6e7681' }}>
          Documents
        </span>
        <button
          onClick={startNewDocument}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: '#58a6ff' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#79b8ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#58a6ff')}
          title="새 문서 작성"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && <Spinner className="mx-auto mt-6" />}

        {!isLoading && (!docs || docs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#21262d' }}>
              <FileText size={16} style={{ color: '#484f58' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: '#8b949e' }}>문서 없음</p>
              <p className="text-xs mt-0.5" style={{ color: '#484f58' }}>New를 눌러 작성하세요</p>
            </div>
          </div>
        )}

        {docs?.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100 mb-0.5"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => {
              setActiveDocument(doc.id)
              if (doc.linked_node_ids?.length) {
                setSelectedNode(doc.linked_node_ids[0])
                setPendingFocusNode(doc.linked_node_ids[0])
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <DocTypeBadge type={doc.type} />
              </div>
              <p className="text-sm font-medium leading-tight truncate" style={{ color: '#c9d1d9' }}>
                {doc.title}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>
                {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
                {doc.linked_node_ids?.length > 0 && (
                  <span className="ml-1.5" style={{ color: '#3d6b9c' }}>
                    노드 {doc.linked_node_ids.length}개 연결
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setPendingDeleteId(doc.id) }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 mt-0.5"
              style={{ color: '#6e7681' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.background = '#30363d' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6e7681'; e.currentTarget.style.background = 'transparent' }}
              title="문서 삭제"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
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

export function LeftPanel({ projectId }: Props) {
  const [tab, setTab] = useState<Tab>('versions')
  const { activeVersionId } = useProjectStore()

  const TAB_DEFS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'versions', icon: <Layers size={12} />, label: '버전' },
    { id: 'changelog', icon: <History size={12} />, label: '이력' },
    { id: 'docs', icon: <FileText size={12} />, label: '문서' },
  ]

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d1117' }}>
      {/* Tab bar */}
      <div className="flex-shrink-0 flex px-3 pt-3 pb-0 gap-0.5" style={{ borderBottom: '1px solid #21262d' }}>
        {TAB_DEFS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors relative',
              tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            )}
            style={tab === id ? {
              background: '#161b22',
              borderTop: '1px solid #21262d',
              borderLeft: '1px solid #21262d',
              borderRight: '1px solid #21262d',
              marginBottom: '-1px',
            } : {}}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0" style={{ background: '#161b22' }}>
        {tab === 'versions' && (
          <>
            <DiffSelector projectId={projectId} />
            <VersionTree projectId={projectId} />
          </>
        )}

        {tab === 'changelog' && activeVersionId && (
          <ChangelogPanel versionId={activeVersionId} />
        )}
        {tab === 'changelog' && !activeVersionId && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#21262d' }}>
              <History size={16} className="text-gray-600" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">버전을 선택하면<br />변경 이력이 표시됩니다</p>
          </div>
        )}

        {tab === 'docs' && activeVersionId && (
          <DocsTab versionId={activeVersionId} />
        )}
        {tab === 'docs' && !activeVersionId && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#21262d' }}>
              <FileText size={16} className="text-gray-600" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">버전을 선택하면<br />문서 목록이 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
