import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'
import type { ArchitectureNode, NodeEdge, DiffResult } from '@/types'
import { DIFF_COLORS } from '@/lib/constants'
import type { RelationType } from '@/store/relationTypeStore'

const NODE_W = 210
const NODE_H = 110
const DESC_H = 20
const ACTION_H = 28
const RANK_SEP = 160
const NODE_SEP = 60

const DEFAULT_GROUP_W = 500
const DEFAULT_GROUP_H = 380

const GROUP_PAD_X = 20
const GROUP_PAD_TOP = 52
const GROUP_PAD_BOT = 20

function estimateHeight(node: ArchitectureNode, hasChildren: boolean): number {
  let h = NODE_H
  if (node.metadata_?.description) h += DESC_H
  if (hasChildren) h += ACTION_H
  return h
}

function edgeColor(relationType: string, typeMap: Map<string, RelationType>): string {
  return typeMap.get(relationType)?.color ?? '#6b7280'
}

function edgeLabel(relationType: string, typeMap: Map<string, RelationType>): string {
  return typeMap.get(relationType)?.label ?? relationType
}

function filterVisible(
  nodes: ArchitectureNode[],
  serverEdges: NodeEdge[],
  expandedIds: Set<string>,
): { visibleNodes: ArchitectureNode[]; visibleEdgeIds: Set<string> } {
  const groupNodeIds = new Set(nodes.filter(n => n.type === 'group').map(n => n.id))
  // Nodes that belong to a group area
  const groupChildIds = new Set(nodes.filter(n => n.parent_id && groupNodeIds.has(n.parent_id)).map(n => n.id))

  // Only run edge-based visibility on non-group-children
  const nonGroupChildren = nodes.filter(n => !groupChildIds.has(n.id))
  const hasIncoming = new Set(
    serverEdges.filter(e => !groupChildIds.has(e.target_id)).map(e => e.target_id)
  )
  const visible = new Set<string>()

  nonGroupChildren.forEach(n => {
    // Group areas are always visible; regular roots are visible by default
    if (groupNodeIds.has(n.id) || !hasIncoming.has(n.id)) visible.add(n.id)
  })

  // Group children are visible if their parent group is visible
  nodes.forEach(n => {
    if (n.parent_id && visible.has(n.parent_id)) visible.add(n.id)
  })

  // NOTE:
  // queue must be created *after* group children are added to `visible`.
  // Otherwise expand/collapse from group-child sources never propagates.
  const queue = [...visible]
  while (queue.length) {
    const id = queue.shift()!
    if (!expandedIds.has(id) && !groupNodeIds.has(id)) continue
    serverEdges.filter(e => e.source_id === id).forEach(e => {
      if (!visible.has(e.target_id) && !groupChildIds.has(e.target_id)) {
        visible.add(e.target_id)
        queue.push(e.target_id)
      }
    })
  }

  const visibleEdgeIds = new Set(
    serverEdges.filter(e => visible.has(e.source_id) && visible.has(e.target_id)).map(e => e.id)
  )

  return { visibleNodes: nodes.filter(n => visible.has(n.id)), visibleEdgeIds }
}

