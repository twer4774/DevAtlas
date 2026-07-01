import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDocument } from '@/hooks/useDocuments'
import { documentsApi } from '@/api/documents'
import { Spinner } from '@/components/common/Spinner'

export function DocumentViewer({ docId }: { docId: string }) {
  const { data: doc, isLoading } = useDocument(docId)
  const [content, setContent] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!doc?.content_url) return
    setFetching(true)
    documentsApi.rawContent(docId)
      .then(setContent)
      .catch(() => setContent(''))
      .finally(() => setFetching(false))
  }, [doc?.id]) // eslint-disable-line

  if (isLoading || fetching) return <Spinner className="mx-auto mt-6" />
  if (!doc) return null

  if (!doc.content_url || content === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
        내용이 없습니다
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
