import { useState } from 'react'
import { GitCompare, X, ChevronDown } from 'lucide-react'
import { useVersions } from '@/hooks/useVersions'
import { useDiff } from '@/hooks/useVersions'
import { useDiffStore } from '@/store/diffStore'

interface Props {
  projectId: string
}

const selectStyle = {
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#c9d1d9',
  padding: '6px 10px',
  fontSize: '12px',
  width: '100%',
  outline: 'none',
  appearance: 'none' as const,
  cursor: 'pointer',
}

export function DiffSelector({ projectId }: Props) {
  const { data: versions } = useVersions(projectId)
  const { isDiffMode, diffResult, setDiffResult, clearDiff } = useDiffStore()
  const [versionA, setVersionA] = useState('')
  const [versionB, setVersionB] = useState('')
  const [expanded, setExpanded] = useState(false)

  const diffQuery = useDiff(
    isDiffMode ? versionA || null : null,
    isDiffMode ? versionB || null : null
  )

  const handleCompare = async () => {
    if (!versionA || !versionB) return
    const result = await diffQuery.refetch()
    if (result.data) setDiffResult(result.data)
  }

  if (isDiffMode) {
    return (
      <div className="mx-3 mt-2 mb-1 rounded-lg overflow-hidden"
        style={{ border: '1px solid #3d2d00' }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#2d1f00' }}>
          <GitCompare size={12} style={{ color: '#e3b341', flexShrink: 0 }} />
          <span className="text-xs flex-1 font-medium" style={{ color: '#e3b341' }}>Diff 모드 활성</span>
          <button
            onClick={clearDiff}
            className="p-0.5 rounded transition-colors"
            style={{ color: '#6e7681' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9d1d9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6e7681')}
          >
            <X size={12} />
          </button>
        </div>
        {diffResult && (
          <div className="flex items-center gap-1 px-3 py-1.5" style={{ background: '#1c1400' }}>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#3fb950' }}>
              +{diffResult.added.length}
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>/</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#f85149' }}>
              -{diffResult.deleted.length}
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>/</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#e3b341' }}>
              ~{diffResult.changed.length}
            </span>
            <span className="text-[10px] ml-1" style={{ color: '#484f58' }}>노드</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-3 mt-2 mb-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
        style={{ color: '#6e7681' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#1c2128'
          e.currentTarget.style.color = '#8b949e'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#6e7681'
        }}
      >
        <GitCompare size={12} />
        <span className="flex-1 text-left">버전 비교</span>
        <ChevronDown
          size={12}
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        />
      </button>

      {expanded && (
        <div className="mt-2 px-1 pb-1 space-y-2">
          <div className="relative">
            <select style={selectStyle} value={versionA} onChange={(e) => setVersionA(e.target.value)}>
              <option value="">기준 버전 (A)</option>
              {versions?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6e7681' }} />
          </div>

          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px" style={{ background: '#21262d' }} />
            <span className="text-[10px] font-bold" style={{ color: '#484f58' }}>VS</span>
            <div className="flex-1 h-px" style={{ background: '#21262d' }} />
          </div>

          <div className="relative">
            <select style={selectStyle} value={versionB} onChange={(e) => setVersionB(e.target.value)}>
              <option value="">비교 버전 (B)</option>
              {versions?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6e7681' }} />
          </div>

          <button
            onClick={handleCompare}
            disabled={!versionA || !versionB}
            className="w-full py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: versionA && versionB ? '#1f3250' : '#161b22',
              color: versionA && versionB ? '#58a6ff' : '#484f58',
              border: `1px solid ${versionA && versionB ? '#1f4682' : '#21262d'}`,
              cursor: versionA && versionB ? 'pointer' : 'not-allowed',
            }}
          >
            비교 시작
          </button>
        </div>
      )}
    </div>
  )
}
