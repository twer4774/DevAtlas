import { create } from 'zustand'

type PanelView = 'list' | 'view' | 'edit'

interface DocumentState {
  activePanelView: PanelView
  activeDocumentId: string | null
  setActiveDocument: (id: string | null) => void
  setView: (view: PanelView) => void
  startNewDocument: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  activePanelView: 'list',
  activeDocumentId: null,
  setActiveDocument: (id) => set({ activeDocumentId: id, activePanelView: id ? 'view' : 'list' }),
  setView: (view) => set({ activePanelView: view }),
  startNewDocument: () => set({ activeDocumentId: null, activePanelView: 'edit' }),
}))
