import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string | null
  avatar_url: string | null
}

interface Org {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  owner_id: string
  member_count: number
}

interface AuthState {
  token: string | null
  user: User | null
  orgs: Org[]
  currentOrg: Org | null
  orgToken: string | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  setOrgs: (orgs: Org[]) => void
  setCurrentOrg: (org: Org, orgToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      orgs: [],
      currentOrg: null,
      orgToken: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setOrgs: (orgs) => set({ orgs }),
      setCurrentOrg: (org, orgToken) => set({ currentOrg: org, orgToken }),
      logout: () => set({ token: null, user: null, orgs: [], currentOrg: null, orgToken: null }),
    }),
    { name: 'devatlas-auth' }
  )
)
