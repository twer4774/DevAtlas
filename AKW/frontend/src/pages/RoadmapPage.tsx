import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { useRoadmap, useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem } from '@/hooks/useRoadmap'
import { useProject } from '@/hooks/useProjects'
import { useVersions } from '@/hooks/useVersions'
import type { RoadmapItem } from '@/api/roadmap'

// ── Column definitions ────────────────────────────────────────────────────────

export interface Column { id: string; label: string; color: string }

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo',        label: '시작 전', color: '#6e7681' },
  { id: 'in_progress', label: '진행중',  color: '#d29922' },
  { id: 'pending',     label: '펜딩',    color: '#8b5cf6' },
  { id: 'done',        label: '완료',    color: '#3fb950' },
  { id: 'deprecated',  label: '폐기',    color: '#f85149' },
]

const COLUMN_COLORS = ['#6e7681','#d29922','#8b5cf6','#3fb950','#f85149','#58a6ff','#fb923c','#e879f9']

function loadColumns(projectId: string): Column[] {
  try {
    const raw = localStorage.getItem(`roadmap-cols-${projectId}`)
    if (raw) return JSON.parse(raw) as Column[]
  } catch { /* ignore */ }
  return DEFAULT_COLUMNS
}

function saveColumns(projectId: string, cols: Column[]) {
  localStorage.setItem(`roadmap-cols-${projectId}`, JSON.stringify(cols))
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRI = {
  p1: { label: 'P1', sublabel: '긴급', color: '#f85149' },
  p2: { label: 'P2', sublabel: '높음', color: '#d29922' },
  p3: { label: 'P3', sublabel: '보통', color: '#58a6ff' },
  p4: { label: 'P4', sublabel: '낮음', color: '#6e7681' },
} as const

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  'AKW':      { color: '#bc8cff', bg: '#2a1f3d' },
  'GitTrack': { color: '#3fb950', bg: '#122119' },
  'Portal':   { color: '#ffa657', bg: '#2d1c00' },
  '공통':     { color: '#8b949e', bg: '#21262d' },
}
function catStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { color: '#58a6ff', bg: '#1158c720' }
}

// ── Form ──────────────────────────────────────────────────────────────────────

interface FormState {
  priority: string; category: string; title: string
  description: string; size: string; status: string; version_id: string
}

