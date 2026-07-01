import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, ArrowRight, Network, GitBranch, FileText, Map } from 'lucide-react'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects'
import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'
import { AuthBadge } from '@/components/layout/AuthBadge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// ── 프로젝트별 색상 (이름 해시 기반) ─────────────────────────────────────────
const ACCENT_COLORS = [
  { border: '#6366f1', bg: '#6366f118', text: '#818cf8' }, // indigo
  { border: '#8b5cf6', bg: '#8b5cf618', text: '#a78bfa' }, // violet
  { border: '#3b82f6', bg: '#3b82f618', text: '#60a5fa' }, // blue
  { border: '#06b6d4', bg: '#06b6d418', text: '#22d3ee' }, // cyan
  { border: '#10b981', bg: '#10b98118', text: '#34d399' }, // emerald
  { border: '#f59e0b', bg: '#f59e0b18', text: '#fbbf24' }, // amber
  { border: '#ef4444', bg: '#ef444418', text: '#f87171' }, // red
  { border: '#ec4899', bg: '#ec489918', text: '#f472b6' }, // pink
]

function accentFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return ACCENT_COLORS[h % ACCENT_COLORS.length]
}

// ── 특징 카드 (히어로 하단) ───────────────────────────────────────────────────
const FEATURES = [
  { icon: Network,    title: '아키텍처 캔버스', desc: '노드·엣지로 시스템 구조를 시각화하고 버전별로 관리' },
  { icon: FileText,   title: 'AI 문서 생성',   desc: 'MCP를 통해 Claude가 직접 문서·노드를 생성' },
  { icon: GitBranch,  title: '버전 관리',       desc: '버전 브랜치·diff로 아키텍처 변화 이력 추적' },
  { icon: Map,        title: '로드맵 Kanban',   desc: '우선순위·버전별 작업을 Kanban으로 관리' },
]

