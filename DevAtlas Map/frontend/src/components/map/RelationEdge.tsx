import { useState, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'

// Computes a bezier path with control points shifted perpendicular to the
// source→target direction. Endpoints stay at the handles; only the curve
// bends to one side, making bidirectional edge pairs visually distinct.
function getOffsetBezierPath(
  sx: number, sy: number, sp: string,
  tx: number, ty: number, tp: string,
  lateralOffset: number,
): [path: string, midX: number, midY: number] {
  const curvature = 0.25
  const distX = Math.abs(tx - sx)
  const distY = Math.abs(ty - sy)

  let cp1x = sx, cp1y = sy
  if (sp === 'right') cp1x += distX * curvature
  else if (sp === 'left') cp1x -= distX * curvature
  else if (sp === 'bottom') cp1y += distY * curvature
  else if (sp === 'top') cp1y -= distY * curvature

  let cp2x = tx, cp2y = ty
  if (tp === 'left') cp2x -= distX * curvature
  else if (tp === 'right') cp2x += distX * curvature
  else if (tp === 'top') cp2y -= distY * curvature
  else if (tp === 'bottom') cp2y += distY * curvature

  const dx = tx - sx, dy = ty - sy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ox = (-dy / len) * lateralOffset
  const oy = (dx / len) * lateralOffset

  const path = `M ${sx},${sy} C ${cp1x + ox},${cp1y + oy} ${cp2x + ox},${cp2y + oy} ${tx},${ty}`

  // Cubic bezier midpoint at t=0.5
  const midX = 0.125 * sx + 0.375 * (cp1x + ox) + 0.375 * (cp2x + ox) + 0.125 * tx
  const midY = 0.125 * sy + 0.375 * (cp1y + oy) + 0.375 * (cp2y + oy) + 0.125 * ty

  return [path, midX, midY]
}

export function RelationEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style,
  label,
  selected,
  markerEnd,
  data,
}: EdgeProps) {
  const { screenToFlowPosition } = useReactFlow()
  const [hovered, setHovered] = useState(false)
  const [mouseFlowPos, setMouseFlowPos] = useState<{ x: number; y: number } | null>(null)

  const parallelOffset = (data as Record<string, unknown> | undefined)?.parallelOffset as number | undefined

  const [edgePath, midX, midY] = parallelOffset != null
    ? getOffsetBezierPath(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, parallelOffset)
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  const active = selected || hovered
  const s = (style ?? {}) as React.CSSProperties
  const stroke = s.stroke as string | undefined
  const strokeDasharray = s.strokeDasharray as string | undefined

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setHovered(true)
    setMouseFlowPos(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }, [screenToFlowPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouseFlowPos(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }, [screenToFlowPosition])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setMouseFlowPos(null)
  }, [])

  const labelX = mouseFlowPos?.x ?? midX
  const labelY = mouseFlowPos?.y ?? midY

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
      {/* Wider transparent hit area — on top so it receives mouse events */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />
      {active && label && (mouseFlowPos || selected) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, calc(-100% - 10px)) translate(${labelX}px, ${labelY}px)`,
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
