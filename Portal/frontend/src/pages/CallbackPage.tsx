import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'
import { listOrgs } from '../api/orgs'

export function CallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setToken, setUser, setOrgs } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    if (!token) { navigate('/login'); return }
    setToken(token)
    Promise.all([getMe(), listOrgs()]).then(([user, orgs]) => {
      setUser(user)
      setOrgs(orgs)
      navigate('/')
    }).catch(() => navigate('/login'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">로그인 중...</p>
      </div>
    </div>
  )
}
