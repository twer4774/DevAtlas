import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Copy, Check, Key, Zap, X } from 'lucide-react'
import { listApiKeys, createApiKey, revokeApiKey, createServiceToken, ApiKeyOut } from '../api/apiKeys'
import { useAuthStore } from '../store/authStore'

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="flex-shrink-0 text-gray-400 hover:text-white transition-colors">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function ServiceTokenModal({ apiKey, onClose }: { apiKey: ApiKeyOut; onClose: () => void }) {
  const { orgs } = useAuthStore()
  const [orgSlug, setOrgSlug] = useState(orgs[0]?.slug ?? '')
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!orgSlug) return
    setLoading(true)
    setError('')
    try {
      const result = await createServiceToken(apiKey.id, orgSlug)
      setToken(result.service_token)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err?.response?.data?.detail ?? '생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl p-5 space-y-4" style={{ background: '#0d1117', border: '1px solid #30363d' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">서비스 토큰 발급</h3>
            <p className="text-xs text-gray-500 mt-0.5">{apiKey.name} ({apiKey.key_prefix}••••)</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14} /></button>
        </div>

        <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: '#161b22', border: '1px solid #21262d' }}>
          <p className="text-gray-400 font-medium">서비스 토큰이란?</p>
          <p className="text-gray-500">MCP 서버처럼 사람이 없이 실행되는 도구가 AKW에 접속할 때 사용하는 <span className="text-blue-400">1년짜리 JWT</span>입니다. API 키와 달리 특정 조직에 귀속됩니다.</p>
        </div>

        {!token ? (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">조직 선택</label>
              {orgs.length === 0 ? (
                <p className="text-xs text-red-400">소속 조직이 없습니다. 먼저 조직을 만들어주세요.</p>
              ) : (
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  value={orgSlug}
                  onChange={e => setOrgSlug(e.target.value)}
                >
                  {orgs.map(o => (
                    <option key={o.slug} value={o.slug}>{o.name} (@{o.slug})</option>
                  ))}
                </select>
              )}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">취소</button>
              <button
                onClick={handleGenerate}
                disabled={loading || !orgSlug}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                style={{ background: '#1d4ed8' }}
              >
                <Zap size={11} /> {loading ? '생성 중...' : '발급'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-yellow-400">⚠️ 이 토큰은 지금만 표시됩니다. 반드시 복사해두세요.</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#0f1a2a', border: '1px solid #3b82f640' }}>
              <code className="flex-1 text-[11px] font-mono text-blue-300 break-all">{token}</code>
              <CopyBtn text={token} />
            </div>
            <div className="rounded-lg p-3 text-xs space-y-2" style={{ background: '#161b22', border: '1px solid #21262d' }}>
              <p className="text-gray-400 font-medium">~/.claude.json 설정</p>
              <code className="block text-gray-400 whitespace-pre">{`"akw": {
  ...
  "env": {
    "DEVATLAS_API_BASE": "http://127.0.0.1:8000",
    "DEVATLAS_API_TOKEN": "<위 토큰 붙여넣기>"
  }
}`}</code>
              <p className="text-gray-600">설정 후 Claude Code를 재시작하세요.</p>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg" style={{ background: '#1d4ed8' }}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ApiKeysPage() {
  const navigate = useNavigate()
  const [keys, setKeys] = useState<ApiKeyOut[]>([])
  const [newName, setNewName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [serviceTokenTarget, setServiceTokenTarget] = useState<ApiKeyOut | null>(null)

  useEffect(() => {
    listApiKeys().then(setKeys).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const result = await createApiKey(newName.trim())
      setCreatedKey(result.key)
      setNewName('')
      setKeys(prev => [result, ...prev])
    } catch {
      alert('API 키 생성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`"${name}" API 키를 폐기하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    try {
      await revokeApiKey(id)
      setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k))
    } catch {
      alert('폐기에 실패했습니다')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>
      <header className="border-b" style={{ borderColor: '#21262d', background: '#0d1117' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="font-semibold text-white">API 키 관리</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* 새 키 생성 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">새 API 키 생성</h2>
          <div className="rounded-xl p-5 space-y-3" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                placeholder="키 이름 (예: MCP Server, CI Pipeline)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={loading || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ background: '#1d4ed8' }}
              >
                <Plus size={14} /> 생성
              </button>
            </div>

            {createdKey && (
              <div className="space-y-2">
                <p className="text-xs text-yellow-400">⚠️ 이 API 키는 지금만 표시됩니다. 반드시 복사해두세요.</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#1a1a2a', border: '1px solid #3b82f640', color: '#93c5fd' }}>
                  <code className="flex-1 truncate text-xs font-mono">{createdKey}</code>
                  <CopyBtn text={createdKey} />
                </div>
                <p className="text-xs text-gray-500">
                  키를 발급했으면 아래 목록에서 <span className="text-blue-400"><Zap size={10} className="inline" /> 서비스 토큰</span> 버튼으로 AKW용 토큰을 생성하세요.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 키 목록 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">발급된 키 ({keys.length})</h2>
          {keys.length === 0 ? (
            <p className="text-sm text-gray-600">발급된 API 키가 없습니다.</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #21262d' }}>
              {keys.map((k, i) => (
                <div key={k.id} className="flex items-center gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? '#0d1117' : '#0a0f18', borderBottom: i < keys.length - 1 ? '1px solid #21262d' : undefined }}>
                  <Key size={14} className={k.is_active ? 'text-blue-400' : 'text-gray-600'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{k.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{k.key_prefix}••••••••••••••••</p>
                  </div>
                  <div className="text-right text-xs text-gray-600 shrink-0">
                    {k.last_used_at ? `마지막 사용: ${new Date(k.last_used_at).toLocaleDateString('ko-KR')}` : '미사용'}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? 'text-green-400' : 'text-gray-600'}`} style={{ background: k.is_active ? '#22c55e20' : '#ffffff0a' }}>
                    {k.is_active ? '활성' : '폐기됨'}
                  </span>
                  {k.is_active && (
                    <>
                      <button
                        onClick={() => setServiceTokenTarget(k)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-blue-400 hover:text-blue-300"
                        style={{ background: '#1d4ed820', border: '1px solid #3b82f630' }}
                        title="AKW 서비스 토큰 발급"
                      >
                        <Zap size={11} /> 서비스 토큰
                      </button>
                      <button onClick={() => handleRevoke(k.id, k.name)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 설명 */}
        <section className="rounded-xl p-4 text-xs space-y-2" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
          <p className="font-medium text-gray-400">API 키 vs 서비스 토큰</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-blue-400 font-medium">API 키 (dat_xxx)</p>
              <p className="text-gray-600">Portal 관리 API 인증용. 만료 없음.</p>
            </div>
            <div className="space-y-1">
              <p className="text-yellow-400 font-medium">서비스 토큰 (JWT)</p>
              <p className="text-gray-600">AKW MCP 서버용. 조직에 귀속, 1년 유효.</p>
            </div>
          </div>
        </section>
      </main>

      {serviceTokenTarget && (
        <ServiceTokenModal apiKey={serviceTokenTarget} onClose={() => setServiceTokenTarget(null)} />
      )}
    </div>
  )
}
