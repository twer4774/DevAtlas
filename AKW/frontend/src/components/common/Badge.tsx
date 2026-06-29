import { cn } from '@/lib/cn'
import {
  DOC_TYPE_LABELS, NODE_TYPE_COLORS, NODE_TYPE_LABELS,
  type DocType, type NodeType,
} from '@/lib/constants'

interface BadgeProps {
  label: string
  color?: string
  className?: string
}

export function Badge({ label, color, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', className)}
      style={color ? { backgroundColor: color + '22', color } : undefined}
    >
      {label}
    </span>
  )
}

export function NodeTypeBadge({ type }: { type: string }) {
  const color = NODE_TYPE_COLORS[type as NodeType] ?? '#6b7280'
  const label = NODE_TYPE_LABELS[type as NodeType] ?? type
  return <Badge label={label} color={color} />
}

export function DocTypeBadge({ type }: { type: string }) {
  const label = DOC_TYPE_LABELS[type as DocType] ?? type
  return <Badge label={label} className="bg-gray-700 text-gray-300" />
}
