import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react'
import type { Node, Edge, NodeProps } from '@xyflow/react'
import {
  ReactFlow,
  Background, Controls, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProject } from '@/hooks/useProjects'
import { useVersions } from '@/hooks/useVersions'
import { useNodes } from '@/hooks/useNodes'
import { useEdges } from '@/hooks/useEdges'
import { usePolicies } from '@/hooks/usePolicies'

// ── Node type → color mapping ─────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  backend:       { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  frontend:      { bg: '#1e3a5f', border: '#6366f1', text: '#a5b4fc' },
  database:      { bg: '#1a2e1a', border: '#22c55e', text: '#86efac' },
  storage:       { bg: '#1a2e1a', border: '#10b981', text: '#6ee7b7' },
  cache:         { bg: '#1a2e1a', border: '#14b8a6', text: '#5eead4' },
  api:           { bg: '#2a1f3d', border: '#8b5cf6', text: '#c4b5fd' },
  service:       { bg: '#1e3a5f', border: '#60a5fa', text: '#bfdbfe' },
  gateway:       { bg: '#2a1f3d', border: '#a78bfa', text: '#ddd6fe' },
  broker:        { bg: '#3b2a1a', border: '#f97316', text: '#fdba74' },
  queue:         { bg: '#3b2a1a', border: '#fb923c', text: '#fed7aa' },
  function:      { bg: '#1e3a5f', border: '#38bdf8', text: '#bae6fd' },
  worker:        { bg: '#1e3a5f', border: '#7dd3fc', text: '#e0f2fe' },
  Program:       { bg: '#1f2937', border: '#9ca3af', text: '#d1d5db' },
  Capability:    { bg: '#1a2535', border: '#64748b', text: '#94a3b8' },
  Feature:       { bg: '#1a2535', border: '#818cf8', text: '#c7d2fe' },
  Policy:        { bg: '#3b1a1a', border: '#ef4444', text: '#fca5a5' },
  External:      { bg: '#1f2937', border: '#6b7280', text: '#9ca3af' },
}
const DEFAULT_COLOR = { bg: '#1f2937', border: '#374151', text: '#9ca3af' }

function getColor(type: string) { return TYPE_COLORS[type] ?? DEFAULT_COLOR }

// ── Concentric layout ─────────────────────────────────────────────────────

function computeLayout(
  rawNodes: { id: string; title: string; type: string }[],
  rawEdges: { id: string; source_id: string; target_id: string; relation_type: string }[],
): { nodes: Node[]; edges: Edge[] } {
  // Group by type
  const byType = new Map<string, typeof rawNodes>()
  for (const n of rawNodes) {
    const arr = byType.get(n.type) ?? []
    arr.push(n)
    byType.set(n.type, arr)
  }

  // Sort types by connectivity (highly connected types closer to center)
  const connectivity = new Map<string, number>()
  for (const n of rawNodes) {
    const count = rawEdges.filter(e => e.source_id === n.id || e.target_id === n.id).length
    connectivity.set(n.type, (connectivity.get(n.type) ?? 0) + count)
  }
  const sortedTypes = Array.from(byType.keys()).sort((a, b) => (connectivity.get(b) ?? 0) - (connectivity.get(a) ?? 0))

  const NODE_W = 140
  const NODE_H = 40
  const positions = new Map<string, { x: number; y: number }>()

  const RING_GAP = 220
  const MIN_RING_R = 180

  sortedTypes.forEach((type, ringIdx) => {
    const group = byType.get(type)!
    const radius = MIN_RING_R + ringIdx * RING_GAP
    group.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
      positions.set(n.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    })
  })

  const RELATION_COLORS: Record<string, string> = {
    contains:   '#6b7280',
    realizes:   '#3b82f6',
    depends_on: '#f97316',
    triggers:   '#8b5cf6',
    applies_to: '#ef4444',
    references: '#22c55e',
  }

  return {
    nodes: rawNodes.map(n => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 }
      const c = getColor(n.type)
      return {
        id: n.id,
        position: pos,
        data: { label: n.title, type: n.type, color: c },
        type: 'akwNode',
        style: { width: NODE_W, height: NODE_H },
      }
    }),
    edges: rawEdges.map(e => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      label: e.relation_type,
      type: 'smoothstep',
      style: { stroke: RELATION_COLORS[e.relation_type] ?? '#4b5563', strokeWidth: 1.5 },
      labelStyle: { fill: '#6b7280', fontSize: 9 },
      labelBgStyle: { fill: '#0d1117', fillOpacity: 0.8 },
    })),
  }
}

// ── Custom node ───────────────────────────────────────────────────────────

function AkwNode({ data, selected }: NodeProps) {
  const d = data as { label: string; type: string; color: { bg: string; border: string; text: string }; hasPolicies?: boolean }
  return (
    <div
      className="rounded-lg px-2.5 py-1.5 text-center relative"
      style={{
        background: d.color.bg,
        border: `1.5px solid ${selected ? '#ffffff' : d.color.border}`,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? `0 0 0 2px ${d.color.border}44` : undefined,
      }}
    >
      {d.hasPolicies && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 border border-gray-900" title="Policy 적용됨" />
      )}
      <p className="text-[11px] font-medium leading-tight truncate w-full" style={{ color: d.color.text }}>{String(d.label)}</p>
      <p className="text-[9px] opacity-50 mt-0.5" style={{ color: d.color.text }}>{d.type}</p>
    </div>
  )
}

