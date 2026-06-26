import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogOut, Settings, ExternalLink, GitBranch, Map, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { createOrg, getOrgToken, listOrgs } from '../api/orgs'

const APPS = [
  {
    id: 'devatlasmap',
    name: 'DevAtlas Map',
    description: '아키텍처 구성 요소를 노드로 시각화하고 관계를 연결하세요',
    icon: Map,
    color: '#3b82f6',
    url: 'http://localhost:5173',
  },
  {
    id: 'gittrack',
    name: 'GitTrack',
    description: 'Git 커밋 이력과 이슈를 추적하고 프로젝트를 관리하세요',
    icon: GitBranch,
    color: '#8b5cf6',
    url: 'http://localhost:5175',
  },
]

export function DashboardPage() {
  const { user, orgs, currentOrg, orgToken, setCurrentOrg, setOrgs, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSelectOrg = async (org: typeof orgs[0]) => {
    try {
      const { access_token } = await getOrgToken(org.slug)
      setCurrentOrg(org, access_token)
    } catch (e) {
      console.error(e)
    }
    setShowOrgDropdown(false)
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) return
    setCreating(true)
    try {
      const org = await createOrg(newOrgName.trim(), newOrgSlug.trim())
      const { access_token } = await getOrgToken(org.slug)
      const updatedOrgs = await listOrgs()
      setOrgs(updatedOrgs)
      setCurrentOrg(org, access_token)
      setShowNewOrg(false)
      setNewOrgName('')
      setNewOrgSlug('')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      alert(err?.response?.data?.detail ?? '생성에 실패했습니다')
    } finally {
      setCreating(false)
    }
  }

  const handleLaunchApp = (app: typeof APPS[0]) => {
    if (!orgToken) { alert('먼저 조직을 선택해주세요'); return }
    window.open(`${app.url}?token=${encodeURIComponent(orgToken)}`, '_blank')
  }

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>
      <header className="border-b" style={{ borderColor: '#21262d', background: '#0d1117' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <span className="text-white font-bold text-xs">DA</span>
            </div>
            <span className="font-semibold text-white">DevAtlas</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ background: '#161b22', border: '1px solid #30363d', color: '#e6edf3' }}
              >
                {currentOrg ? (
                  <>
                    <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold" style={{ background: '#3b82f620', color: '#60a5fa' }}>
                      {currentOrg.name[0].toUpperCase()}
                    </div>
                    <span>{currentOrg.name}</span>
                  </>
                ) : (
                  <span className="text-gray-500">조직 선택</span>
                )}
                <ChevronDown size={12} className="text-gray-500" />
              </button>

              {showOrgDropdown && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                  {orgs.map(org => (
                    <button key={org.id} onClick={() => handleSelectOrg(org)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors"
                      style={{ color: '#c9d1d9' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#21262d' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: '#3b82f620', color: '#60a5fa' }}>
                        {org.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{org.name}</div>
                        <div className="text-[10px] text-gray-600">@{org.slug} · {org.member_count}명</div>
                      </div>
                      {currentOrg?.id === org.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                    </button>
                  ))}
                  <div className="border-t" style={{ borderColor: '#21262d' }}>
                    <button
                      onClick={() => { setShowOrgDropdown(false); setShowNewOrg(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                      style={{ color: '#58a6ff' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#21262d' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Plus size={13} /> 새 조직 만들기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user?.avatar_url && <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
              <span className="text-sm text-gray-400">{user?.username}</span>
            </div>

            <button onClick={() => currentOrg && navigate(`/orgs/${currentOrg.slug}`)} disabled={!currentOrg} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30">
              <Settings size={15} />
            </button>
            <button onClick={() => { logout(); window.location.href = '/login' }} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!currentOrg && (
          <div className="mb-8 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            조직을 선택하거나 새로 만들어 앱을 사용해보세요
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-6">앱</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {APPS.map(app => {
            const Icon = app.icon
            return (
              <div
                key={app.id}
                className="group p-6 rounded-2xl transition-all cursor-pointer"
                style={{ background: '#0d1117', border: '1px solid #21262d' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = app.color + '44' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#21262d' }}
                onClick={() => handleLaunchApp(app)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: app.color + '15', border: `1px solid ${app.color}30` }}>
                    <Icon size={22} style={{ color: app.color }} />
                  </div>
                  <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors mt-1" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{app.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{app.description}</p>
              </div>
            )
          })}
        </div>
      </main>

      {showNewOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowNewOrg(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0d1117', border: '1px solid #21262d' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-4">새 조직 만들기</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">조직 이름</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  value={newOrgName}
                  onChange={e => {
                    setNewOrgName(e.target.value)
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                  }}
                  placeholder="My Team"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">슬러그 (URL)</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  value={newOrgSlug}
                  onChange={e => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-team"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNewOrg(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">취소</button>
              <button
                onClick={handleCreateOrg}
                disabled={creating || !newOrgName.trim() || !newOrgSlug.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ background: '#1d4ed8' }}
                onMouseEnter={e => { if (!creating) (e.currentTarget as HTMLElement).style.background = '#2563eb' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1d4ed8' }}
              >
                {creating ? '생성 중...' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
