import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import { useDocument } from '@/hooks/useDocuments'
import { documentsApi } from '@/api/documents'
import { useDocumentStore } from '@/store/documentStore'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { DOC_TYPES } from '@/lib/constants'
import { cn } from '@/lib/cn'

interface Props {
  docId: string | null
  projectId: string
  versionId: string
  linkedNodeId?: string | null
}

export function DocumentEditor({ docId, projectId, versionId, linkedNodeId }: Props) {
  const { data: doc, isLoading } = useDocument(docId)
  const { setActiveDocument, setView } = useDocumentStore()
  const qc = useQueryClient()
  const [title, setTitle] = useState(doc?.title ?? '')
  const [type, setType] = useState(doc?.type ?? 'planning')
  const [content, setContent] = useState('')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)

  if (isLoading) return <Spinner className="mx-auto mt-6" />

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const blob = new Blob([content], { type: 'text/markdown' })
      const formData = new FormData()
      formData.append('project_id', projectId)
      formData.append('version_id', versionId)
      formData.append('type', type)
      formData.append('title', title)
      formData.append('linked_node_ids', JSON.stringify(linkedNodeId ? [linkedNodeId] : []))
      formData.append('file', blob, 'document.md')
      const newDoc = await documentsApi.upload(formData)
      qc.invalidateQueries({ queryKey: ['documents'] })
      setActiveDocument(newDoc.id)
      setView('view')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 space-y-2 border-b border-gray-800">
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          placeholder="문서 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

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