export function buildLayout(
  nodes: ArchitectureNode[],
  serverEdges: NodeEdge[],
  expandedIds: Set<string>,
  forceAuto = false,
  hiddenEdgeTypes: Set<string> = new Set(),
  diffResult: DiffResult | null = null,
  relationTypes: RelationType[] = [],
): { nodes: Node[]; edges: Edge[]; groupDimensions: Map<string, { width: number; height: number }> } {
  const typeMap = new Map(relationTypes.map(t => [t.id, t]))
  if (nodes.length === 0) return { nodes: [], edges: [] }

  const activeEdges = hiddenEdgeTypes.size > 0
    ? serverEdges.filter(e => !hiddenEdgeTypes.has(e.relation_type))
    : serverEdges

  // ── Group area nodes (computed first so outgoingCount can exclude group children) ──
  const groupNodeIds = new Set(nodes.filter(n => n.type === 'group').map(n => n.id))
  const childToGroup = new Map<string, string>()
  nodes.forEach(n => {
    if (n.parent_id && groupNodeIds.has(n.parent_id)) childToGroup.set(n.id, n.parent_id)
  })

  // Only count edges to non-group-child targets: expand button should only show
  // when there are actually hideable (edge-connected) children to toggle.
  const outgoingCount = new Map<string, number>()
  activeEdges.forEach(e => {
    if (!childToGroup.has(e.target_id)) {
      outgoingCount.set(e.source_id, (outgoingCount.get(e.source_id) ?? 0) + 1)
    }
  })

  const { visibleNodes, visibleEdgeIds } = filterVisible(nodes, activeEdges, expandedIds)
  if (visibleNodes.length === 0) return { nodes: [], edges: [] }

  const visibleIds = new Set(visibleNodes.map(n => n.id))

  // ── Dagre layout: top-level regular nodes + group areas ─────────────────
  const topLevelNodes = visibleNodes.filter(n => !childToGroup.has(n.id) && n.type !== 'group')
  const topLevelGroups = visibleNodes.filter(n => n.type === 'group')

  const g = new dagre.graphlib.Graph({ multigraph: false })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: RANK_SEP, nodesep: NODE_SEP, marginx: 40, marginy: 40 })

  topLevelNodes.forEach(n => {
    const hasChildren = (outgoingCount.get(n.id) ?? 0) > 0
    g.setNode(n.id, { width: NODE_W, height: estimateHeight(n, hasChildren) })
  })

  topLevelGroups.forEach(n => {
    const w = (n.metadata_?.width as number) ?? DEFAULT_GROUP_W
    const h = (n.metadata_?.height as number) ?? DEFAULT_GROUP_H
    g.setNode(n.id, { width: w, height: h })
  })

  const dagreIds = new Set([...topLevelNodes.map(n => n.id), ...topLevelGroups.map(n => n.id)])

  // Direct top-level ↔ top-level edges
  activeEdges.forEach(e => {
    if (dagreIds.has(e.source_id) && dagreIds.has(e.target_id)) {
      if (!g.hasEdge(e.source_id, e.target_id)) g.setEdge(e.source_id, e.target_id)
    }
  })

  // Infer inter-group edges from child connections so Dagre understands the flow.
  // Skip reverse edges to keep the graph acyclic (Dagre cycle-breaking is non-deterministic).
  activeEdges.forEach(e => {
    const sg = childToGroup.get(e.source_id)
    const tg = childToGroup.get(e.target_id)
    // child → child: add group → group edge (one direction only)
    if (sg && tg && sg !== tg && !g.hasEdge(sg, tg) && !g.hasEdge(tg, sg)) g.setEdge(sg, tg)
    // child → top-level: add group → node edge (one direction only)
    if (sg && dagreIds.has(e.target_id) && !g.hasEdge(sg, e.target_id) && !g.hasEdge(e.target_id, sg)) g.setEdge(sg, e.target_id)
    // top-level → child: add node → group edge (one direction only)
    if (dagreIds.has(e.source_id) && tg && !g.hasEdge(e.source_id, tg) && !g.hasEdge(tg, e.source_id)) g.setEdge(e.source_id, tg)
  })

  const nodesById = new Map(visibleNodes.map(n => [n.id, n]))

  // Synthetic parent→child edges for non-group semantic relationships.
  // Nodes whose parent_id points to a non-group (service, component, module) node
  // have no layout anchor in Dagre and pile up in rank 0. Adding a parent→child
  // edge places them one rank to the right of their semantic parent in LR layout.
  visibleNodes.forEach(n => {
    if (n.parent_id && !childToGroup.has(n.id) && dagreIds.has(n.id)) {
      if (dagreIds.has(n.parent_id)) {
        // Direct semantic parent is in Dagre
        if (!g.hasEdge(n.parent_id, n.id) && !g.hasEdge(n.id, n.parent_id)) {
          g.setEdge(n.parent_id, n.id)
        }
      } else {
        // Parent might be a group child (e.g. a page). Connect to the grandparent group.
        const parent = nodesById.get(n.parent_id)
        if (parent) {
          const grandGroup = childToGroup.get(parent.id)
          if (grandGroup && dagreIds.has(grandGroup) && !g.hasEdge(grandGroup, n.id) && !g.hasEdge(n.id, grandGroup)) {
            g.setEdge(grandGroup, n.id)
          }
        }
      }
    }
  })

  // ── Sub-Dagre for group children (forceAuto only) ───────────────────────
  const childrenByGroup = new Map<string, ArchitectureNode[]>()
  visibleNodes
    .filter(n => childToGroup.has(n.id))
    .forEach(n => {
      const gid = childToGroup.get(n.id)!
      if (!childrenByGroup.has(gid)) childrenByGroup.set(gid, [])
      childrenByGroup.get(gid)!.push(n)
    })

  const childDagrePosMap = new Map<string, Map<string, { x: number; y: number }>>()
  const computedGroupDims = new Map<string, { width: number; height: number }>()

  if (forceAuto) {
    topLevelGroups.forEach(groupNode => {
      const children = childrenByGroup.get(groupNode.id)
      if (!children || children.length === 0) return

      const childIds = new Set(children.map(n => n.id))

      const gc = new dagre.graphlib.Graph({ multigraph: false })
      gc.setDefaultEdgeLabel(() => ({}))
      gc.setGraph({ rankdir: 'LR', ranksep: RANK_SEP, nodesep: NODE_SEP, marginx: GROUP_PAD_X, marginy: GROUP_PAD_TOP })

      children.forEach(n => {
        const childCount = outgoingCount.get(n.id) ?? 0
        gc.setNode(n.id, { width: NODE_W, height: estimateHeight(n, childCount > 0) })
      })

      activeEdges.forEach(e => {
        if (childIds.has(e.source_id) && childIds.has(e.target_id)) {
          if (!gc.hasEdge(e.source_id, e.target_id) && !gc.hasEdge(e.target_id, e.source_id)) {
            gc.setEdge(e.source_id, e.target_id)
          }
        }
      })

      dagre.layout(gc)

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      children.forEach(n => {
        const nd = gc.node(n.id)
        minX = Math.min(minX, nd.x - nd.width / 2)
        minY = Math.min(minY, nd.y - nd.height / 2)
        maxX = Math.max(maxX, nd.x + nd.width / 2)
        maxY = Math.max(maxY, nd.y + nd.height / 2)
      })

      const posMap = new Map<string, { x: number; y: number }>()
      children.forEach(n => {
        const nd = gc.node(n.id)
        posMap.set(n.id, {
          x: nd.x - nd.width / 2 - minX + GROUP_PAD_X,
          y: nd.y - nd.height / 2 - minY + GROUP_PAD_TOP,
        })
      })
      childDagrePosMap.set(groupNode.id, posMap)

      const contentW = maxX - minX
      const contentH = maxY - minY
      const newW = Math.max((groupNode.metadata_?.width as number) ?? DEFAULT_GROUP_W, contentW + GROUP_PAD_X * 2)
      const newH = Math.max((groupNode.metadata_?.height as number) ?? DEFAULT_GROUP_H, contentH + GROUP_PAD_TOP + GROUP_PAD_BOT)
      computedGroupDims.set(groupNode.id, { width: newW, height: newH })

      // Update outer Dagre node with computed dimensions before layout runs
      g.setNode(groupNode.id, { width: newW, height: newH })
    })
  }

  dagre.layout(g)

  // ── Build output ────────────────────────────────────────────────────────
  const rfNodes: Node[] = []

  // 1. Group area nodes (rendered as backgrounds, zIndex: -1)
  topLevelGroups.forEach(n => {
    const dims = computedGroupDims.get(n.id)
    const w = dims?.width ?? (n.metadata_?.width as number) ?? DEFAULT_GROUP_W
    const h = dims?.height ?? (n.metadata_?.height as number) ?? DEFAULT_GROUP_H
    const dagreNode = g.node(n.id)
    const dagrePos = dagreNode
      ? { x: dagreNode.x - w / 2, y: dagreNode.y - h / 2 }
      : { x: 60, y: 60 }
    const hasPos = !forceAuto && n.position != null
    rfNodes.push({
      id: n.id,
      type: 'groupArea',
      position: hasPos ? n.position as { x: number; y: number } : dagrePos,
      // Children can be dragged outside the group bounds; avoid clipping.
      style: { width: w, height: h, overflow: 'visible' },
      zIndex: -1,
      data: { node: n },
    })
  })

  // 2. Group children
  childrenByGroup.forEach((children, groupId) => {
    const posMap = childDagrePosMap.get(groupId)
    children.forEach((n, idx) => {
      const hasPos = !forceAuto && n.position != null
      const childCount = outgoingCount.get(n.id) ?? 0
      const h = estimateHeight(n, childCount > 0)
      rfNodes.push({
        id: n.id,
        type: 'archNode',
        parentId: n.parent_id!,
        position: hasPos
          ? n.position as { x: number; y: number }
          : posMap?.get(n.id) ?? { x: GROUP_PAD_X, y: GROUP_PAD_TOP + idx * (h + 16) },
        data: { node: n, hasChildren: childCount > 0, childCount },
      })
    })
  })

  // 3. Top-level regular nodes (including semantic-parent children, treated as absolute)
  topLevelNodes.forEach(n => {
    const { x, y, width, height } = g.node(n.id)
    const dagrePos = { x: x - width / 2, y: y - height / 2 }
    const hasServerPos = !forceAuto && n.position != null
    const childCount = outgoingCount.get(n.id) ?? 0
    rfNodes.push({
      id: n.id,
      type: 'archNode',
      position: hasServerPos ? n.position as { x: number; y: number } : dagrePos,
      data: { node: n, hasChildren: childCount > 0, childCount },
    })
  })

  // ── Edges ───────────────────────────────────────────────────────────────
  const rfEdges: Edge[] = activeEdges
    .filter(e => visibleEdgeIds.has(e.id) && visibleIds.has(e.source_id) && visibleIds.has(e.target_id))
    .map(e => {
      const color = edgeColor(e.relation_type, typeMap)
      const label = edgeLabel(e.relation_type, typeMap)

      let stroke = color
      let strokeDasharray: string | undefined
      let animated = false

      if (diffResult) {
        if (diffResult.edges_added.includes(e.id)) {
          stroke = DIFF_COLORS.added
          animated = true
        } else if (diffResult.edges_deleted.includes(e.id)) {
          stroke = DIFF_COLORS.deleted
          strokeDasharray = '6 3'
        }
      }

      const displayLabel = label.length > 32 ? label.slice(0, 30) + '…' : label

      return {
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        type: 'relation',
        animated,
        label: displayLabel,
        style: { stroke, strokeWidth: 1.5, strokeDasharray },
        deletable: true,
        data: { relation_type: e.relation_type },
      }
    })

  return { nodes: rfNodes, edges: rfEdges, groupDimensions: computedGroupDims }
}