function ItemForm({ initial, columns, versions, onSave, onCancel }: {
  initial: Partial<FormState>
  columns: Column[]
  versions: { id: string; name: string }[]
  onSave: (data: FormState) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>({
    priority: initial.priority ?? 'p3',
    category: initial.category ?? '공통',
    title: initial.title ?? '',
    description: initial.description ?? '',
    size: initial.size ?? 'M',
    status: initial.status ?? columns[0]?.id ?? 'todo',
    version_id: initial.version_id ?? '',
  })
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }))

  const inp = "w-full rounded-md px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
  const sty = { background: '#0d1117', border: '1px solid #30363d' }

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: '#161b22', border: '1px solid #30363d' }}>
      <input value={f.title} onChange={set('title')} placeholder="제목 *" autoFocus className={inp} style={sty} />
      <textarea value={f.description} onChange={set('description')} placeholder="설명 (선택)" rows={2}
        className={inp} style={{ ...sty, resize: 'vertical' }} />
      <div className="flex gap-2 flex-wrap">
        <select value={f.priority} onChange={set('priority')} className={inp} style={{ ...sty, flex: 1, minWidth: 90 }}>
          {Object.entries(PRI).map(([k, v]) => <option key={k} value={k}>{v.label} · {v.sublabel}</option>)}
        </select>
        <input value={f.category} onChange={set('category')} placeholder="카테고리" list="cat-list"
          className={inp} style={{ ...sty, flex: 1, minWidth: 80 }} />
        <datalist id="cat-list">
          {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c} />)}
        </datalist>
        <select value={f.size} onChange={set('size')} className={inp} style={{ ...sty, width: 56 }}>
          {['XS','S','M','L','XL'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <select value={f.status} onChange={set('status')} className={inp} style={{ ...sty, flex: 1 }}>
          {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {versions.length > 0 && (
          <select value={f.version_id} onChange={set('version_id')} className={inp} style={{ ...sty, flex: 1 }}>
            <option value="">버전 없음</option>
            {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => f.title.trim() && onSave(f)}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium"
          style={{ background: '#238636', color: '#fff' }}>
          <Check size={11} /> 저장
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-xs"
          style={{ background: '#21262d', color: '#8b949e' }}>
          <X size={11} /> 취소
        </button>
      </div>
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ item, colIndex, columns, onEdit, onDelete, onMove }: {
  item: RoadmapItem
  colIndex: number
  columns: Column[]
  onEdit: (item: RoadmapItem) => void
  onDelete: (id: string) => void
  onMove: (id: string, status: string) => void
}) {
  const pri = PRI[item.priority as keyof typeof PRI]
  const cs = catStyle(item.category)

  return (
    <div className="group rounded-xl p-3 space-y-2"
      style={{ background: '#161b22', border: '1px solid #21262d' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#30363d')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#21262d')}>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold font-mono" style={{ color: pri.color }}>{pri.label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ color: cs.color, background: cs.bg }}>
          {item.category}
        </span>
        <span className="text-[9px] ml-auto font-mono" style={{ color: '#484f58' }}>{item.size}</span>
      </div>

      <p className="text-[12px] leading-snug" style={{ color: '#e6edf3' }}>{item.title}</p>

      {item.description && (
        <p className="text-[11px] leading-relaxed" style={{ color: '#6e7681' }}>{item.description}</p>
      )}

      <div className="flex items-center gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {colIndex > 0 && (
          <button onClick={() => onMove(item.id, columns[colIndex - 1].id)}
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded hover:text-white"
            style={{ color: '#484f58', background: '#21262d' }}>
            <ChevronLeft size={10} />{columns[colIndex - 1].label}
          </button>
        )}
        {colIndex < columns.length - 1 && (
          <button onClick={() => onMove(item.id, columns[colIndex + 1].id)}
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded hover:text-white"
            style={{ color: '#484f58', background: '#21262d' }}>
            {columns[colIndex + 1].label}<ChevronRight size={10} />
          </button>
        )}
        <div className="flex-1" />
        <button onClick={() => onEdit(item)} className="p-1 rounded hover:text-blue-400 transition-colors" style={{ color: '#484f58' }}>
          <Edit2 size={11} />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:text-red-400 transition-colors" style={{ color: '#484f58' }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Add Column Form ───────────────────────────────────────────────────────────

function AddColumnForm({ usedColors, onAdd, onCancel }: {
  usedColors: string[]
  onAdd: (col: Column) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const nextColor = COLUMN_COLORS.find(c => !usedColors.includes(c)) ?? COLUMN_COLORS[0]
  const [color, setColor] = useState(nextColor)

  const handleAdd = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onAdd({ id: trimmed.toLowerCase().replace(/\s+/g, '_'), label: trimmed, color })
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d', width: 200 }}>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="컬럼 이름" autoFocus
        className="w-full rounded-md px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
        style={{ background: '#0d1117', border: '1px solid #30363d' }}
        onKeyDown={e => e.key === 'Enter' && handleAdd()} />
      <div className="flex gap-1.5 flex-wrap">
        {COLUMN_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{ background: '#238636', color: '#fff' }}>
          <Check size={10} /> 추가
        </button>
        <button onClick={onCancel} className="text-xs px-2 py-1 rounded-md" style={{ color: '#8b949e', background: '#21262d' }}>
          취소
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project } = useProject(projectId ?? null)
  const { data: versions = [] } = useVersions(projectId ?? null)

  const [columns, setColumns] = useState<Column[]>(() => loadColumns(projectId ?? ''))
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [addingColumn, setAddingColumn] = useState(false)

  useEffect(() => {
    if (projectId) setColumns(loadColumns(projectId))
  }, [projectId])

  const updateColumns = (cols: Column[]) => {
    setColumns(cols)
    if (projectId) saveColumns(projectId, cols)
  }

  const versionId = selectedVersion || null
  const { data: items = [], isLoading } = useRoadmap(projectId ?? null, versionId)

  const createItem = useCreateRoadmapItem(projectId!)
  const updateItem = useUpdateRoadmapItem(projectId!)
  const deleteItem = useDeleteRoadmapItem(projectId!)

  const [adding, setAdding] = useState<string | null>(null)
  const [editing, setEditing] = useState<RoadmapItem | null>(null)

  const handleSave = async (data: FormState) => {
    const payload = { ...data, version_id: data.version_id || null }
    if (editing) {
      await updateItem.mutateAsync({ id: editing.id, ...payload })
      setEditing(null)
    } else if (adding !== null) {
      await createItem.mutateAsync({ ...payload, status: adding } as any)
      setAdding(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await deleteItem.mutateAsync(id)
  }

  const handleMove = async (id: string, status: string) => {
    await updateItem.mutateAsync({ id, status })
  }

  const removeColumn = (colId: string) => {
    updateColumns(columns.filter(c => c.id !== colId))
  }

  const stats = { total: items.length, done: items.filter(i => i.status === 'done').length }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0d1117', color: '#e6edf3' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: '#21262d' }}>
        <button onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color: '#8b949e' }}>
          <ArrowLeft size={14} />{project?.name ?? '프로젝트'}
        </button>
        <span style={{ color: '#21262d' }}>/</span>
        <span className="text-sm font-semibold">로드맵</span>

        {/* 우선순위 범례 */}
        <div className="flex items-center gap-3 ml-2">
          {Object.values(PRI).map(p => (
            <span key={p.label} className="flex items-center gap-1 text-[10px] font-mono" style={{ color: p.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
              {p.label} {p.sublabel}
            </span>
          ))}
        </div>

        {/* 버전 필터 */}
        {versions.length > 0 && (
          <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}
            className="ml-4 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
            style={{ background: '#21262d', border: '1px solid #30363d' }}>
            <option value="">전체 버전</option>
            {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}

        <div className="ml-auto text-xs font-mono" style={{ color: '#484f58' }}>
          {stats.done}/{stats.total} 완료
        </div>
      </header>

      {/* Kanban */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderColor: '#bc8cff' }} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
          {columns.map((col, colIndex) => {
            const colItems = items.filter(i => i.status === col.id)
            return (
              <div key={col.id} className="flex-shrink-0 flex flex-col border-r overflow-hidden"
                style={{ borderColor: '#21262d', width: 280 }}>
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-3 border-b flex-shrink-0 group/col"
                  style={{ borderColor: '#21262d' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#21262d', color: '#6e7681' }}>
                    {colItems.length}
                  </span>
                  <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button onClick={() => removeColumn(col.id)}
                      className="p-0.5 rounded hover:text-red-400 transition-colors" style={{ color: '#484f58' }}
                      title="컬럼 삭제">
                      <X size={11} />
                    </button>
                  </div>
                  <button onClick={() => { setAdding(col.id); setEditing(null) }}
                    className="p-1 rounded transition-colors hover:text-white hover:bg-gray-800"
                    style={{ color: '#484f58' }}>
                    <Plus size={13} />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {adding === col.id && (
                    <ItemForm
                      initial={{ status: col.id, version_id: selectedVersion }}
                      columns={columns}
                      versions={versions}
                      onSave={handleSave}
                      onCancel={() => setAdding(null)}
                    />
                  )}
                  {colItems.map(item =>
                    editing?.id === item.id ? (
                      <ItemForm key={item.id} initial={{ ...item, version_id: item.version_id ?? '' }}
                        columns={columns} versions={versions}
                        onSave={handleSave} onCancel={() => setEditing(null)} />
                    ) : (
                      <KanbanCard key={item.id} item={item} colIndex={colIndex} columns={columns}
                        onEdit={setEditing} onDelete={handleDelete} onMove={handleMove} />
                    )
                  )}
                  {colItems.length === 0 && adding !== col.id && (
                    <button onClick={() => { setAdding(col.id); setEditing(null) }}
                      className="w-full py-6 rounded-xl border border-dashed text-xs transition-colors"
                      style={{ borderColor: '#21262d', color: '#484f58' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.color = '#484f58' }}>
                      + 항목 추가
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* 컬럼 추가 */}
          <div className="flex-shrink-0 p-3" style={{ width: addingColumn ? 'auto' : 48 }}>
            {addingColumn ? (
              <AddColumnForm
                usedColors={columns.map(c => c.color)}
                onAdd={col => { updateColumns([...columns, col]); setAddingColumn(false) }}
                onCancel={() => setAddingColumn(false)}
              />
            ) : (
              <button onClick={() => setAddingColumn(true)}
                className="flex items-center justify-center w-full h-12 rounded-xl border border-dashed transition-colors text-xs gap-1"
                style={{ borderColor: '#21262d', color: '#484f58' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.color = '#484f58' }}>
                <Plus size={12} /> 컬럼
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
