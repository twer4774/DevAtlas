import { apiClient } from './apiClient';

export interface StatusHistoryItem {
  id: string;
  issueId: string;
  fromStatus: string | null;
  toStatus: string;
  changeType: 'manual' | 'github_webhook' | 'github_sync';
  reason?: string;
  githubSync: boolean;
  createdAt: string;
  changer: {
    id: string;
    name: string;
    email: string;
    githubUsername?: string;
    avatarUrl?: string;
  };
}

export interface RecentStatusChange extends StatusHistoryItem {
  issue: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
    };
  };
}

class StatusHistoryService {
  /**
   * 이슈의 상태 변경 히스토리 조회
   */
  async getIssueStatusHistory(issueId: string): Promise<{ success: boolean; data: StatusHistoryItem[] }> {
    try {
      const response = await apiClient.get(`/issues/${issueId}/status-history`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get status history:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get status history');
    }
  }

  /**
   * 프로젝트의 상태 변경 통계 조회
   */
  async getProjectStatusStats(projectId: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await apiClient.get(`/projects/${projectId}/status-stats`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get status stats:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get status stats');
    }
  }

  /**
   * 최근 상태 변경 활동 조회
   */
  async getRecentStatusChanges(limit: number = 10): Promise<{ success: boolean; data: RecentStatusChange[] }> {
    try {
      const response = await apiClient.get(`/status-history/recent?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get recent status changes:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get recent status changes');
    }
  }

  /**
   * 상태 변경 타입에 따른 아이콘 반환
   */
  getChangeTypeIcon(changeType: string): string {
    switch (changeType) {
      case 'manual':
        return '👤';
      case 'github_webhook':
        return '🔔';
      case 'github_sync':
        return '🔄';
      default:
        return '📝';
    }
  }

  /**
   * 상태에 따른 색상 반환
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * 상태 변경 타입에 따른 설명 반환
   */
  getChangeTypeDescription(changeType: string): string {
    switch (changeType) {
      case 'manual':
        return 'Manual update';
      case 'github_webhook':
        return 'GitHub webhook';
      case 'github_sync':
        return 'GitHub sync';
      default:
        return 'Unknown';
    }
  }

  /**
   * 상태 한글명 반환
   */
  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'open':
        return '열림';
      case 'in_progress':
        return '진행중';
      case 'resolved':
        return '해결됨';
      case 'closed':
        return '닫힘';
      default:
        return status;
    }
  }
}

export const statusHistoryService = new StatusHistoryService();
export default statusHistoryService;