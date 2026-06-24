import { useState, useEffect } from 'react'
import { GitBranch, Plus, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { useVersions, useCreateVersion, useForkVersion, useUpdateVersion, useDeleteVersion } from '@/hooks/useVersions'
import { useProjectStore } from '@/store/projectStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { cn } from '@/lib/cn'

interface Props {
  projectId: string
}

export function VersionTree({ projectId }: Props) {
  const { data: versions, isLoading } = useVersions(projectId)
  const { activeVersionId, setActiveVersion } = useProjectStore()
  const createVersion = useCreateVersion(projectId)
  const forkVersion = useForkVersion(projectId)
  const updateVersion = useUpdateVersion(projectId)
  const deleteVersion = useDeleteVersion(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [forkOpen, setForkOpen] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  // 버전 목록 로드 후 activeVersion이 없으면 첫 번째 버전 자동 선택
  useEffect(() => {
    if (!activeVersionId && versions && versions.length > 0) {
      setActiveVersion(versions[0].id)
    }
  }, [versions, activeVersionId, setActiveVersion])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const v = await createVersion.mutateAsync({ name: newName })
    setActiveVersion(v.id)
    setNewName('')
    setCreateOpen(false)
  }

  const handleFork = async () => {
    if (!newName.trim() || !forkOpen) return
    const v = await forkVersion.mutateAsync({ versionId: forkOpen, name: newName })
    setActiveVersion(v.id)
    setNewName('')
    setForkOpen(null)
  }

  const handleRename = async () => {
    if (!renameId || !newName.trim()) return
    await updateVersion.mutateAsync({ versionId: renameId, name: newName })
    setRenameId(null)
  }

  const handleDeleteVersion = async () => {
    if (!deleteVersionId) return
    await deleteVersion.mutateAsync(deleteVersionId)
    if (activeVersionId === deleteVersionId) setActiveVersion(null)
    setDeleteVersionId(null)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#6e7681' }}>
          Versions
        </span>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: '#58a6ff' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#79b8ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#58a6ff')}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && <Spinner className="mx-auto mt-6" />}

        {!isLoading && versions?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#21262d' }}>
              <GitBranch size={16} style={{ color: '#484f58' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: '#8b949e' }}>버전 없음</p>
              <p className="text-xs mt-0.5" style={{ color: '#484f58' }}>New를 눌러 생성하세요</p>
            </div>
          </div>
        )}

        {versions?.map((v) => {
          const isActive = activeVersionId === v.id
          return (
            <div
              key={v.id}
              className={cn(
                'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-100 select-none mb-0.5',
              )}
              style={{
                background: isActive ? '#1f3250' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = '#1c2128'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => setActiveVersion(v.id)}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: '#58a6ff' }} />
              )}

              <CheckCircle2
                size={14}
                className="flex-shrink-0"
                style={{ color: isActive ? '#58a6ff' : '#484f58' }}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium leading-tight" style={{ color: isActive ? '#e6edf3' : '#8b949e' }}>
                  {v.name}
                </p>
                {v.release_date && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: '#484f58' }}>
                    {v.release_date}
                  </p>
                )}
              </div>

              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
                {/* Rename */}
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameId(v.id); setNewName(v.name) }}
                  className="p-1 rounded transition-all"
                  style={{ color: '#6e7681' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#c9d1d9'
                    e.currentTarget.style.background = '#30363d'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#6e7681'
                    e.currentTarget.style.background = 'transparent'
                  }}
                  title="버전 이름 변경"
                >
                  <Pencil size={11} />
                </button>
                {/* Fork */}
                <button
                  onClick={(e) => { e.stopPropagation(); setForkOpen(v.id); setNewName('') }}
                  className="p-1 rounded transition-all"
                  style={{ color: '#6e7681' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#c9d1d9'
                    e.currentTarget.style.background = '#30363d'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#6e7681'
                    e.currentTarget.style.background = 'transparent'
                  }}
                  title="Fork version"
                >
                  <GitBranch size={11} />
                </button>
                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteVersionId(v.id) }}
                  className="p-1 rounded transition-all"
                  style={{ color: '#6e7681' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#f85149'
                    e.currentTarget.style.background = '#30363d'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#6e7681'
                    e.currentTarget.style.background = 'transparent'
                  }}
                  title="버전 삭제"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="새 버전">
        <div className="space-y-4">
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="v1.0"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleCreate} disabled={createVersion.isPending}>생성</Button>
          </div>
        </div>
      </Modal>

      {/* Fork modal */}
      <Modal open={!!forkOpen} onClose={() => setForkOpen(null)} title="버전 Fork">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">새 버전 이름을 입력하세요</p>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="v1.1"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleFork() }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setForkOpen(null)}>취소</Button>
            <Button size="sm" onClick={handleFork} disabled={forkVersion.isPending}>Fork</Button>
          </div>
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal open={!!renameId} onClose={() => setRenameId(null)} title="버전 이름 변경">
        <div className="space-y-4">
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRenameId(null)}>취소</Button>
            <Button size="sm" onClick={handleRename} disabled={updateVersion.isPending}>변경</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteVersionId} onClose={() => setDeleteVersionId(null)} title="버전 삭제">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">이 버전의 모든 노드와 데이터가 삭제됩니다. 계속하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteVersionId(null)}>취소</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteVersion} disabled={deleteVersion.isPending}>삭제</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
