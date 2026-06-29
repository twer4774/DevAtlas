import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Shield, ChevronDown, ChevronUp, Edit2, Check, X, Link } from 'lucide-react'
import { usePolicies, useCreatePolicy, useUpdatePolicy, useDeletePolicy, useSetPolicyNodes } from '@/hooks/usePolicies'
import { useNodes } from '@/hooks/useNodes'
import { useVersions } from '@/hooks/useVersions'
import { useProject } from '@/hooks/useProjects'
import type { Policy } from '@/api/policies'

const SEVERITY_META = {
  critical: { label: 'Critical', color: '#ef4444', bg: '#ef444415', border: '#ef444430' },
  major:    { label: 'Major',    color: '#f97316', bg: '#f9731615', border: '#f9731630' },
  minor:    { label: 'Minor',    color: '#eab308', bg: '#eab30815', border: '#eab30830' },
} as const

function SeverityBadge({ severity }: { severity: Policy['severity'] }) {
  const m = SEVERITY_META[severity]
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  )
}

function NodeLinkModal({
  policy,
  versionNodes,
  onClose,
  onSave,
}: {
  policy: Policy
  versionNodes: { id: string; title: string; type: string }[]
  onClose: () => void
  onSave: (nodeIds: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(policy.node_ids))
  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-xl p-5 max-h-[80vh] flex flex-col" style={{ background: '#0d1117', border: '1px solid #30363d' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">노드 연결 — {policy.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {versionNodes.length === 0 && <p className="text-xs text-gray-500">노드가 없습니다.</p>}
          {versionNodes.map(n => (
            <button
              key={n.id}
              onClick={() => toggle(n.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
              style={{ background: selected.has(n.id) ? '#1d4ed820' : '#161b22', border: `1px solid ${selected.has(n.id) ? '#3b82f640' : '#21262d'}` }}
            >
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${selected.has(n.id) ? 'bg-blue-600' : ''}`} style={{ border: `1px solid ${selected.has(n.id) ? '#3b82f6' : '#30363d'}` }}>
                {selected.has(n.id) && <Check size={9} className="text-white" />}
              </div>
              <span className="text-xs font-medium text-white truncate">{n.title}</span>
              <span className="text-[10px] text-gray-500 ml-auto">{n.type}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">취소</button>
          <button
            onClick={() => { onSave(Array.from(selected)); onClose() }}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
            style={{ background: '#1d4ed8' }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

function PolicyCard({
  policy,
  versionNodes,
  projectId,
}: {
  policy: Policy
  versionNodes: { id: string; title: string; type: string }[]
  projectId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(policy.title)
  const [editDesc, setEditDesc] = useState(policy.description ?? '')
  const [editSeverity, setEditSeverity] = useState(policy.severity)
  const [linkOpen, setLinkOpen] = useState(false)
  const updatePolicy = useUpdatePolicy(projectId)
  const deletePolicy = useDeletePolicy(projectId)
  const setNodes = useSetPolicyNodes(projectId)

  const linkedNodes = versionNodes.filter(n => policy.node_ids.includes(n.id))

  const handleSaveEdit = () => {
    updatePolicy.mutate({ id: policy.id, title: editTitle, description: editDesc, severity: editSeverity })
    setEditing(false)
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ background: '#0d1117', border: `1px solid ${policy.status === 'deprecated' ? '#21262d' : SEVERITY_META[policy.severity].border}` }}>
        <div className="px-4 py-3 flex items-start gap-3">
          <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: policy.status === 'deprecated' ? '#4b5563' : SEVERITY_META[policy.severity].color }} />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="설명 (선택)"
                />
                <div className="flex items-center gap-2">
                  <select
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    value={editSeverity}
                    onChange={e => setEditSeverity(e.target.value as Policy['severity'])}
                  >
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                  <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:text-green-300"><Check size={13} /></button>
                  <button onClick={() => setEditing(false)} className="p-1 text-gray-500 hover:text-gray-300"><X size={13} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${policy.status === 'deprecated' ? 'text-gray-500 line-through' : 'text-white'}`}>{policy.title}</p>
                  <SeverityBadge severity={policy.severity} />
                  {policy.status === 'deprecated' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-gray-500" style={{ background: '#21262d' }}>deprecated</span>
                  )}
                </div>
                {policy.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{policy.description}</p>}
              </>
            )}
          </div>
          {!editing && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setLinkOpen(true)} className="p-1 text-gray-600 hover:text-blue-400 transition-colors" title="노드 연결">
                <Link size={12} />
              </button>
              <button onClick={() => setEditing(true)} className="p-1 text-gray-600 hover:text-gray-300 transition-colors">
                <Edit2 size={12} />
              </button>
              {policy.status === 'active' ? (
                <button onClick={() => updatePolicy.mutate({ id: policy.id, status: 'deprecated' })} className="p-1 text-gray-600 hover:text-yellow-400 transition-colors" title="deprecated 처리">
                  <Shield size={12} />
                </button>
              ) : (
                <button onClick={() => updatePolicy.mutate({ id: policy.id, status: 'active' })} className="p-1 text-gray-600 hover:text-green-400 transition-colors" title="복원">
                  <Check size={12} />
                </button>
              )}
              <button onClick={() => deletePolicy.mutate(policy.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
              {linkedNodes.length > 0 && (
                <button onClick={() => setExpanded(v => !v)} className="p-1 text-gray-600 hover:text-gray-300 transition-colors">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 연결된 노드 */}
        {!editing && linkedNodes.length > 0 && (
          <div className="px-4 pb-3">
            <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2">
              <Link size={10} /> {linkedNodes.length}개 노드에 적용됨 {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {expanded && (
              <div className="flex flex-wrap gap-1.5">
                {linkedNodes.map(n => (
                  <span key={n.id} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: '#161b22', border: '1px solid #30363d', color: '#79c0ff' }}>
                    {n.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {linkOpen && (
        <NodeLinkModal
          policy={policy}
          versionNodes={versionNodes}
          onClose={() => setLinkOpen(false)}
          onSave={nodeIds => setNodes.mutate({ id: policy.id, nodeIds })}
        />
      )}
    </>
  )
}

export function PoliciesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project } = useProject(projectId ?? null)
  const { data: policies = [] } = usePolicies(projectId ?? null)
  const { data: versions = [] } = useVersions(projectId ?? null)
  const latestVersionId = versions[0]?.id ?? null
  const { data: nodes = [] } = useNodes(latestVersionId)
  const createPolicy = useCreatePolicy(projectId!)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSeverity, setNewSeverity] = useState<'critical' | 'major' | 'minor'>('major')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'deprecated'>('active')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    await createPolicy.mutateAsync({ title: newTitle, description: newDesc || undefined, severity: newSeverity })
    setNewTitle('')
    setNewDesc('')
    setNewSeverity('major')
    setShowForm(false)
  }

  const filtered = policies.filter(p => filter === 'all' ? true : p.status === filter)
  const counts = { active: policies.filter(p => p.status === 'active').length, deprecated: policies.filter(p => p.status === 'deprecated').length }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-xs text-gray-500">{project?.name}</p>
          <h1 className="text-sm font-semibold text-white">Policies</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(['active', 'deprecated', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 text-xs rounded-md font-medium transition-colors"
              style={filter === f ? { background: '#1d4ed8', color: 'white' } : { background: '#161b22', color: '#8b949e', border: '1px solid #21262d' }}
            >
              {f === 'all' ? `전체 ${policies.length}` : f === 'active' ? `활성 ${counts.active}` : `deprecated ${counts.deprecated}`}
            </button>
          ))}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
            style={{ background: '#1d4ed8' }}
          >
            <Plus size={12} /> 새 Policy
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {showForm && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#0d1117', border: '1px solid #3b82f640' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">새 Policy</p>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="Policy 제목 (예: 모든 외부 API는 인증 필수)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 resize-none"
              rows={2}
              placeholder="상세 설명 (선택)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <select
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
                value={newSeverity}
                onChange={e => setNewSeverity(e.target.value as typeof newSeverity)}
              >
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
              <button onClick={handleCreate} disabled={!newTitle.trim()} className="px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: '#1d4ed8' }}>
                추가
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">취소</button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{filter === 'deprecated' ? 'deprecated된 Policy가 없습니다.' : '아직 Policy가 없습니다.'}</p>
          </div>
        )}

        {filtered.map(policy => (
          <PolicyCard key={policy.id} policy={policy} versionNodes={nodes.map(n => ({ id: n.id, title: n.title, type: n.type }))} projectId={projectId!} />
        ))}
      </main>
    </div>
  )
}
