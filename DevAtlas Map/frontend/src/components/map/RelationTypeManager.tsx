import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useRelationTypeStore, type RelationType } from '@/store/relationTypeStore'
import { cn } from '@/lib/cn'

const PRESET_COLORS = [
  '#6b7280', '#ef4444', '#f97316', '#f59e0b',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#a855f7',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-all"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#fff' : 'transparent',
            boxShadow: value === c ? `0 0 0 1px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function EditRow({
  type,
  onDone,
}: {
  type: RelationType
  onDone: () => void
}) {
  const { updateType } = useRelationTypeStore()
  const [label, setLabel] = useState(type.label)
  const [color, setColor] = useState(type.color)

  const save = () => {
    if (!label.trim()) return
    updateType(type.id, { label: label.trim(), color })
    onDone()
  }

  return (
    <div className="space-y-2 p-2 bg-gray-800/60 rounded-lg">
      <input
        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
        autoFocus
        placeholder="관계 이름"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-1.5">
        <button onClick={onDone} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
        <button onClick={save} className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
          <Check size={14} />
        </button>
      </div>
    </div>
  )
}

function AddRow({ onDone }: { onDone: () => void }) {
  const { addType } = useRelationTypeStore()
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#6b7280')

  const save = () => {
    if (!label.trim()) return
    addType(label.trim(), color)
    onDone()
  }

  return (
    <div className="space-y-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
      <input
        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
        autoFocus
        placeholder="새 관계 이름 (예: 호출)"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-1.5">
        <button onClick={onDone} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
        <button
          onClick={save}
          disabled={!label.trim()}
          className={cn('p-1 transition-colors', label.trim() ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed')}
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  )
}

export function RelationTypeManager() {
  const { types, deleteType } = useRelationTypeStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-1.5">
      {types.map(t => (
        editingId === t.id ? (
          <EditRow key={t.id} type={t} onDone={() => setEditingId(null)} />
        ) : (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-gray-700/50 hover:bg-gray-800/30 group transition-all"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: t.color }}
            />
            <span className="text-sm text-gray-200 flex-1">{t.label}</span>
            {t.isBuiltIn && (
              <span className="text-[10px] text-gray-600 flex-shrink-0">기본</span>
            )}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingId(t.id)}
                className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
              >
                <Pencil size={12} />
              </button>
              {!t.isBuiltIn && (
                <button
                  onClick={() => deleteType(t.id)}
                  className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        )
      ))}

      {adding ? (
        <AddRow onDone={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-500 hover:text-blue-400 hover:bg-blue-500/5 rounded-lg border border-dashed border-gray-700 hover:border-blue-500/30 transition-all"
        >
          <Plus size={13} />
          새 관계 타입 추가
        </button>
      )}
    </div>
  )
}
