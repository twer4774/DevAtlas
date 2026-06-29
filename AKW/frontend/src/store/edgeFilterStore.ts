import { create } from 'zustand'

interface EdgeFilterState {
  hiddenTypes: Set<string>
  toggleType: (type: string) => void
  showAll: () => void
}

export const useEdgeFilterStore = create<EdgeFilterState>((set) => ({
  hiddenTypes: new Set(),
  toggleType: (type) =>
    set((state) => {
      const next = new Set(state.hiddenTypes)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return { hiddenTypes: next }
    }),
  showAll: () => set({ hiddenTypes: new Set() }),
}))
