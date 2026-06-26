export interface ProjectTreeNode {
  id: string;
  type: 'group' | 'project' | 'category' | 'issue';
  name: string;
  description?: string;
  icon: string;
  color: string;
  issueCount: number;
  children: ProjectTreeNode[];
  metadata: {
    status?: string;
    priority?: string;
    assignee?: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface NodeStatistics {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export interface TreeViewProps {
  data: ProjectTreeNode[];
  onNodeClick?: (node: ProjectTreeNode) => void;
  onNodeExpand?: (nodeId: string, expanded: boolean) => void;
  selectedNodeId?: string;
  expandedNodes?: Set<string>;
  className?: string;
}

export interface TreeNodeProps {
  node: ProjectTreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (node: ProjectTreeNode) => void;
  parentPosition?: { x: number; y: number };
  expandedNodes?: Set<string>;
  selectedNodeId?: string;
}