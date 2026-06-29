import { create } from 'zustand'
import type { DiffResult } from '@/types'

interface DiffState {
  isDiffMode: boolean
  compareVersionId: string | null
  diffResult: DiffResult | null
  setCompareVersion: (id: string | null) => void
  setDiffResult: (result: DiffResult) => void
  clearDiff: () => void
}

export const useDiffStore = create<DiffState>((set) => ({
  isDiffMode: false,
  compareVersionId: null,
  diffResult: null,
  setCompareVersion: (id) => set({ compareVersionId: id }),
  setDiffResult: (result) => set({ diffResult: result, isDiffMode: true }),
  clearDiff: () => set({ isDiffMode: false, compareVersionId: null, diffResult: null }),
}))
