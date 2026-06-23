import { useState } from 'react'
import { Layers, History } from 'lucide-react'
import { VersionTree } from '@/components/version/VersionTree'
import { ChangelogPanel } from '@/components/version/ChangelogPanel'
import { DiffSelector } from '@/components/version/DiffSelector'
import { useProjectStore } from '@/store/projectStore'
import { cn } from '@/lib/cn'

interface Props {
  projectId: string
}

type Tab = 'versions' | 'changelog'

export function LeftPanel({ projectId }: Props) {
  const [tab, setTab] = useState<Tab>('versions')
  const { activeVersionId } = useProjectStore()

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d1117' }}>
      {/* Tab bar */}
      <div className="flex-shrink-0 flex px-3 pt-3 pb-0 gap-0.5" style={{ borderBottom: '1px solid #21262d' }}>
        {(['versions', 'changelog'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors relative',
              tab === t
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
            style={tab === t ? {
              background: '#161b22',
              borderTop: '1px solid #21262d',
              borderLeft: '1px solid #21262d',
              borderRight: '1px solid #21262d',
              marginBottom: '-1px',
            } : {}}
          >
            {t === 'versions' ? <Layers size={12} /> : <History size={12} />}
            {t === 'versions' ? '버전' : '이력'}
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
      </div>
    </div>
  )
}
