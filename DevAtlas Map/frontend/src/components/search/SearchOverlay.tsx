import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import { useSearch } from '@/hooks/useSearch'
import { NodeTypeBadge, DocTypeBadge } from '@/components/common/Badge'
import { Spinner } from '@/components/common/Spinner'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { useMapStore } from '@/store/mapStore'

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useUIStore()
  const { activeProjectId, setActiveVersion } = useProjectStore()
  const { setActiveDocument } = useDocumentStore()
  const { setSelectedNode, setPendingFocusNode } = useMapStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQ = useDebounce(q, 300)
  const { data, isLoading } = useSearch(debouncedQ, activeProjectId ?? undefined)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQ('')
    }
  }, [searchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchOpen ? closeSearch() : useUIStore.getState().openSearch()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, closeSearch])

  if (!searchOpen) return null

  const handleNodeClick = (result: { id: string; version_id: string }) => {
    setActiveVersion(result.version_id)
    setSelectedNode(result.id)
    setPendingFocusNode(result.id)
    closeSearch()
  }

  const handleDocClick = (result: { id: string }) => {
    setActiveDocument(result.id)
    closeSearch()
  }

  const handleVersionClick = (result: { id: string; project_id: string }) => {
    setActiveVersion(result.id)
    navigate(`/projects/${result.project_id}`)
    closeSearch()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/60" onClick={closeSearch} />
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
            placeholder="노드, 문서, 버전 검색..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {isLoading && <Spinner className="w-4 h-4" />}
          <button onClick={closeSearch} className="text-gray-500 hover:text-white">
            <X size={15} />
          </button>
        </div>

        {debouncedQ && data && (
          <div className="max-h-96 overflow-y-auto">
            {data.nodes.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-800/50">노드</div>
                {data.nodes.map((n) => (
                  <button key={n.id} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-left" onClick={() => handleNodeClick(n)}>
                    <NodeTypeBadge type={n.type} />
                    <span className="text-sm text-gray-200">{n.title}</span>
                  </button>
                ))}
              </div>
            )}
            {data.documents.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-800/50">문서</div>
                {data.documents.map((d) => (
                  <button key={d.id} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-left" onClick={() => handleDocClick(d)}>
                    <DocTypeBadge type={d.type} />
                    <span className="text-sm text-gray-200">{d.title}</span>
                  </button>
                ))}
              </div>
            )}
            {data.versions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-800/50">버전</div>
                {data.versions.map((v) => (
                  <button key={v.id} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-left" onClick={() => handleVersionClick(v)}>
                    <span className="text-sm text-gray-200">{v.name}</span>
                  </button>
                ))}
              </div>
            )}
            {!data.nodes.length && !data.documents.length && !data.versions.length && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">검색 결과 없음</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
