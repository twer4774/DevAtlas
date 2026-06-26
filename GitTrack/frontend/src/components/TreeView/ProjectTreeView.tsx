import React, { useState, useEffect } from 'react';
import type { ProjectTreeNode, NodeStatistics } from '../../types/treeView'
import { TreeViewService } from '../../services/treeViewService'
import TreeNode from './TreeNode';

interface ProjectTreeViewProps {
  className?: string;
}

const ProjectTreeView: React.FC<ProjectTreeViewProps> = ({ className = '' }) => {
  const [treeData, setTreeData] = useState<ProjectTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<ProjectTreeNode | null>(null);
  const [nodeStatistics, setNodeStatistics] = useState<NodeStatistics | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TreeViewService.getProjectTree();
      setTreeData(data);
      
      // 첫 번째 레벨 노드들을 기본으로 확장
      const firstLevelIds = data.map(node => node.id);
      setExpandedNodes(new Set(firstLevelIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tree data');
    } finally {
      setLoading(false);
    }
  };

  // 노드 확장/축소 토글
  const handleNodeToggle = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // 노드 선택
  const handleNodeSelect = async (node: ProjectTreeNode) => {
    setSelectedNode(node);
    
    // 노드 통계 로드
    try {
      const stats = await TreeViewService.getNodeStatistics(node.id);
      setNodeStatistics(stats);
    } catch (err) {
      console.error('Failed to load node statistics:', err);
      setNodeStatistics(null);
    }
  };

  // 전체 확장/축소
  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: ProjectTreeNode[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.id);
        if (node.children) {
          collectNodeIds(node.children);
        }
      });
    };
    collectNodeIds(treeData);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading project tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTreeData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Tree View</h2>
            <p className="text-gray-600 mt-1">Hierarchical view of projects and issues</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={loadTreeData}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 트리 뷰 영역 */}
        <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
          {treeData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600">Create your first project to see it in the tree view.</p>
            </div>
          ) : (
            <div className="min-h-full flex flex-col items-center justify-start pt-8">
              <div className="space-y-20 w-full max-w-7xl">
                {treeData.map((rootNode) => (
                  <div key={rootNode.id} className="flex justify-center">
                    <TreeNode
                      node={rootNode}
                      level={0}
                      isExpanded={expandedNodes.has(rootNode.id)}
                      isSelected={selectedNode?.id === rootNode.id}
                      onToggle={handleNodeToggle}
                      onSelect={handleNodeSelect}
                      expandedNodes={expandedNodes}
                      selectedNodeId={selectedNode?.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 - 선택된 노드 정보 */}
        {selectedNode && (
          <div className="w-80 border-l border-gray-200 bg-gray-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Details</h3>
              
              {/* 노드 기본 정보 */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{selectedNode.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedNode.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{selectedNode.type}</p>
                  </div>
                </div>
                
                {selectedNode.description && (
                  <p className="text-sm text-gray-700 mb-3">{selectedNode.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Issues:</span>
                  <span className="font-medium">{selectedNode.issueCount}</span>
                </div>

                {selectedNode.metadata.status && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Status:</span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${selectedNode.metadata.status === 'open' ? 'bg-red-100 text-red-800' : ''}
                      ${selectedNode.metadata.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedNode.metadata.status === 'resolved' || selectedNode.metadata.status === 'closed' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {selectedNode.metadata.status.replace('_', ' ')}
                    </span>
                  </div>
                )}

                {selectedNode.metadata.priority && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${selectedNode.metadata.priority === 'urgent' ? 'bg-red-100 text-red-800' : ''}
                      ${selectedNode.metadata.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                      ${selectedNode.metadata.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedNode.metadata.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {selectedNode.metadata.priority}
                    </span>
                  </div>
                )}

                {selectedNode.metadata.assignee && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Assignee:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {selectedNode.metadata.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{selectedNode.metadata.assignee.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 통계 정보 */}
              {nodeStatistics && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-gray-900 mb-3">Statistics</h5>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Issues:</span>
                      <span className="font-medium">{nodeStatistics.totalIssues}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Open:</span>
                      <span className="font-medium text-red-600">{nodeStatistics.openIssues}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Progress:</span>
                      <span className="font-medium text-yellow-600">{nodeStatistics.inProgressIssues}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Closed:</span>
                      <span className="font-medium text-green-600">{nodeStatistics.closedIssues}</span>
                    </div>
                  </div>

                  {/* 우선순위별 통계 */}
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-gray-900 mb-2">By Priority</h6>
                    <div className="space-y-1 text-xs">
                      {Object.entries(nodeStatistics.byPriority).map(([priority, count]) => (
                        <div key={priority} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{priority}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 타입별 통계 */}
                  <div className="mt-4">
                    <h6 className="text-sm font-medium text-gray-900 mb-2">By Type</h6>
                    <div className="space-y-1 text-xs">
                      {Object.entries(nodeStatistics.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTreeView;