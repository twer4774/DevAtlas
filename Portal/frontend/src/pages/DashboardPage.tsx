import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, LogOut, Settings, ExternalLink, GitBranch, Map,
  ChevronDown, Key, Copy, Check, Terminal, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { createOrg, getOrgToken, listOrgs } from '../api/orgs'
import { listApiKeys } from '../api/apiKeys'

const APPS = [
  {
    id: 'akw',
    name: 'AKW',
    description: 'Architecture Knowledge Workspace — 아키텍처 구성 요소를 노드로 시각화하고 관계를 연결하세요',
    icon: Map,
    color: '#3b82f6',
    url: 'http://localhost:5173',
    hasMcp: true,
  },
  {
    id: 'gittrack',
    name: 'GitTrack',
    description: 'Git 커밋 이력과 이슈를 추적하고 프로젝트를 관리하세요',
    icon: GitBranch,
    color: '#8b5cf6',
    url: 'http://localhost:5175',
    hasMcp: false,
  },
]

const MCP_TOOLS = [
  { group: '프로젝트', tools: ['list_projects', 'get_project', 'create_project', 'update_project', 'delete_project'] },
  { group: '버전', tools: ['list_versions', 'get_version', 'create_version', 'fork_version', 'update_version', 'delete_version', 'compare_versions'] },
  { group: '노드 / 엣지', tools: ['list_nodes', 'create_node', 'update_node', 'delete_node', 'list_edges', 'create_edge', 'delete_edge'] },
  { group: '검색 / 문서', tools: ['search', 'list_version_documents', 'upload_document', 'create_idea_documents'] },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded transition-colors text-gray-500 hover:text-gray-300"
      title="복사"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden" style={{ background: '#010409', border: '1px solid #21262d' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#21262d' }}>
        <span className="text-[10px] text-gray-600 font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}

function McpSetupGuide() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'claude' | 'cursor'>('claude')
  const [apiToken, setApiToken] = useState('')
  const [loadingKey, setLoadingKey] = useState(true)

  useEffect(() => {
    listApiKeys()
      .then(keys => {
        const active = keys.find(k => k.is_active)
        if (active) setApiToken(`<YOUR_API_KEY>  # ${active.name} (${active.key_prefix}••••)`)
      })
      .catch(() => {})
      .finally(() => setLoadingKey(false))
  }, [])

  const distPath = '/path/to/AKW/mcp-server/dist/index.js'
  const token = apiToken || '<YOUR_API_KEY>'

  const claudeJson = `// ~/.claude.json 의 mcpServers 안에 추가
"akw": {
  "command": "node",
  "args": [
    "${distPath}"
  ],
  "env": {
    "DEVATLAS_API_BASE": "http://127.0.0.1:8000",
    "DEVATLAS_API_TOKEN": "${token}"
  }
}`

  const cursorJson = `// ~/.cursor/mcp.json 의 mcpServers 안에 추가
"akw": {
  "command": "node",
  "args": [
    "${distPath}"
  ],
  "env": {
    "DEVATLAS_API_BASE": "http://127.0.0.1:8000",
    "DEVATLAS_API_TOKEN": "${token}"
  }
}`

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
      {/* 헤더 */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#21262d' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3b82f615', border: '1px solid #3b82f630' }}>
            <Terminal size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AKW MCP 연동</p>
            <p className="text-xs text-gray-500">Claude Code · Cursor에서 아키텍처 맵을 직접 조작</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: '#22c55e15', color: '#4ade80', border: '1px solid #22c55e20' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          {MCP_TOOLS.reduce((acc, g) => acc + g.tools.length, 0)}개 도구
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 제공 도구 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">제공 도구</p>
          <div className="grid grid-cols-2 gap-2">
            {MCP_TOOLS.map(g => (
              <div key={g.group} className="rounded-lg px-3 py-2.5" style={{ background: '#161b22', border: '1px solid #21262d' }}>
                <p className="text-xs font-medium text-gray-400 mb-1.5">{g.group}</p>
                <div className="flex flex-wrap gap-1">
                  {g.tools.map(t => (
                    <code key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#21262d', color: '#79c0ff' }}>{t}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 단계별 가이드 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wider">설정 방법</p>

          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: '#1d4ed8', color: 'white' }}>1</div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-1">MCP 서버 빌드</p>
                <CodeBlock lang="bash" code={`cd "DevAtlas Map/mcp-server"\nnpm install && npm run build`} />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: '#1d4ed8', color: 'white' }}>2</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-white font-medium">API 키 발급</p>
                  {!loadingKey && !apiToken && (
                    <button
                      onClick={() => navigate('/api-keys')}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Key size={11} /> API 키 발급하기 <ChevronRight size={11} />
                    </button>
                  )}
                </div>
                {apiToken ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#0f2a0f', border: '1px solid #22c55e30', color: '#4ade80' }}>
                    <Check size={12} />
                    <span>API 키가 발급되어 있습니다. 아래 설정에 자동으로 표시됩니다.</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    우측 상단 <Key size={10} className="inline" /> 버튼 또는{' '}
                    <button onClick={() => navigate('/api-keys')} className="text-blue-400 hover:underline">API 키 관리 페이지</button>
                    에서 키를 발급하세요.
                  </p>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: '#1d4ed8', color: 'white' }}>3</div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-2">에디터 설정 등록</p>
                {/* 탭 */}
                <div className="flex gap-1 mb-2">
                  {(['claude', 'cursor'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="px-3 py-1 text-xs rounded-md font-medium transition-colors"
                      style={tab === t
                        ? { background: '#1d4ed8', color: 'white' }
                        : { background: '#161b22', color: '#8b949e', border: '1px solid #21262d' }}
                    >
                      {t === 'claude' ? 'Claude Code' : 'Cursor'}
                    </button>
                  ))}
                </div>
                <CodeBlock lang={tab === 'claude' ? '~/.claude.json' : '~/.cursor/mcp.json'} code={tab === 'claude' ? claudeJson : cursorJson} />
                <p className="text-xs text-gray-600 mt-1.5">
                  <code className="text-gray-500">/path/to/DevAtlas Map</code>를 실제 클론 경로로 변경하세요.
                  {tab === 'claude' && ' 수정 후 Claude Code를 재시작하면 적용됩니다.'}
                  {tab === 'cursor' && ' 수정 후 Cursor를 재시작하면 MCP 목록에 나타납니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, orgs, currentOrg, orgToken, setCurrentOrg, setOrgs, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [showMcp, setShowMcp] = useState(false)

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

  const handleLaunchApp = async (app: typeof APPS[0]) => {
    if (!currentOrg) { alert('먼저 조직을 선택해주세요'); return }
    try {
      const { access_token } = await getOrgToken(currentOrg.slug)
      setCurrentOrg(currentOrg, access_token)
      window.open(`${app.url}?token=${encodeURIComponent(access_token)}`, '_blank')
    } catch {
      alert('토큰 발급에 실패했습니다. 다시 로그인해주세요.')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>
      <header className="border-b sticky top-0 z-40" style={{ borderColor: '#21262d', background: '#0d1117' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
              <span className="text-white font-bold text-xs">DA</span>
            </div>
            <span className="font-semibold text-white">DevAtlas</span>
          </div>

          <div className="flex items-center gap-3">
            {/* 조직 선택 */}
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

            <button onClick={() => navigate('/api-keys')} title="API 키 관리" className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
              <Key size={15} />
            </button>
            <button onClick={() => currentOrg && navigate(`/orgs/${currentOrg.slug}`)} disabled={!currentOrg} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30" title="조직 설정">
              <Settings size={15} />
            </button>
            <button onClick={() => { logout(); window.location.href = '/login' }} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="로그아웃">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* 조직 미선택 안내 */}
        {!currentOrg && (
          <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <span>조직을 선택하거나 새로 만들어 앱을 사용해보세요</span>
          </div>
        )}

        {/* 앱 */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">앱</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {APPS.map(app => {
              const Icon = app.icon
              return (
                <div
                  key={app.id}
                  className="group p-5 rounded-xl transition-all cursor-pointer"
                  style={{ background: '#0d1117', border: '1px solid #21262d' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = app.color + '44' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#21262d' }}
                  onClick={() => handleLaunchApp(app)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: app.color + '15', border: `1px solid ${app.color}30` }}>
                      <Icon size={20} style={{ color: app.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {app.hasMcp && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#3b82f615', color: '#60a5fa', border: '1px solid #3b82f620' }}>
                          MCP
                        </span>
                      )}
                      <ExternalLink size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{app.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{app.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 개발자 도구 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">개발자 도구</h2>
          </div>

          {/* API 키 요약 카드 */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl mb-3 cursor-pointer transition-colors"
            style={{ background: '#0d1117', border: '1px solid #21262d' }}
            onClick={() => navigate('/api-keys')}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#30363d' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#21262d' }}
          >
            <div className="flex items-center gap-3">
              <Key size={15} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">API 키 관리</p>
                <p className="text-xs text-gray-500">MCP 서버 및 외부 도구 인증용 장기 토큰</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-600" />
          </div>

          {/* MCP 설정 가이드 (토글) */}
          <div>
            <button
              onClick={() => setShowMcp(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{ background: '#0d1117', border: '1px solid #21262d' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#30363d' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#21262d' }}
            >
              <div className="flex items-center gap-3">
                <Terminal size={15} className="text-gray-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">MCP 서버 설정 가이드</p>
                  <p className="text-xs text-gray-500">Claude Code · Cursor에서 DevAtlas Map 직접 조작</p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-gray-500 transition-transform ${showMcp ? 'rotate-180' : ''}`} />
            </button>

            {showMcp && (
              <div className="mt-2">
                <McpSetupGuide />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 새 조직 모달 */}
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
