import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels'
import { useProjectStore } from '@/store/projectStore'
import { useProject } from '@/hooks/useProjects'
import { useVersion } from '@/hooks/useVersions'
import { useUIStore } from '@/store/uiStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDocumentStore } from '@/store/documentStore'
import { useMapStore } from '@/store/mapStore'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { CenterPanel } from '@/components/layout/CenterPanel'
import { RightPanel } from '@/components/layout/RightPanel'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { setActiveProject, activeVersionId } = useProjectStore()
  const { data: project } = useProject(projectId ?? null)
  const { data: activeVersion } = useVersion(activeVersionId)
  const { openSearch } = useUIStore()
  const { reset: resetDocs } = useDocumentStore()
  const { setSelectedNode, setSelectedEdge } = useMapStore()

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId)
      resetDocs()
      setSelectedNode(null)
      setSelectedEdge(null)
    }
  }, [projectId]) // eslint-disable-line

  useKeyboardShortcuts(activeVersionId)

  if (!projectId) return null

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium text-white">{project?.name ?? '...'}</span>
        {activeVersionId && activeVersion && (
          <span className="text-xs text-gray-500 ml-1">
            — {activeVersion.name}
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={openSearch}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
          >
            <Search size={13} />
            <kbd className="text-xs">⌘K</kbd>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <PanelGroup
          orientation="horizontal"
          className="h-full"
        >
          <Panel defaultSize={280} minSize={200} maxSize={520}>
            <LeftPanel projectId={projectId} />
          </Panel>
          <PanelResizeHandle className="panel-handle" />
          <Panel minSize={300}>
            <CenterPanel versionId={activeVersionId} />
          </Panel>
          <PanelResizeHandle className="panel-handle" />
          <Panel defaultSize={320} minSize={220} maxSize={520}>
            <RightPanel projectId={projectId} versionId={activeVersionId} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