const nodeTypes = { akwNode: AkwNode }

// ── Legend ────────────────────────────────────────────────────────────────

function Legend({ activeTypes, allTypes, onToggle }: { activeTypes: Set<string>; allTypes: string[]; onToggle: (t: string) => void }) {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl p-3 space-y-1.5 max-h-64 overflow-y-auto" style={{ background: '#0d1117cc', border: '1px solid #21262d', backdropFilter: 'blur(8px)' }}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">노드 타입</p>
      {allTypes.map(type => {
        const c = getColor(type)
        const active = activeTypes.has(type)
        return (
          <button key={type} onClick={() => onToggle(type)} className="flex items-center gap-2 w-full text-left opacity-transition" style={{ opacity: active ? 1 : 0.35 }}>
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.border }} />
            <span className="text-[10px] text-gray-400">{type}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Inner component (needs ReactFlowProvider) ─────────────────────────────

function KnowledgeGraphInner({
  projectId,
  versionId,
}: {
  projectId: string
  versionId: string
}) {
  const { data: rawNodes = [] } = useNodes(versionId)
  const { data: rawEdges = [] } = useEdges(versionId)
  const { data: policies = [] } = usePolicies(projectId)
  const { fitView } = useReactFlow()

  const allTypes = useMemo(() => Array.from(new Set(rawNodes.map(n => n.type))), [rawNodes])
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => new Set(allTypes))

  // After rawNodes loads, sync activeTypes
  useMemo(() => { setActiveTypes(new Set(allTypes)) }, [allTypes.join(',')])  // eslint-disable-line

  const toggleType = useCallback((t: string) =>
    setActiveTypes(prev => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s }),
    [])

  // Nodes with policies get a red dot
  const policyNodeSet = useMemo(() => new Set(policies.flatMap(p => p.node_ids)), [policies])

  const filteredNodes = useMemo(() => rawNodes.filter(n => activeTypes.has(n.type)), [rawNodes, activeTypes])
  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes])
  const filteredEdges = useMemo(() =>
    rawEdges.filter(e => filteredNodeIds.has(e.source_id) && filteredNodeIds.has(e.target_id)),
    [rawEdges, filteredNodeIds])

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => computeLayout(filteredNodes, filteredEdges),
    [filteredNodes, filteredEdges],
  )

  // Inject hasPolicies flag
  const finalNodes = useMemo(() =>
    layoutNodes.map(n => ({
      ...n,
      data: { ...n.data, hasPolicies: policyNodeSet.has(n.id) },
    })),
    [layoutNodes, policyNodeSet])

  const [nodes, , onNodesChange] = useNodesState(finalNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges)

  // Sync when layout changes
  useMemo(() => {
    // React Flow doesn't expose setNodes outside hooks easily; trigger via key remount instead
  }, [finalNodes])  // eslint-disable-line

  return (
    <>
      <ReactFlow
        key={versionId + activeTypes.size}
        nodes={finalNodes}
        edges={layoutEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable
        colorMode="dark"
      >
        <Background color="#21262d" gap={20} />
        <Controls position="top-right" />
        <MiniMap
          position="bottom-right"
          nodeColor={n => getColor((n.data as { type: string }).type).border}
          style={{ background: '#0d1117', border: '1px solid #21262d' }}
        />
      </ReactFlow>
      <Legend activeTypes={activeTypes} allTypes={allTypes} onToggle={toggleType} />
      <button onClick={() => fitView({ padding: 0.15, duration: 400 })} className="absolute top-4 right-16 z-10 p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors" style={{ background: '#0d1117', border: '1px solid #21262d' }} title="전체 보기">
        <Maximize2 size={13} />
      </button>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function KnowledgeGraphPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project } = useProject(projectId ?? null)
  const { data: versions = [] } = useVersions(projectId ?? null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

  const versionId = selectedVersionId ?? versions[0]?.id ?? null

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-gray-900 flex-shrink-0 z-20">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-xs text-gray-500">{project?.name}</p>
          <h1 className="text-sm font-semibold text-white">Knowledge Graph</h1>
        </div>

        {versions.length > 1 && (
          <div className="flex items-center gap-1.5 ml-4">
            <Filter size={12} className="text-gray-500" />
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white"
              value={versionId ?? ''}
              onChange={e => setSelectedVersionId(e.target.value)}
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Policy 적용 노드</span>
        </div>
      </header>

      <div className="flex-1 relative">
        {versionId ? (
          <ReactFlowProvider>
            <KnowledgeGraphInner projectId={projectId!} versionId={versionId} />
          </ReactFlowProvider>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p className="text-sm">버전이 없습니다. 먼저 버전을 만들어주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
