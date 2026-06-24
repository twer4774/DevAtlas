import { useState, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
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
  const { screenToFlowPosition } = useReactFlow()
  const [hovered, setHovered] = useState(false)
  const [mouseFlowPos, setMouseFlowPos] = useState<{ x: number; y: number } | null>(null)

  const [edgePath, midX, midY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

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
              transform: `translate(-50%, calc(-100% - 10px)) translate(${mouseFlowPos?.x ?? midX}px, ${mouseFlowPos?.y ?? midY}px)`,
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
