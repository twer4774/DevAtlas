import { ProjectTreeNode, NodeStatistics } from '../types/treeView';


export class TreeViewService {
  /**
   * 프로젝트 트리 데이터 조회
   */
  static async getProjectTree(): Promise<ProjectTreeNode[]> {
    try {
      const response = await fetch(`/api/dashboard/tree`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch tree data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching project tree:', error);
      // 폴백 데이터 반환
      return this.getFallbackTreeData();
    }
  }

  /**
   * 노드 통계 조회
   */
  static async getNodeStatistics(nodeId: string): Promise<NodeStatistics> {
    try {
      const response = await fetch(`/api/dashboard/tree/${nodeId}/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch node statistics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching node statistics:', error);
      return {
        totalIssues: 0,
        openIssues: 0,
        inProgressIssues: 0,
        closedIssues: 0,
        byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
        byType: { bug: 0, feature: 0, task: 0, improvement: 0 }
      };
    }
  }

  /**
   * 노드 상세 정보 조회
   */
  static async getNodeDetails(nodeId: string): Promise<{ node: ProjectTreeNode; statistics: NodeStatistics }> {
    try {
      const response = await fetch(`/api/dashboard/tree/${nodeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch node details');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching node details:', error);
      throw error;
    }
  }

  /**
   * 폴백 트리 데이터
   */
  private static getFallbackTreeData(): ProjectTreeNode[] {
    return [
      {
        id: 'group-demo',
        type: 'group',
        name: 'Demo Project Group',
        description: 'Sample project group for demonstration',
        icon: '📁',
        color: '#3B82F6',
        issueCount: 15,
        children: [
          {
            id: 'project-frontend',
            type: 'project',
            name: 'Frontend Application',
            description: 'React-based web application',
            icon: '🚀',
            color: '#3B82F6',
            issueCount: 8,
            children: [
              {
                id: 'category-frontend-bug',
                type: 'category',
                name: 'Bug Issues',
                icon: '🐛',
                color: '#EF4444',
                issueCount: 3,
                children: [
                  {
                    id: 'issue-1',
                    type: 'issue',
                    name: '#1 Login button not working',
                    description: 'Users cannot click the login button',
                    icon: '📄',
                    color: '#DC2626',
                    issueCount: 0,
                    children: [],
                    metadata: {
                      status: 'open',
                      priority: 'urgent',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  },
                  {
                    id: 'issue-2',
                    type: 'issue',
                    name: '#2 Page loading too slow',
                    description: 'Homepage takes more than 5 seconds to load',
                    icon: '📄',
                    color: '#EA580C',
                    issueCount: 0,
                    children: [],
                    metadata: {
                      status: 'in_progress',
                      priority: 'high',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  }
                ],
                metadata: {
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              },
              {
                id: 'category-frontend-feature',
                type: 'category',
                name: 'Feature Issues',
                icon: '✨',
                color: '#10B981',
                issueCount: 3,
                children: [
                  {
                    id: 'issue-3',
                    type: 'issue',
                    name: '#3 Add dark mode',
                    description: 'Implement dark theme for better user experience',
                    icon: '📄',
                    color: '#CA8A04',
                    issueCount: 0,
                    children: [],
                    metadata: {
                      status: 'open',
                      priority: 'medium',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  }
                ],
                metadata: {
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              }
            ],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          {
            id: 'project-backend',
            type: 'project',
            name: 'Backend API',
            description: 'Node.js REST API server',
            icon: '🔧',
            color: '#10B981',
            issueCount: 5,
            children: [
              {
                id: 'category-backend-bug',
                type: 'category',
                name: 'Bug Issues',
                icon: '🐛',
                color: '#EF4444',
                issueCount: 2,
                children: [],
                metadata: {
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              }
            ],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];
  }
}