import { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  useStore,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Node,
  type Edge as RFEdge,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQueryClient } from '@tanstack/react-query'
import { useNodes, useUpdateNode } from '@/hooks/useNodes'
import { useEdges, useCreateEdge, useDeleteEdge } from '@/hooks/useEdges'
import { useMapStore } from '@/store/mapStore'
import { useDocumentStore } from '@/store/documentStore'
import { useToastStore } from '@/store/toastStore'
import { useDiffStore } from '@/store/diffStore'
import { useEdgeFilterStore } from '@/store/edgeFilterStore'
import { useRelationTypeStore } from '@/store/relationTypeStore'
import { buildLayout } from '@/lib/nodeLayout'
import { applyGroupFitOptimistic, fitAllGroups } from '@/lib/groupFit'
import { nodesApi } from '@/api/nodes'
import { ArchNodeComponent } from './ArchNode'
import { GroupAreaNode } from './GroupAreaNode'
import { RelationEdge } from './RelationEdge'
import { MapToolbar } from './MapToolbar'
import { DrillBreadcrumb } from './DrillBreadcrumb'
import { NodeSearchBar } from './NodeSearchBar'
import { Spinner } from '@/components/common/Spinner'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { getNodeTypeColor } from '@/lib/constants'
import { Plus, RectangleHorizontal, GitBranch, Sparkles } from 'lucide-react'
import type { ArchitectureNode, NodeEdge } from '@/types'

const nodeTypes: NodeTypes = { archNode: ArchNodeComponent, groupArea: GroupAreaNode }
const edgeTypes: EdgeTypes = { relation: RelationEdge }
const NODE_W = 210
function MiniMapNodeWithLabel(props: {
  id: string
  x: number
  y: number
  width: number
  height: number
  borderRadius: number
  className: string
  color?: string
  shapeRendering: string
  strokeColor?: string
  strokeWidth?: number
  style?: React.CSSProperties
  selected: boolean
  onClick?: (event: React.MouseEvent, id: string) => void
}) {
  const node = useStore(s => s.nodeLookup.get(props.id))
  const isGroup = node?.type === 'groupArea'
  const title = isGroup ? ((node?.data as { node?: ArchitectureNode } | undefined)?.node?.title ?? '') : ''

  const minSide = Math.min(props.width, props.height)
  // Make it clearly readable on the minimap:
  // - aim for ~35% of the smaller side
  // - cap to keep it from overwhelming very large groups
  const fontSize = Math.max(18, Math.min(54, Math.floor(minSide * 0.42)))
  const showLabel = isGroup && !!title && minSide >= 55 && props.width >= 80 && props.height >= 55
  const cx = props.x + props.width / 2
  const cy = props.y + props.height / 2
  // SVG baseline handling varies; dy provides more consistent visual centering.
  const dy = '0.35em'

  // If the title is long, reduce font size rather than distorting glyphs/spacing.
  const availableW = Math.max(0, props.width - 16)
  const approxCharW = 0.62 // rough average for system-ui at fontWeight 800
  const fitFontSize = title
    ? Math.floor(availableW / Math.max(1, title.length) / approxCharW)
    : fontSize
  const effectiveFontSize = Math.max(16, Math.min(fontSize, fitFontSize))

  // Render as SVG element (required by MiniMap.nodeComponent)
  return (
    <g className={props.className} onClick={(e) => props.onClick?.(e, props.id)} style={props.style}>
      <rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        rx={props.borderRadius}
        ry={props.borderRadius}
        fill={props.color}
        stroke={props.strokeColor}
        strokeWidth={props.strokeWidth}
        shapeRendering={props.shapeRendering as unknown as 'auto'}
      />
      {showLabel && (
        <>
          {/* subtle backdrop for readability */}
          <rect
            x={props.x + 6}
            y={cy - fontSize * 0.78}
            width={Math.max(0, props.width - 12)}
            height={fontSize * 1.5}
            rx={Math.min(10, fontSize * 0.5)}
            fill="rgba(0,0,0,0.22)"
            pointerEvents="none"
          />
          {/* outline for readability */}
          <text
            x={cx}
            y={cy}
            dy={dy}
            fontSize={effectiveFontSize}
            fontWeight={800}
            fill="rgba(0,0,0,0.65)"
            stroke="rgba(0,0,0,0.65)"
            strokeWidth={4}
            paintOrder="stroke"
            pointerEvents="none"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {title}
          </text>
          <text
            x={cx}
            y={cy}
            dy={dy}
            fontSize={effectiveFontSize}
            fontWeight={800}
            fill="rgba(255,255,255,0.92)"
            pointerEvents="none"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {title}
          </text>
        </>
      )}
    </g>
  )
}

