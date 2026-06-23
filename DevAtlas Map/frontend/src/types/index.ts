export interface Project {
  id: string
  name: string
  description: string | null
  creator: string
  created_at: string
}

export interface Version {
  id: string
  project_id: string
  name: string
  base_version_id: string | null
  release_date: string | null
  created_at: string
}

export interface ArchitectureNode {
  id: string
  version_id: string
  parent_id: string | null
  title: string
  type: string
  position: { x: number; y: number } | null
  metadata_: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NodeEdge {
  id: string
  version_id: string
  source_id: string
  target_id: string
  relation_type: string
  created_at: string
}

export interface Document {
  id: string
  project_id: string
  version_id: string | null
  type: string
  title: string
  content_url: string | null
  linked_node_ids: string[]
  created_at: string
  updated_at: string
}

export interface ChangeLog {
  id: string
  version_id: string
  target_id: string
  action: string
  reason: string | null
  author: string
  created_at: string
}

export interface DiffResult {
  added: string[]
  deleted: string[]
  changed: string[]
  unchanged: string[]
  edges_added: string[]
  edges_deleted: string[]
}

export interface SearchResponse {
  nodes: Array<{ id: string; version_id: string; title: string; type: string }>
  documents: Array<{ id: string; project_id: string; title: string; type: string }>
  versions: Array<{ id: string; project_id: string; name: string; created_at: string }>
}
