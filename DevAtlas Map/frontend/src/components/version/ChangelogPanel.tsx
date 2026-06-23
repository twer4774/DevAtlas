import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useChangelog } from '@/hooks/useChangelog'
import { Spinner } from '@/components/common/Spinner'
import { History } from 'lucide-react'

const ACTION_META: Record<string, { color: string; bg: string; label: string }> = {
  'node.create': { color: '#3fb950', bg: '#0f2a15', label: 'create' },
  'node.update': { color: '#e3b341', bg: '#2d1f00', label: 'update' },
  'node.delete': { color: '#f85149', bg: '#2d0f0f', label: 'delete' },
  'doc.link':    { color: '#58a6ff', bg: '#0d1f3c', label: 'link'   },
  'doc.unlink':  { color: '#8b949e', bg: '#1c2128', label: 'unlink' },
}
const DEFAULT_META = { color: '#8b949e', bg: '#1c2128', label: '' }

interface Props {
  versionId: string
}

export function ChangelogPanel({ versionId }: Props) {
  const { data: entries, isLoading } = useChangelog(versionId)

  if (isLoading) return <Spinner className="mx-auto mt-8" />

  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4 text-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#21262d' }}>
          <History size={16} style={{ color: '#484f58' }} />
        </div>
        <p className="text-xs" style={{ color: '#484f58' }}>변경 이력이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6e7681' }}>
          Changelog
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="relative">
          {/* Timeline vertical line */}
          <div
            className="absolute top-3 bottom-3"
            style={{ left: '7px', width: '1px', background: '#21262d' }}
          />

          <div className="space-y-1">
            {entries.map((entry) => {
              const meta = ACTION_META[entry.action] ?? DEFAULT_META
              return (
                <div key={entry.id} className="relative flex gap-3">
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 mt-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                      style={{ background: meta.bg, borderColor: meta.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 rounded-lg px-3 py-2.5 mb-1"
                    style={{ background: '#1c2128', border: '1px solid #21262d' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {entry.action}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#484f58' }}>
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="text-xs leading-snug" style={{ color: '#8b949e' }}>
                        {entry.reason}
                      </p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: '#484f58' }}>
                      by {entry.author}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
