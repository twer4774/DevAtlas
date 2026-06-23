import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RelationType {
  id: string
  label: string
  color: string
  isBuiltIn: boolean
}

const BUILT_IN: RelationType[] = [
  { id: 'contains',   label: '포함',      color: '#6b7280', isBuiltIn: true },
  { id: 'realizes',   label: '구현',      color: '#3b82f6', isBuiltIn: true },
  { id: 'depends_on', label: '의존',      color: '#f59e0b', isBuiltIn: true },
  { id: 'triggers',   label: '트리거',    color: '#8b5cf6', isBuiltIn: true },
  { id: 'applies_to', label: '정책 적용', color: '#ef4444', isBuiltIn: true },
  { id: 'references', label: '참조',      color: '#22c55e', isBuiltIn: true },
]

interface RelationTypeState {
  types: RelationType[]
  addType: (label: string, color: string) => void
  updateType: (id: string, patch: Partial<Pick<RelationType, 'label' | 'color'>>) => void
  deleteType: (id: string) => void
  getById: (id: string) => RelationType | undefined
}

export const useRelationTypeStore = create<RelationTypeState>()(
  persist(
    (set, get) => ({
      types: BUILT_IN,

      addType: (label, color) => {
        const id = `custom_${Date.now()}`
        set(s => ({ types: [...s.types, { id, label, color, isBuiltIn: false }] }))
      },

      updateType: (id, patch) =>
        set(s => ({
          types: s.types.map(t => t.id === id ? { ...t, ...patch } : t),
        })),

      deleteType: (id) =>
        set(s => ({
          types: s.types.filter(t => t.id !== id),
        })),

      getById: (id) => get().types.find(t => t.id === id),
    }),
    { name: 'akw-relation-types' },
  ),
)
