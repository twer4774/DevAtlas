import { apiClient } from './apiClient';

export const dashboardService = {
  async getDashboardStats(projectId?: string) {
    const response = await apiClient.get('/dashboard/stats', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  async getIssueTrends(projectId?: string) {
    const response = await apiClient.get('/dashboard/trends', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  async getAssignmentStats(projectId?: string) {
    const response = await apiClient.get('/dashboard/assignments', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  async getResolutionStats(projectId?: string) {
    const response = await apiClient.get('/dashboard/resolution', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  }
};
