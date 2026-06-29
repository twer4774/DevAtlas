import { create } from 'zustand'
import type { ArchitectureNode } from '@/types'

export interface NodeUpdatePayload {
  title?: string
  type?: string
  metadata_?: Record<string, unknown>
}

export type HistoryEntry =
  | {
      kind: 'node_updated'
      nodeId: string
      versionId: string
      before: NodeUpdatePayload
      after: NodeUpdatePayload
    }
  | {
      kind: 'node_deleted'
      versionId: string
      snapshot: ArchitectureNode
    }
  | {
      kind: 'node_created'
      versionId: string
      nodeId: string
    }
  | {
      kind: 'edge_created'
      versionId: string
      edgeId: string
    }
  | {
      kind: 'edge_deleted'
      versionId: string
      edgeId: string
      snapshot: { source_id: string; target_id: string; relation_type: string }
    }

const MAX_HISTORY = 50

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  canUndo: boolean
  canRedo: boolean
  push: (entry: HistoryEntry) => void
  undo: () => HistoryEntry | undefined
  redo: () => HistoryEntry | undefined
  replaceTopFuture: (entry: HistoryEntry) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  push: (entry) =>
    set((s) => {
      const past = [...s.past, entry].slice(-MAX_HISTORY)
      return { past, future: [], canUndo: true, canRedo: false }
    }),

  undo: () => {
    const { past } = get()
    if (past.length === 0) return undefined
    const entry = past[past.length - 1]
    set((s) => {
      const next = s.past.slice(0, -1)
      const future = [entry, ...s.future]
      return { past: next, future, canUndo: next.length > 0, canRedo: true }
    })
    return entry
  },

  redo: () => {
    const { future } = get()
    if (future.length === 0) return undefined
    const entry = future[0]
    set((s) => {
      const next = s.future.slice(1)
      const past = [...s.past, entry].slice(-MAX_HISTORY)
      return { past, future: next, canUndo: true, canRedo: next.length > 0 }
    })
    return entry
  },

  replaceTopFuture: (entry) =>
    set((s) => ({
      future: [entry, ...s.future.slice(1)],
    })),

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}))
