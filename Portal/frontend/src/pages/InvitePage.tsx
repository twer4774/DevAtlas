import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { acceptInvite, listOrgs } from '../api/orgs'

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { token: authToken, setOrgs } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authToken) {
      window.location.href = `/api/auth/github?redirect_to=${window.location.origin}/invite/${token}`
      return
    }
    if (!token) { navigate('/'); return }
    acceptInvite(token)
      .then(async () => {
        const orgs = await listOrgs()
        setOrgs(orgs)
        setStatus('success')
        setTimeout(() => navigate('/'), 2000)
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { detail?: string } } }
        setError(err?.response?.data?.detail ?? '초대 수락에 실패했습니다')
        setStatus('error')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">초대를 수락하는 중...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-2xl mb-2">✅</div>
            <p className="text-white font-medium">조직에 합류했습니다!</p>
            <p className="text-sm text-gray-500 mt-1">대시보드로 이동 중...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-2xl mb-2">❌</div>
            <p className="text-red-400">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 text-sm text-blue-400 hover:text-blue-300">홈으로</button>
          </>
        )}
      </div>
    </div>
  )
}
