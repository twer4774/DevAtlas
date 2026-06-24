import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

export function RelationEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style,
  label,
  selected,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const active = selected || hovered
  const s = (style ?? {}) as React.CSSProperties
  const stroke = s.stroke as string | undefined
  const strokeDasharray = s.strokeDasharray as string | undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: active ? 2 : 1.5,
          strokeDasharray,
          opacity: active ? 1 : 0.4,
          transition: 'opacity 0.15s, stroke-width 0.15s',
          pointerEvents: 'none',
        }}
      />
      {/* Wider transparent hit area for hover detection — rendered on top */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      {active && label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: 10,
              fontWeight: 500,
              color: stroke ?? '#6b7280',
              background: 'rgba(17, 24, 39, 0.92)',
              border: `1px solid ${(stroke ?? '#6b7280') + '44'}`,
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
