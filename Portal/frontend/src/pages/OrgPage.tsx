import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Trash2, Crown, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { listMembers, inviteMember, removeMember } from '../api/orgs'

interface Member {
  user_id: string
  username: string
  avatar_url: string | null
  role: string
  joined_at: string
}

export function OrgPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { currentOrg, user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteResult, setInviteResult] = useState<{ token: string; email?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    listMembers(slug).then(setMembers).catch(() => {})
  }, [slug])

  const handleInvite = async () => {
    if (!slug || (!inviteUsername.trim() && !inviteEmail.trim())) return
    setLoading(true)
    try {
      const result = await inviteMember(slug, inviteUsername.trim(), inviteEmail.trim(), inviteRole)
      setInviteResult(result)
      setInviteUsername('')
      setInviteEmail('')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      alert(err?.response?.data?.detail ?? '초대에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInviteLink = () => {
    if (!inviteResult) return
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteResult.token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemove = async (memberId: string, username: string) => {
    if (!slug || !confirm(`${username}을(를) 조직에서 제거하시겠습니까?`)) return
    try {
      await removeMember(slug, memberId)
      setMembers(m => m.filter(x => x.user_id !== memberId))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      alert(err?.response?.data?.detail ?? '제거에 실패했습니다')
    }
  }

  const isOwner = currentOrg?.owner_id === user?.id

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>
      <header className="border-b" style={{ borderColor: '#21262d', background: '#0d1117' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="font-semibold text-white">{currentOrg?.name ?? slug} 설정</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">멤버 ({members.length})</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #21262d' }}>
            {members.map((m, i) => (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-3" style={{ background: i % 2 === 0 ? '#0d1117' : '#0a0f18', borderBottom: i < members.length - 1 ? '1px solid #21262d' : undefined }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><User size={14} className="text-gray-500" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{m.username}</p>
                </div>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: m.role === 'owner' ? '#3b82f620' : '#ffffff0a', color: m.role === 'owner' ? '#60a5fa' : '#6b7280' }}>
                  {m.role === 'owner' && <Crown size={10} />} {m.role}
                </span>
                {isOwner && m.user_id !== user?.id && (
                  <button onClick={() => handleRemove(m.user_id, m.username)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {isOwner && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">멤버 초대</h2>
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="GitHub 유저명"
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
                <select
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="이메일 (선택 — 입력 시 초대 메일 발송)"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  disabled={loading || (!inviteUsername.trim() && !inviteEmail.trim())}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: '#1d4ed8' }}
                >
                  초대
                </button>
              </div>

              {inviteResult && (
                <div className="space-y-2">
                  {inviteResult.email && (
                    <p className="text-xs text-green-400 flex items-center gap-1.5">
                      <Check size={12} /> <span>{inviteResult.email}로 초대 메일을 발송했습니다</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: '#1a2a1a', border: '1px solid #22c55e40', color: '#4ade80' }}>
                    <span className="flex-1 truncate font-mono text-xs">{window.location.origin}/invite/{inviteResult.token}</span>
                    <button onClick={handleCopyInviteLink} className="flex-shrink-0">
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