// Group drill-down: group node + its children + nodes directly connected to those children
function getGroupSubtree(nodes: ArchitectureNode[], edges: NodeEdge[], groupId: string): ArchitectureNode[] {
  const groupNode = nodes.find(n => n.id === groupId)
  const children = nodes.filter(n => n.parent_id === groupId)
  const childIds = new Set(children.map(n => n.id))

  const externalIds = new Set<string>()
  edges.forEach(e => {
    if (childIds.has(e.source_id) && !childIds.has(e.target_id) && e.target_id !== groupId)
      externalIds.add(e.target_id)
    if (childIds.has(e.target_id) && !childIds.has(e.source_id) && e.source_id !== groupId)
      externalIds.add(e.source_id)
  })

  const externalNodes = nodes.filter(n => externalIds.has(n.id))
  return [...(groupNode ? [groupNode] : []), ...children, ...externalNodes]
}

function getDescendantIds(edges: NodeEdge[], parentId: string): Set<string> {
  const ids = new Set<string>()
  const queue = [parentId]
  while (queue.length) {
    const id = queue.shift()!
    edges.filter(e => e.source_id === id).forEach(e => {
      if (!ids.has(e.target_id)) { ids.add(e.target_id); queue.push(e.target_id) }
    })
  }
  return ids
}

function getAncestorIds(edges: NodeEdge[], nodeId: string): Set<string> {
  const ids = new Set<string>()
  const queue = [nodeId]
  while (queue.length) {
    const id = queue.shift()!
    edges.filter(e => e.target_id === id).forEach(e => {
      if (!ids.has(e.source_id)) { ids.add(e.source_id); queue.push(e.source_id) }
    })
  }
  return ids
}

