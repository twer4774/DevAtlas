import type { Node } from '@xyflow/react'

/** Default arch node box (aligned with MindmapCanvas / nodeLayout). */
export const PLACE_NODE_W = 210
export const PLACE_NODE_H = 110
export const PLACE_PAD = 40

/** Default group footprint for placement (toolbar). */
export const PLACE_GROUP_W = 500
export const PLACE_GROUP_H = 380

export function getPlacementBounds(n: Node) {
  const w = (n.style?.width as number) ?? n.measured?.width ?? PLACE_NODE_W
  const h = (n.style?.height as number) ?? n.measured?.height ?? PLACE_NODE_H
  return { x: n.position.x, y: n.position.y, w, h }
}

export function placementsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  pad = PLACE_PAD,
): boolean {
  return ax < bx + bw + pad && ax + aw + pad > bx &&
    ay < by + bh + pad && ay + ah + pad > by
}

/** Places a top-level React Flow node avoiding overlap with other top-level nodes */
export function findFreeTopLevelPos(
  allNodes: Node[],
  newW: number,
  newH: number,
  startX: number,
  startY: number,
): { x: number; y: number } {
  const topLevel = allNodes.filter(n => !n.parentId)

  const isFree = (x: number, y: number) =>
    topLevel.every((n) => {
      const b = getPlacementBounds(n)
      return !placementsOverlap(x, y, newW, newH, b.x, b.y, b.w, b.h)
    })

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const x = startX + col * (newW + PLACE_PAD)
      const y = startY + row * (newH + PLACE_PAD)
      if (isFree(x, y)) return { x, y }
    }
  }

  const maxBottom = topLevel.reduce((m, n) => {
    const b = getPlacementBounds(n)
    return Math.max(m, b.y + b.h)
  }, startY)
  return { x: startX, y: maxBottom + PLACE_PAD }
}

const INNER_PAD_FOR_SEARCH = 12

/** Place a child relative to parent group avoiding sibling overlap */
export function findFreeChildInGroupPos(
  childNodesSameParent: Node[],
  newW: number,
  newH: number,
  innerStartX: number,
  innerStartY: number,
): { x: number; y: number } {
  const siblings = childNodesSameParent

  const isFree = (x: number, y: number) =>
    siblings.every((n) => {
      const b = getPlacementBounds(n)
      return !placementsOverlap(
        x, y, newW, newH,
        b.x, b.y, b.w, b.h,
        INNER_PAD_FOR_SEARCH,
      )
    })

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = innerStartX + col * (newW + INNER_PAD_FOR_SEARCH)
      const y = innerStartY + row * (newH + INNER_PAD_FOR_SEARCH)
      if (isFree(x, y)) return { x, y }
    }
  }

  const maxBottom = siblings.reduce((m, n) => {
    const b = getPlacementBounds(n)
    return Math.max(m, b.y + b.h)
  }, innerStartY)
  return { x: innerStartX, y: maxBottom + INNER_PAD_FOR_SEARCH }
}
