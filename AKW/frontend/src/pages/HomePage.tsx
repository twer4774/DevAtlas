import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Folder, Trash2, Search } from 'lucide-react'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { AuthBadge } from '@/components/layout/AuthBadge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function HomePage() {
  const navigate = useNavigate()
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const { setActiveProject } = useProjectStore()
  const { openSearch } = useUIStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creator, setCreator] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim() || !creator.trim()) return
    const project = await createProject.mutateAsync({ name, description: description || undefined, creator })
    setActiveProject(project.id)
    navigate(`/projects/${project.id}`)
  }

  const handleOpen = (id: string) => {
    setActiveProject(id)
    navigate(`/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">AKW</h1>
          <p className="text-xs text-gray-500 mt-0.5">Architecture Knowledge Workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <AuthBadge />
          <Button variant="ghost" size="sm" onClick={openSearch}>
            <Search size={14} />
            검색
            <kbd className="ml-1 text-xs text-gray-500">⌘K</kbd>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            새 프로젝트
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4">프로젝트</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Folder size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">프로젝트가 없습니다</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> 첫 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((p) => (
              <div
                key={p.id}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => handleOpen(p.id)}
              >
                <div className="flex items-start justify-between">
                  <Folder size={18} className="text-blue-400 mt-0.5" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-white mt-3">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{p.creator}</span>
                  <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ko })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="새 프로젝트">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">프로젝트명 *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Service"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">설명</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="프로젝트 설명"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">작성자 *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="이름"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleCreate} disabled={createProject.isPending || !name || !creator}>
              생성
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="프로젝트 삭제">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">삭제하면 모든 버전과 데이터가 사라집니다. 계속하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>취소</Button>
            <Button variant="danger" size="sm" onClick={() => {
              if (deleteConfirmId) {
                deleteProject.mutate(deleteConfirmId)
                setDeleteConfirmId(null)
              }
            }} disabled={deleteProject.isPending}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
