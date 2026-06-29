import { Home, ChevronRight } from 'lucide-react'
import { useMapStore } from '@/store/mapStore'

export function DrillBreadcrumb() {
  const { drillPath, exitToRoot, exitDrillDown } = useMapStore()

  if (drillPath.length === 0) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-gray-900/95 border border-gray-700 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-sm text-xs">
      <button
        onClick={exitToRoot}
        className="text-gray-400 hover:text-white transition-colors flex items-center"
        title="루트로 돌아가기"
      >
        <Home size={12} />
      </button>

      {drillPath.map((crumb, i) => {
        const isLast = i === drillPath.length - 1
        return (
          <div key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={11} className="text-gray-600" />
            {isLast ? (
              <span className="text-white font-medium max-w-[160px] truncate">{crumb.title}</span>
            ) : (
              <button
                onClick={() => {
                  const store = useMapStore.getState()
                  const idx = store.drillPath.findIndex(c => c.id === crumb.id)
                  if (idx !== -1) {
                    useMapStore.setState({
                      drillRootId: crumb.id,
                      drillPath: store.drillPath.slice(0, idx + 1),
                    })
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors max-w-[120px] truncate"
              >
                {crumb.title}
              </button>
            )}
          </div>
        )
      })}

      <button
        onClick={exitDrillDown}
        className="ml-2 text-[10px] text-gray-500 hover:text-white border border-gray-700 rounded px-1.5 py-0.5 transition-colors"
      >
        나가기
      </button>
    </div>
  )
}
