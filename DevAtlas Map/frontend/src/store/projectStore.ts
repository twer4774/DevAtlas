import { create } from 'zustand'
import { useDiffStore } from '@/store/diffStore'
import { useHistoryStore } from '@/store/historyStore'

interface ProjectState {
  activeProjectId: string | null
  activeVersionId: string | null
  setActiveProject: (id: string | null) => void
  setActiveVersion: (id: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  activeVersionId: null,
  setActiveProject: (id) => {
    useDiffStore.getState().clearDiff()
    useHistoryStore.getState().clear()
    set({ activeProjectId: id, activeVersionId: null })
  },
  setActiveVersion: (id) => {
    useDiffStore.getState().clearDiff()
    useHistoryStore.getState().clear()
    set({ activeVersionId: id })
  },
}))
