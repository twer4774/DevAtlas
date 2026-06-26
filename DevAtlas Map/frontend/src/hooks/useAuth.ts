import { useEffect, useState } from 'react'
import { getToken, clearToken } from '@/api/client'

interface TokenClaims {
  sub: string
  username: string
  avatar_url?: string
  org_id?: string
  org_slug?: string
  org_name?: string
  org_role?: string
}

function parseJwt(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function useAuth() {
  const [claims, setClaims] = useState<TokenClaims | null>(null)

  useEffect(() => {
    const token = getToken()
    if (token) setClaims(parseJwt(token))
  }, [])

  const logout = () => {
    clearToken()
    window.location.href = 'http://localhost:5174/login'
  }

  return { claims, isAuthenticated: !!claims, logout }
}