function FlowInner({ versionId }: { versionId: string }) {
  const { fitView, setCenter, getNode } = useReactFlow()
  const qc = useQueryClient()

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [selectedRelationType, setSelectedRelationType] = useState<string>('depends_on')
  const [isDragging, setIsDragging] = useState(false)

  const { data: rawNodes, isLoading: nodesLoading } = useNodes(versionId, isDragging)
  const { data: rawEdges, isLoading: edgesLoading } = useEdges(versionId)
  const updateNode = useUpdateNode(versionId)
  const createEdge = useCreateEdge(versionId)
  const deleteEdge = useDeleteEdge(versionId)
  const { add: addToast } = useToastStore()
  const { isDiffMode, diffResult } = useDiffStore()
  const { hiddenTypes } = useEdgeFilterStore()
  const { types: relationTypes } = useRelationTypeStore()
  const {
    expandedNodeIds, setSelectedNode, setSelectedEdge, toggleExpand,
    drillRootId, pendingAutoLayout, clearAutoLayout,
    pendingFocusNodeId, setPendingFocusNode,
  } = useMapStore()
  const { setActiveDocument } = useDocumentStore()

  const prevLayoutKeyRef = useRef<string>('')
  const prevDrillRootRef = useRef<string | null>('')
  const isDraggingRef = useRef(false)
  const suppressNextLayoutRef = useRef(false)
  const lastDragEndTimeRef = useRef<number>(0)
  const autoFitDoneRef = useRef<string | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const dragChildIdsRef = useRef<Set<string>>(new Set())
  const childStartPosRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const childMovedRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const pendingNodeChangesRef = useRef<NodeChange<Node>[] | null>(null)
  const nodesChangeRafRef = useRef<number | null>(null)
  const dragOverGroupIdRef = useRef<string | null>(null)

  const rawNodesRef = useRef<ArchitectureNode[]>([])
  const rawEdgesRef = useRef<NodeEdge[]>([])

  useEffect(() => {
    rawNodesRef.current = rawNodes ?? []
  }, [rawNodes])

  // Auto-fit all groups once per version on initial load
  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return
    if (autoFitDoneRef.current === versionId) return
    autoFitDoneRef.current = versionId

    const patches = fitAllGroups(qc, versionId)
    if (patches.length > 0) {
      // setQueryData already updated the cache; skip invalidation to avoid refetch-triggered relayout
      patches.forEach(p => updateNode.mutate({ id: p.id, metadata_: p.metadata_, _noInvalidate: true }))
    }
  }, [rawNodes, versionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    rawEdgesRef.current = rawEdges ?? []
  }, [rawEdges])

  const visibleNodes = useMemo(() => {
    if (!rawNodes) return []
    if (!drillRootId) return rawNodes
    const drillRoot = rawNodes.find(n => n.id === drillRootId)
    if (drillRoot?.type === 'group') {
      return getGroupSubtree(rawNodes, rawEdges ?? [], drillRootId)
    }
    return rawNodes // non-group drill-down no longer supported via UI
  }, [rawNodes, rawEdges, drillRootId])

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(
      visibleNodes,
      rawEdges ?? [],
      expandedNodeIds,
      false,
      hiddenTypes,
      isDiffMode ? diffResult : null,
      relationTypes,
    ),
    [visibleNodes, rawEdges, expandedNodeIds, hiddenTypes, isDiffMode, diffResult, relationTypes],
  )

  const [rfNodes, setNodes] = useNodesState<Node>(layoutNodes)
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(layoutEdges)

  useEffect(() => {
    if (isDraggingRef.current) return
    // Skip the first render after drag ends: rawNodes hasn't been updated yet by
    // React Query's microtask notification, so layoutNodes would still reflect the
    // pre-drag positions and would overwrite the just-dragged RF positions.
    if (suppressNextLayoutRef.current) {
      suppressNextLayoutRef.current = false
      return
    }
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  const layoutKey = `${layoutNodes.length}-${layoutEdges.length}-${drillRootId ?? ''}`
  useEffect(() => {
    if (layoutKey === prevLayoutKeyRef.current) return
    const drillChanged = drillRootId !== prevDrillRootRef.current
    const isInitial = prevLayoutKeyRef.current === ''
    prevLayoutKeyRef.current = layoutKey
    prevDrillRootRef.current = drillRootId
    // 최초 로드 또는 드릴다운 변경 시에만 fitView — 펼치기/접기는 뷰 고정
    if (!isInitial && !drillChanged) return
    if (isDraggingRef.current || Date.now() - lastDragEndTimeRef.current < 1000) return
    const t = setTimeout(() => fitView({ duration: 500, padding: 0.18 }), 30)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])

  useEffect(() => {
    if (!pendingAutoLayout || !rawNodes) return
    clearAutoLayout()

    const { nodes: autoNodes, edges: autoEdges, groupDimensions } = buildLayout(
      visibleNodes, rawEdgesRef.current, expandedNodeIds, true, hiddenTypes, null, relationTypes
    )
    // Save all visible nodes (including null-position ones that now have Dagre positions)
    const nodesToSave = autoNodes.filter(an =>
      rawNodes.some(n => n.id === an.id)
    )

    if (nodesToSave.length === 0) {
      addToast('이동한 노드가 없습니다', 'info')
      return
    }

    setNodes(autoNodes)
    setEdges(autoEdges)

    qc.setQueryData<ArchitectureNode[]>(['nodes', versionId], prev =>
      prev?.map(n => {
        const reset = nodesToSave.find(an => an.id === n.id)
        if (!reset) return n
        const dims = groupDimensions.get(n.id)
        return {
          ...n,
          position: reset.position,
          ...(dims ? { metadata_: { ...(n.metadata_ ?? {}), width: dims.width, height: dims.height } } : {}),
        }
      }) ?? [],
    )

    Promise.all(nodesToSave.map(n => {
      const dims = groupDimensions.get(n.id as string)
      const rawNode = rawNodes.find(rn => rn.id === n.id)
      return nodesApi.update(n.id as string, {
        position: n.position as { x: number; y: number },
        ...(dims && rawNode ? { metadata_: { ...(rawNode.metadata_ ?? {}), width: dims.width, height: dims.height } } : {}),
      })
    }))
      .then(() => addToast(`${nodesToSave.length}개 노드가 정렬되었습니다`, 'success'))
      .catch(() => addToast('일부 노드 위치 저장에 실패했습니다', 'error'))

    setTimeout(() => fitView({ duration: 500, padding: 0.18 }), 30)
  }, [pendingAutoLayout]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 드래그 핸들러 ──────────────────────────────────────────
  // 드래그 중 노드가 어느 그룹 위에 있는지 감지해 isDragTarget 시각 피드백 제공
  const detectHoverGroup = useCallback((node: Node): string | null => {
    if (node.type !== 'archNode') return null
    const allNodes = rawNodesRef.current
    const groupNodes = allNodes.filter(n => n.type === 'group')
    const parentRF = node.parentId ? getNode(node.parentId) : null
    const globalPos = parentRF
      ? { x: parentRF.position.x + node.position.x, y: parentRF.position.y + node.position.y }
      : node.position
    const cx = globalPos.x + NODE_W / 2
    const cy = globalPos.y + 60
    const found = groupNodes.find(g => {
      const gRF = getNode(g.id)
      const gx = gRF?.position.x ?? (g.position as { x: number; y: number }).x
      const gy = gRF?.position.y ?? (g.position as { x: number; y: number }).y
      const gw = (g.metadata_?.width as number) ?? 500
      const gh = (g.metadata_?.height as number) ?? 380
      return cx > gx && cx < gx + gw && cy > gy && cy < gy + gh
    })
    return found?.id ?? null
  }, [getNode])

  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    const newGroupId = detectHoverGroup(node)
    const prev = dragOverGroupIdRef.current
    if (newGroupId === prev) return
    dragOverGroupIdRef.current = newGroupId
    setNodes(nodes => nodes.map(n => {
      if (n.type !== 'groupArea') return n
      if (n.id === prev || n.id === newGroupId) {
        return { ...n, data: { ...n.data, isDragTarget: n.id === newGroupId } }
      }
      return n
    }))
  }, [detectHoverGroup, setNodes])

  const onNodeDragStart = useCallback((evt: React.MouseEvent, node: Node) => {
    // 드래그 중 5초 refetch가 완료되어 캐시를 덮어쓰면 drag-stop 시 snap-back 발생.
    // 드래그 시작 시 진행 중인 쿼리를 취소해 이 race condition을 방지한다.
    qc.cancelQueries({ queryKey: ['nodes', versionId] })

    isDraggingRef.current = true
    setIsDragging(true)
    dragOverGroupIdRef.current = null
    dragStartPosRef.current = { x: node.position.x, y: node.position.y }
    childMovedRef.current = new Map()

    // 기본 드래그에서는 연결 노드가 따라오지 않게 한다.
    // 필요 시 Shift+Drag 로 서브트리를 함께 이동한다.
    if (!evt.shiftKey) {
      dragChildIdsRef.current = new Set()
      childStartPosRef.current = new Map()
      return
    }

    const childIds = getDescendantIds(rawEdgesRef.current, node.id)
    dragChildIdsRef.current = childIds

    const startPositions = new Map<string, { x: number; y: number }>()
    childIds.forEach(childId => {
      const childNode = getNode(childId)
      if (childNode) startPositions.set(childId, { x: childNode.position.x, y: childNode.position.y })
    })
    childStartPosRef.current = startPositions
  }, [qc, versionId, getNode])

  const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    // 드래그 중에는 onNodesChange가 매우 자주 발생하므로, 1프레임에 1번만 반영해
    // 커서/포인터를 더 자연스럽게 따라오도록 한다.
    if (dragChildIdsRef.current.size > 0 && dragStartPosRef.current) {
      const dragChange = changes.find(c => c.type === 'position' && c.dragging && c.position)
      if (dragChange?.type === 'position' && dragChange.position) {
        const totalDx = dragChange.position.x - dragStartPosRef.current.x
        const totalDy = dragChange.position.y - dragStartPosRef.current.y
        const childChanges: NodeChange<Node>[] = []
        dragChildIdsRef.current.forEach(childId => {
          const childStart = childStartPosRef.current.get(childId)
          if (!childStart) return
          childChanges.push({
            type: 'position',
            id: childId,
            position: { x: childStart.x + totalDx, y: childStart.y + totalDy },
            dragging: false,
          })
        })
        if (childChanges.length > 0) {
          const combined = [...changes, ...childChanges]
          pendingNodeChangesRef.current = combined
          if (nodesChangeRafRef.current == null) {
            nodesChangeRafRef.current = requestAnimationFrame(() => {
              nodesChangeRafRef.current = null
              const pending = pendingNodeChangesRef.current
              pendingNodeChangesRef.current = null
              if (!pending) return
              setNodes(prev => applyNodeChanges(pending, prev))
            })
          }
          return
        }
      }
    }
    pendingNodeChangesRef.current = changes
    if (nodesChangeRafRef.current == null) {
      nodesChangeRafRef.current = requestAnimationFrame(() => {
        nodesChangeRafRef.current = null
        const pending = pendingNodeChangesRef.current
        pendingNodeChangesRef.current = null
        if (!pending) return
        setNodes(prev => applyNodeChanges(pending, prev))
      })
    }
  }, [setNodes])

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      isDraggingRef.current = false
      lastDragEndTimeRef.current = Date.now()
      suppressNextLayoutRef.current = true
      setIsDragging(false)
      // 드래그 타겟 하이라이트 해제
      dragOverGroupIdRef.current = null
      setNodes(prev => prev.map(n =>
        n.type === 'groupArea' && (n.data as { isDragTarget?: boolean }).isDragTarget
          ? { ...n, data: { ...n.data, isDragTarget: false } }
          : n
      ))
      if (nodesChangeRafRef.current != null) {
        cancelAnimationFrame(nodesChangeRafRef.current)
        nodesChangeRafRef.current = null
      }
      pendingNodeChangesRef.current = null

      // 최종 자식 위치를 childMovedRef에 반영 (저장 전 필요)
      if (dragStartPosRef.current && childStartPosRef.current.size > 0) {
        const finalDx = node.position.x - dragStartPosRef.current.x
        const finalDy = node.position.y - dragStartPosRef.current.y
        childStartPosRef.current.forEach((childStart, childId) => {
          childMovedRef.current.set(childId, {
            x: childStart.x + finalDx,
            y: childStart.y + finalDy,
          })
        })
      }

      dragStartPosRef.current = null
      dragChildIdsRef.current = new Set()
      childStartPosRef.current = new Map()

      const save = (id: string, position: { x: number; y: number }, extra?: Record<string, unknown>) => {
        qc.setQueryData<ArchitectureNode[]>(['nodes', versionId], prev =>
          prev?.map(n => n.id === id ? { ...n, position, ...extra } : n) ?? [],
        )
        updateNode.mutate({
          ...(extra ?? {}),
          id,
          position,
        } as Parameters<typeof updateNode.mutate>[0])
      }

      // For regular archNodes: detect group assignment/removal on drop
      const allNodes = rawNodesRef.current
      const groupNodes = allNodes.filter(n => n.type === 'group')

      // Group area: only save its own position (children move via parentId automatically).
      // If the group had a non-group parent_id (its DB position was relative), clear it
      // now so future renders treat the saved position as absolute (no offset applied).
      if (node.type === 'groupArea') {
        const dbParentId = (allNodes.find(n => n.id === node.id))?.parent_id ?? null
        const hasNonGroupParent = dbParentId && !groupNodes.some(g => g.id === dbParentId)
        if (hasNonGroupParent) {
          save(node.id, node.position, { parent_id: null })
        } else {
          save(node.id, node.position)
        }
        childMovedRef.current = new Map()
        return
      }

      // Current global position of dragged node
      // If node has parentId (was in a group), its position is relative → compute global
      const parentRF = node.parentId ? getNode(node.parentId) : null
      const globalPos = parentRF
        ? { x: parentRF.position.x + node.position.x, y: parentRF.position.y + node.position.y }
        : node.position

      // Find which group area (if any) contains the node's center
      const cx = globalPos.x + NODE_W / 2
      const cy = globalPos.y + 60

      // IMPORTANT: use the *current* ReactFlow positions for group areas.
      // Using server/cached raw positions can be stale right after moving a group,
      // which makes drop detection fail (especially noticeable after pan/zoom).
      const targetGroup = groupNodes.find(g => {
        const groupRF = getNode(g.id)
        const gx = groupRF?.position.x ?? g.position.x
        const gy = groupRF?.position.y ?? g.position.y
        const gw = (g.metadata_?.width as number) ?? 500
        const gh = (g.metadata_?.height as number) ?? 380
        return cx > gx && cx < gx + gw && cy > gy && cy < gy + gh
      })

      // Prefer current RF parentId to avoid stale cache after recent moves.
      const prevGroupId = node.parentId ?? (rawNodesRef.current.find(n => n.id === node.id))?.parent_id ?? null
      const nextGroupId = targetGroup?.id ?? null

      // True only when prevGroupId is a visual group area (not a semantic non-group parent)
      const prevIsGroupArea = prevGroupId ? groupNodes.some(g => g.id === prevGroupId) : false

      if (nextGroupId !== prevGroupId) {
        if (nextGroupId) {
          // Assign to (new) group: convert global pos to relative
          const groupRF = getNode(nextGroupId)
          const gPos = groupRF?.position ?? (targetGroup!.position as { x: number; y: number })
          const relPos = { x: globalPos.x - gPos.x, y: globalPos.y - gPos.y }
          save(node.id, relPos, { parent_id: nextGroupId })
          // RF 상태 즉시 업데이트 — suppressNextLayout이 풀릴 때까지의 스냅백 방지
          setNodes(prev => prev.map(n =>
            n.id === node.id ? { ...n, parentId: nextGroupId, position: relPos } : n
          ))
        } else if (!prevIsGroupArea) {
          // Non-group semantic parent: just save absolute position, preserve parent_id
          save(node.id, node.position)
          childMovedRef.current.forEach((pos, id) => save(id, pos))
        } else {
          // Remove from group: use computed global pos
          save(node.id, globalPos, { parent_id: null })
          setNodes(prev => prev.map(n =>
            n.id === node.id ? { ...n, parentId: undefined, position: globalPos } : n
          ))
        }
        // IMPORTANT: do not refetch immediately here.
        // We already updated the cache optimistically via setQueryData in save().
        // Immediate refetch can return stale server data and "snap back" the node.
      } else if (nextGroupId) {
        // Still in same group: save relative position
        const groupRF = getNode(nextGroupId)
        const gPos = groupRF?.position ?? targetGroup!.position
        const relPos = { x: globalPos.x - gPos.x, y: globalPos.y - gPos.y }
        save(node.id, relPos)
      } else {
        save(node.id, node.position)
        childMovedRef.current.forEach((pos, id) => save(id, pos))
      }

      if (nextGroupId) {
        const patch = applyGroupFitOptimistic(qc, versionId, nextGroupId)
        // setQueryData already updated the cache; skip invalidation to avoid snap-back refetch
        if (patch) updateNode.mutate({ id: patch.id, metadata_: patch.metadata_, _noInvalidate: true })
      }

      childMovedRef.current = new Map()
    },
    [qc, versionId, updateNode, getNode],
  )

  // ── 클릭 핸들러 ────────────────────────────────────────────
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id)
      setActiveDocument(null)
      const ancestorIds = getAncestorIds(rawEdgesRef.current, node.id)
      setNodes(prev =>
        prev.map(n => ({
          ...n,
          data: { ...n.data, isAncestorHighlighted: ancestorIds.has(n.id) },
        })),
      )
    },
    [setSelectedNode, setActiveDocument, setNodes],
  )

  const onMiniMapNodeClick = useCallback(
    (_: React.MouseEvent, miniNode: Node) => {
      const rfNode = getNode(miniNode.id)
      if (!rfNode) return
      const w = (rfNode.measured?.width ?? 210)
      const h = (rfNode.measured?.height ?? 110)
      // For group children, position is relative to parent — compute absolute position
      const parentNode = rfNode.parentId ? getNode(rfNode.parentId) : null
      const absX = parentNode ? parentNode.position.x + rfNode.position.x : rfNode.position.x
      const absY = parentNode ? parentNode.position.y + rfNode.position.y : rfNode.position.y
      setCenter(absX + w / 2, absY + h / 2, { duration: 400, zoom: 1.4 })
      setSelectedNode(miniNode.id)
    },
    [getNode, setCenter, setSelectedNode],
  )

  useEffect(() => {
    if (!pendingFocusNodeId) return
    const rfNode = getNode(pendingFocusNodeId)
    if (!rfNode) {
      // Node not yet rendered — retry after a short delay
      const t = setTimeout(() => {
        const node = getNode(pendingFocusNodeId)
        if (node) {
          const w = node.measured?.width ?? 210
          const h = node.measured?.height ?? 110
          const parentNode = node.parentId ? getNode(node.parentId) : null
          const absX = parentNode ? parentNode.position.x + node.position.x : node.position.x
          const absY = parentNode ? parentNode.position.y + node.position.y : node.position.y
          setCenter(absX + w / 2, absY + h / 2, { duration: 400, zoom: 1.4 })
        }
        setPendingFocusNode(null)
      }, 300)
      return () => clearTimeout(t)
    }
    const w = rfNode.measured?.width ?? 210
    const h = rfNode.measured?.height ?? 110
    const parentNode = rfNode.parentId ? getNode(rfNode.parentId) : null
    const absX = parentNode ? parentNode.position.x + rfNode.position.x : rfNode.position.x
    const absY = parentNode ? parentNode.position.y + rfNode.position.y : rfNode.position.y
    setCenter(absX + w / 2, absY + h / 2, { duration: 400, zoom: 1.4 })
    setPendingFocusNode(null)
  }, [pendingFocusNodeId, getNode, setCenter, setPendingFocusNode])

  const miniMapNodeColor = useCallback((rfNode: Node) => {
    const archNode = (rfNode.data as { node: ArchitectureNode }).node
    if (rfNode.type === 'groupArea') return 'rgba(148,163,184,0.45)'
    return getNodeTypeColor(archNode?.type ?? '') ?? '#374151'
  }, [])

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RFEdge) => {
      setSelectedEdge(edge.id)
      setNodes(prev =>
        prev.some(n => n.data.isAncestorHighlighted)
          ? prev.map(n => n.data.isAncestorHighlighted ? { ...n, data: { ...n.data, isAncestorHighlighted: false } } : n)
          : prev,
      )
    },
    [setSelectedEdge, setNodes],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
    setNodes(prev =>
      prev.some(n => n.data.isAncestorHighlighted)
        ? prev.map(n => n.data.isAncestorHighlighted ? { ...n, data: { ...n.data, isAncestorHighlighted: false } } : n)
        : prev,
    )
  }, [setSelectedNode, setSelectedEdge, setNodes])

  // ── 엣지 연결 — 타입 선택 모달 ────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      setSelectedRelationType('depends_on')
      setPendingConnection(connection)
    },
    [],
  )

  const handleConfirmEdge = useCallback(() => {
    if (!pendingConnection?.source || !pendingConnection?.target) return
    if (!expandedNodeIds.has(pendingConnection.source)) toggleExpand(pendingConnection.source)
    createEdge.mutate({
      source_id: pendingConnection.source,
      target_id: pendingConnection.target,
      relation_type: selectedRelationType,
    })
    setPendingConnection(null)
  }, [pendingConnection, selectedRelationType, createEdge, expandedNodeIds, toggleExpand])

  const onEdgesDelete = useCallback(
    (deletedEdges: RFEdge[]) => {
      deletedEdges.forEach(e => deleteEdge.mutate({ id: e.id }))
    },
    [deleteEdge],
  )


  const [searchOpen, setSearchOpen] = useState(false)
  const [onboardingAction, setOnboardingAction] = useState<'node' | 'area' | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isLoading = nodesLoading || edgesLoading

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const showEmptyHint = !!rawNodes && rawNodes.length === 0

  return (
    <>
      <ReactFlow
        className={isDragging ? 'rf-dragging' : undefined}
        style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 35%, #0c1929 0%, #030810 80%)' }}
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        minZoom={0.08}
        maxZoom={2}
        nodesConnectable
        nodesDraggable
        elementsSelectable
        selectNodesOnDrag={false}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'relation',
          style: { stroke: '#374151', strokeWidth: 1.5 },
          deletable: true,
        }}
      >
        <Background variant={BackgroundVariant.Cross} color="#162032" gap={32} size={0.85} />
        <Controls
          className="!bg-gray-900 !border-gray-700 !shadow-xl"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-gray-900 !border-gray-700 !rounded-xl [&>svg]:cursor-pointer"
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={0}
          nodeComponent={MiniMapNodeWithLabel}
          maskColor="rgba(0,0,0,0.55)"
          pannable
          zoomable
          onNodeClick={onMiniMapNodeClick}
          style={{ width: 200, height: 140 }}
        />
      </ReactFlow>
      {showEmptyHint && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div
            className="relative pointer-events-auto rounded-2xl p-8 max-w-md w-full mx-4 space-y-5"
            style={{
              background: 'rgba(13,17,23,0.92)',
              border: '1px solid #30363d',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* 헤더 */}
            <div className="text-center space-y-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <GitBranch size={22} className="text-white" />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#e6edf3' }}>캔버스가 비어 있어요</h2>
              <p className="text-xs leading-relaxed" style={{ color: '#8b949e' }}>
                아키텍처 노드를 추가해서 시스템 구조를 시각화하세요.
              </p>
            </div>

            {/* AI 프롬프트 예시 */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#161b22', border: '1px solid #21262d' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={12} style={{ color: '#a78bfa' }} />
                <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>Claude에게 요청하기</span>
              </div>
              <div className="space-y-1.5">
                {[
                  '"백엔드 API 서버 노드 추가해줘"',
                  '"Redis 캐시와 PostgreSQL DB 노드 만들고 API 서버에 연결해줘"',
                  '"프론트엔드→API→DB 흐름으로 아키텍처 설계해줘"',
                ].map((ex, i) => (
                  <div
                    key={i}
                    className="text-[11px] px-3 py-2 rounded-lg font-mono leading-relaxed"
                    style={{ background: '#0d1117', color: '#8b949e', border: '1px solid #21262d' }}
                  >
                    {ex}
                  </div>
                ))}
              </div>
            </div>

            {/* 직접 추가 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setOnboardingAction('node')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', color: '#60a5fa' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)' }}
              >
                <Plus size={13} />
                노드 추가
              </button>
              <button
                onClick={() => setOnboardingAction('area')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <RectangleHorizontal size={13} />
                영역 추가
              </button>
            </div>
          </div>
        </div>
      )}
      <DrillBreadcrumb />
      <MapToolbar
        versionId={versionId}
        onSearchOpen={() => setSearchOpen(true)}
        initialAction={onboardingAction}
        onInitialActionConsumed={() => setOnboardingAction(null)}
      />
      <NodeSearchBar
        nodes={rawNodes ?? []}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* 엣지 타입 선택 모달 */}
      <Modal
        open={!!pendingConnection}
        onClose={() => setPendingConnection(null)}
        title="관계 타입 선택"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">두 노드 사이의 관계를 선택하세요</p>
          <div className="grid grid-cols-2 gap-2">
            {relationTypes.map(rt => {
              const selected = selectedRelationType === rt.id
              return (
                <button
                  key={rt.id}
                  onClick={() => setSelectedRelationType(rt.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all"
                  style={{
                    borderColor: selected ? rt.color : '#374151',
                    backgroundColor: selected ? rt.color + '18' : 'transparent',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rt.color }}
                  />
                  <span className="text-xs text-gray-200">{rt.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setPendingConnection(null)}>취소</Button>
            <Button size="sm" onClick={handleConfirmEdge} disabled={createEdge.isPending}>
              연결
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface Props {
  versionId: string
}

export function MindmapCanvas({ versionId }: Props) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full relative" style={{ background: '#030810' }}>
        <FlowInner versionId={versionId} />
      </div>
    </ReactFlowProvider>
  )
}