export function HomePage() {
  const navigate  = useNavigate()
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const { setActiveProject } = useProjectStore()
  const { openSearch } = useUIStore()

  const [query,          setQuery]          = useState('')
  const [createOpen,     setCreateOpen]     = useState(false)
  const [name,           setName]           = useState('')
  const [description,    setDescription]    = useState('')
  const [creator,        setCreator]        = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filtered = useMemo(() =>
    (projects ?? []).filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query]
  )

  const handleCreate = async () => {
    if (!name.trim() || !creator.trim()) return
    const p = await createProject.mutateAsync({ name, description: description || undefined, creator })
    setActiveProject(p.id)
    navigate(`/projects/${p.id}`)
  }

  const handleOpen = (id: string) => {
    setActiveProject(id)
    navigate(`/projects/${id}`)
  }

  const resetForm = () => { setName(''); setDescription(''); setCreator('') }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0d1117' }}>
      {/* ── 헤더 ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#21262d' }}>
        <div className="flex items-center gap-3">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Network size={14} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: '#e6edf3' }}>DevAtlas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AuthBadge />
          <button
            onClick={openSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d' }}
          >
            <Search size={12} />
            검색
            <kbd className="text-[10px] px-1 rounded" style={{ background: '#161b22', color: '#6e7681' }}>⌘K</kbd>
          </button>
          <button
            onClick={() => { resetForm(); setCreateOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: '#238636', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2ea043')}
            onMouseLeave={e => (e.currentTarget.style.background = '#238636')}
          >
            <Plus size={13} /> 새 프로젝트
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8">
        {/* ── 히어로 ── */}
        {(!projects || projects.length === 0) && !isLoading ? (
          <div className="py-20 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-2"
              style={{ background: '#6366f118', color: '#818cf8', border: '1px solid #6366f130' }}>
              ✦ AI-Powered Architecture Workspace
            </div>
            <h1 className="text-4xl font-bold leading-tight" style={{ color: '#e6edf3' }}>
              시스템을 그리고,<br />
              <span style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI와 함께 문서화하세요
              </span>
            </h1>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#8b949e' }}>
              아키텍처 캔버스, 버전 관리, AI 문서 생성을 하나의 워크스페이스에서.
              Claude MCP로 대화하듯 시스템을 설계하세요.
            </p>
            <button
              onClick={() => { resetForm(); setCreateOpen(true) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
            >
              <Plus size={15} /> 첫 프로젝트 시작하기
            </button>

            {/* 특징 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 text-left">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl p-4 space-y-2"
                  style={{ background: '#161b22', border: '1px solid #21262d' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: '#21262d' }}>
                    <Icon size={15} style={{ color: '#8b949e' }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: '#e6edf3' }}>{title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#6e7681' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── 프로젝트 섹션 ── */}
            <div className="pt-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#e6edf3' }}>프로젝트</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6e7681' }}>
                  {isLoading ? '...' : `${projects?.length ?? 0}개`}
                </p>
              </div>
              {(projects?.length ?? 0) > 2 && (
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6e7681' }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="프로젝트 검색..."
                    className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: '#161b22', border: '1px solid #30363d', color: '#e6edf3', width: 200 }}
                  />
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                {filtered.map(p => {
                  const accent = accentFor(p.name)
                  return (
                    <div
                      key={p.id}
                      className="group relative rounded-xl cursor-pointer transition-all duration-200"
                      style={{ background: '#161b22', border: '1px solid #21262d' }}
                      onClick={() => handleOpen(p.id)}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = accent.border + '80'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#21262d'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {/* 상단 색상 바 */}
                      <div className="h-0.5 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${accent.border}, transparent)` }} />

                      <div className="p-5">
                        {/* 헤더 */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: accent.bg }}>
                              <Network size={14} style={{ color: accent.text }} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold leading-snug truncate" style={{ color: '#e6edf3' }}>
                                {p.name}
                              </h3>
                              <p className="text-[10px]" style={{ color: accent.text }}>{p.creator}</p>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteConfirmId(p.id) }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 -mt-0.5 -mr-0.5"
                            style={{ color: '#6e7681' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#f85149')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6e7681')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* 설명 */}
                        {p.description ? (
                          <p className="text-xs leading-relaxed line-clamp-2 mb-4" style={{ color: '#8b949e' }}>
                            {p.description}
                          </p>
                        ) : (
                          <p className="text-xs mb-4 italic" style={{ color: '#484f58' }}>설명 없음</p>
                        )}

                        {/* 푸터 */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: '#484f58' }}>
                            {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ko })}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: accent.text }}>
                            열기 <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 새 프로젝트 카드 */}
                <button
                  onClick={() => { resetForm(); setCreateOpen(true) }}
                  className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all min-h-[140px]"
                  style={{ background: 'transparent', border: '1px dashed #30363d', color: '#484f58' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#6366f180'
                    e.currentTarget.style.color = '#818cf8'
                    e.currentTarget.style.background = '#6366f108'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#30363d'
                    e.currentTarget.style.color = '#484f58'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Plus size={20} />
                  <span className="text-xs font-medium">새 프로젝트</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── 새 프로젝트 모달 ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="새 프로젝트">
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8b949e' }}>프로젝트명 *</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ background: '#0d1117', border: '1px solid #30363d' }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Service"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8b949e' }}>설명</label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              style={{ background: '#0d1117', border: '1px solid #30363d' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="어떤 시스템인가요?"
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8b949e' }}>작성자 *</label>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ background: '#0d1117', border: '1px solid #30363d' }}
              value={creator}
              onChange={e => setCreator(e.target.value)}
              placeholder="이름"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleCreate} disabled={createProject.isPending || !name.trim() || !creator.trim()}>
              {createProject.isPending ? '생성 중...' : '프로젝트 만들기'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 삭제 확인 모달 ── */}
      <Modal open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="프로젝트 삭제">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#8b949e' }}>
            삭제하면 모든 버전과 데이터가 영구 삭제됩니다. 계속하시겠습니까?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>취소</Button>
            <Button variant="danger" size="sm"
              onClick={() => { if (deleteConfirmId) { deleteProject.mutate(deleteConfirmId); setDeleteConfirmId(null) } }}
              disabled={deleteProject.isPending}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
