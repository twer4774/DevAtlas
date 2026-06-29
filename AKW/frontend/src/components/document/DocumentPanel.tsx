import { ArrowLeft, Edit2, Plus } from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { useMapStore } from '@/store/mapStore'
import { useNodeDocuments } from '@/hooks/useDocuments'
import { DocTypeBadge } from '@/components/common/Badge'
import { Spinner } from '@/components/common/Spinner'
import { DocumentEditor } from './DocumentEditor'
import { DocumentViewer } from './DocumentViewer'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  projectId: string
  versionId: string
}

export function DocumentPanel({ projectId, versionId }: Props) {
  const { activePanelView, activeDocumentId, setActiveDocument, setView, startNewDocument } = useDocumentStore()
  const { selectedNodeId } = useMapStore()
  const { data: docs, isLoading } = useNodeDocuments(selectedNodeId)

  if (activePanelView === 'view' && activeDocumentId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-white">
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
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
          <button
            onClick={() => activeDocumentId ? setView('view') : setView('list')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-sm text-gray-300">{activeDocumentId ? '문서 편집' : '새 문서'}</span>
        </div>
        <DocumentEditor docId={activeDocumentId} projectId={projectId} versionId={versionId} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {selectedNodeId ? '연결된 문서' : '문서'}
        </span>
        {selectedNodeId && (
          <button
            onClick={startNewDocument}
            className="text-gray-400 hover:text-white"
            title="새 문서 추가"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {!selectedNodeId ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
          노드를 선택하면 관련 문서가 표시됩니다
        </div>
      ) : isLoading ? (
        <Spinner className="mx-auto mt-6" />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {docs?.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-4">연결된 문서가 없습니다</p>
          )}
          {docs?.map((doc) => (
            <div
              key={doc.id}
              className="px-3 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
              onClick={() => setActiveDocument(doc.id)}
            >
              <div className="flex items-center gap-2">
                <DocTypeBadge type={doc.type} />
                <span className="text-sm text-gray-200 truncate flex-1">{doc.title}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
