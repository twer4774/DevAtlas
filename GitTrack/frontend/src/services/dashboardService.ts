import axios from 'axios';


const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const dashboardService = {
  // Get comprehensive dashboard statistics
  async getDashboardStats(projectId?: string) {
    const response = await api.get('/dashboard/stats', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  // Get issue trends over time
  async getIssueTrends(projectId?: string) {
    const response = await api.get('/dashboard/trends', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  // Get assignment distribution
  async getAssignmentStats(projectId?: string) {
    const response = await api.get('/dashboard/assignments', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  },

  // Get resolution time statistics
  async getResolutionStats(projectId?: string) {
    const response = await api.get('/dashboard/resolution', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  }
};