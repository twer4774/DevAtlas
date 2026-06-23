import type { QueryClient } from '@tanstack/react-query'
import type { ArchitectureNode } from '@/types'
import { PLACE_NODE_H, PLACE_NODE_W } from '@/lib/mapPlacement'

const DEFAULT_GROUP_W = 500
const DEFAULT_GROUP_H = 380
const MIN_GROUP_W = 280
const MIN_GROUP_H = 180

// Group header occupies ~44px at the top; children must clear this visually.
export const GROUP_HEADER_H = 44
const FIT_PAD_R = 48
const FIT_PAD_B = 48

/**
 * If children extend past the current group box, return new width/height (grow only).
 */
export function computeGroupFitMetadata(
  group: ArchitectureNode,
  allNodes: ArchitectureNode[],
  childW = PLACE_NODE_W,
  childH = PLACE_NODE_H,
): { width: number; height: number } | null {
  const children = allNodes.filter(n => n.parent_id === group.id)
  if (children.length === 0) return null

  const curW = (group.metadata_?.width as number) ?? DEFAULT_GROUP_W
  const curH = (group.metadata_?.height as number) ?? DEFAULT_GROUP_H

  let maxR = 0
  let maxB = GROUP_HEADER_H  // ensure children never push below the header
  for (const c of children) {
    if (c.position == null) continue
    const x = c.position.x
    const y = c.position.y
    maxR = Math.max(maxR, x + childW)
    maxB = Math.max(maxB, y + childH)
  }

  const needW = Math.max(MIN_GROUP_W, Math.ceil(maxR + FIT_PAD_R))
  const needH = Math.max(MIN_GROUP_H, Math.ceil(maxB + FIT_PAD_B))

  if (needW <= curW && needH <= curH) return null
  return { width: Math.max(curW, needW), height: Math.max(curH, needH) }
}

/**
 * Updates query cache with larger group dimensions if needed; returns API patch or null.
 */
export function applyGroupFitOptimistic(
  qc: QueryClient,
  versionId: string,
  groupId: string,
): { id: string; metadata_: Record<string, unknown> } | null {
  const all = qc.getQueryData<ArchitectureNode[]>(['nodes', versionId])
  if (!all) return null
  const group = all.find(n => n.id === groupId && n.type === 'group')
  if (!group) return null

  const fit = computeGroupFitMetadata(group, all)
  if (!fit) return null

  const nextMeta = { ...group.metadata_, width: fit.width, height: fit.height }
  qc.setQueryData<ArchitectureNode[]>(['nodes', versionId], prev =>
    prev?.map(n => (n.id === groupId ? { ...n, metadata_: nextMeta } : n)) ?? [],
  )
  return { id: groupId, metadata_: nextMeta }
}

/**
 * Fits all groups to their children in the query cache and returns API patches.
 * Call this on initial version load to ensure groups contain their nodes.
 */
export function fitAllGroups(
  qc: QueryClient,
  versionId: string,
): { id: string; metadata_: Record<string, unknown> }[] {
  const all = qc.getQueryData<ArchitectureNode[]>(['nodes', versionId])
  if (!all) return []

  const patches: { id: string; metadata_: Record<string, unknown> }[] = []
  const groups = all.filter(n => n.type === 'group')

  for (const group of groups) {
    const fit = computeGroupFitMetadata(group, all)
    if (!fit) continue
    const nextMeta = { ...group.metadata_, width: fit.width, height: fit.height }
    patches.push({ id: group.id, metadata_: nextMeta })
  }

  if (patches.length > 0) {
    qc.setQueryData<ArchitectureNode[]>(['nodes', versionId], prev =>
      prev?.map(n => {
        const patch = patches.find(p => p.id === n.id)
        return patch ? { ...n, metadata_: patch.metadata_ } : n
      }) ?? [],
    )
  }

  return patches
}
