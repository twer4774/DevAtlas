import { create } from 'zustand'

interface DrillCrumb {
  id: string
  title: string
}

interface MapState {
  selectedNodeId: string | null
  expandedNodeIds: Set<string>
  drillRootId: string | null
  drillPath: DrillCrumb[]
  pendingAutoLayout: boolean
  pendingFocusNodeId: string | null
  setSelectedNode: (id: string | null) => void
  toggleExpand: (id: string) => void
  expandAll: (ids: string[]) => void
  collapseAll: () => void
  enterDrillDown: (nodeId: string, title: string) => void
  exitDrillDown: () => void
  exitToRoot: () => void
  triggerAutoLayout: () => void
  clearAutoLayout: () => void
  setPendingFocusNode: (id: string | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedNodeId: null,
  expandedNodeIds: new Set(),
  drillRootId: null,
  drillPath: [],
  pendingAutoLayout: false,
  pendingFocusNodeId: null,
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedNodeIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { expandedNodeIds: next }
    }),
  expandAll: (ids) => set({ expandedNodeIds: new Set(ids) }),
  collapseAll: () => set({ expandedNodeIds: new Set() }),
  enterDrillDown: (nodeId, title) =>
    set((state) => ({
      drillRootId: nodeId,
      drillPath: [...state.drillPath, { id: nodeId, title }],
      expandedNodeIds: new Set([nodeId, ...Array.from(state.expandedNodeIds)]),
    })),
  exitDrillDown: () =>
    set((state) => {
      const path = state.drillPath.slice(0, -1)
      return {
        drillRootId: path.length > 0 ? path[path.length - 1].id : null,
        drillPath: path,
      }
    }),
  exitToRoot: () => set({ drillRootId: null, drillPath: [] }),
  triggerAutoLayout: () => set({ pendingAutoLayout: true }),
  clearAutoLayout: () => set({ pendingAutoLayout: false }),
  setPendingFocusNode: (id) => set({ pendingFocusNodeId: id }),
}))
