// ── Node types (PRD v2 taxonomy) ───────────────────────────────────────────
export const NODE_TYPES = ['Program', 'Capability', 'Feature', 'Policy', 'External'] as const
export type NodeType = typeof NODE_TYPES[number]

export const DOC_TYPES = ['planning', 'policy', 'technical', 'api', 'adr'] as const
export type DocType = typeof DOC_TYPES[number]

export const NODE_STATUSES = ['live', 'future', 'deprecated', 'removed'] as const
export type NodeStatus = typeof NODE_STATUSES[number]

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  Program: '#8b5cf6',     // purple   — 시스템/사이드
  Capability: '#14b8a6',  // teal     — 업무 기능
  Feature: '#3b82f6',     // blue     — 프로그램 기능
  Policy: '#f59e0b',      // amber    — 정책
  External: '#6b7280',    // gray     — 외부 시스템
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  Program: '프로그램',
  Capability: '업무 기능',
  Feature: '프로그램 기능',
  Policy: '정책',
  External: '외부 시스템',
}

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  Program: 'layers',
  Capability: 'target',
  Feature: 'zap',
  Policy: 'shield',
  External: 'external-link',
}

// ── Extended / infrastructure type system ─────────────────────────────────
// Free-form types used in IoT, cloud, and infrastructure diagrams.
const EXTENDED_TYPE_COLORS: Record<string, string> = {
  service: '#3b82f6',
  backend: '#3b82f6',
  api: '#3b82f6',
  frontend: '#22c55e',
  database: '#f59e0b',
  storage: '#14b8a6',
  broker: '#8b5cf6',
  queue: '#8b5cf6',
  function: '#f97316',
  worker: '#f97316',
  cache: '#f97316',
  'cloud-service': '#06b6d4',
  'auth-service': '#ec4899',
  device: '#84cc16',
  'device-planned': '#6b7280',
  gateway: '#14b8a6',
  network: '#6b7280',
}

const EXTENDED_TYPE_LABELS: Record<string, string> = {
  service: '서비스',
  backend: '백엔드',
  api: 'API',
  frontend: '프론트엔드',
  database: '데이터베이스',
  storage: '스토리지',
  broker: '메시지 브로커',
  queue: '큐',
  function: '서버리스 함수',
  worker: '워커',
  cache: '캐시',
  'cloud-service': '클라우드 서비스',
  'auth-service': '인증 서비스',
  device: '디바이스',
  'device-planned': '디바이스 (계획)',
  gateway: '게이트웨이',
  network: '네트워크',
}

export function getNodeTypeColor(type: string): string {
  return (NODE_TYPE_COLORS as Record<string, string>)[type]
    ?? EXTENDED_TYPE_COLORS[type]
    ?? '#6b7280'
}

export function getNodeTypeLabel(type: string): string {
  return (NODE_TYPE_LABELS as Record<string, string>)[type]
    ?? EXTENDED_TYPE_LABELS[type]
    ?? type
}

export const NODE_STATUS_COLORS: Record<NodeStatus, string> = {
  live: '#22c55e',
  future: '#3b82f6',
  deprecated: '#f59e0b',
  removed: '#ef4444',
}

export const NODE_STATUS_LABELS: Record<NodeStatus, string> = {
  live: 'Live',
  future: 'Future',
  deprecated: 'Deprecated',
  removed: 'Removed',
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  planning: '기획',
  policy: '정책',
  technical: '기술',
  api: 'API',
  adr: 'ADR',
}

// ── Edge relation types (PRD v2) ───────────────────────────────────────────
export const EDGE_RELATION_TYPES = [
  'contains',
  'realizes',
  'depends_on',
  'triggers',
  'applies_to',
  'references',
] as const
export type EdgeRelationType = typeof EDGE_RELATION_TYPES[number]

export const EDGE_RELATION_COLORS: Record<EdgeRelationType, string> = {
  contains: '#6b7280',    // gray   — 포함
  realizes: '#3b82f6',    // blue   — 구현
  depends_on: '#f59e0b',  // amber  — 의존
  triggers: '#8b5cf6',    // purple — 트리거
  applies_to: '#ef4444',  // red    — 정책 적용
  references: '#22c55e',  // green  — 참조
}

export const EDGE_RELATION_LABELS: Record<EdgeRelationType, string> = {
  contains: '포함',
  realizes: '구현',
  depends_on: '의존',
  triggers: '트리거',
  applies_to: '정책 적용',
  references: '참조',
}

export const DIFF_COLORS = {
  added: '#22c55e',
  deleted: '#ef4444',
  changed: '#f59e0b',
}
