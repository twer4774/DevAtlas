import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function AuthBadge() {
  const { claims, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !claims) return null

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {claims.org_name && (
        <span className="px-2 py-0.5 rounded-md text-[11px]" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
          {claims.org_name}
        </span>
      )}
      <span className="text-gray-600">{claims.username}</span>
      <button
        onClick={logout}
        title="로그아웃"
        className="p-1 hover:text-gray-300 transition-colors"
      >
        <LogOut size={13} />
      </button>
    </div>
  )
}
