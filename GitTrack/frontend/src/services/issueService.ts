import axios from 'axios';
import { Issue, CreateIssueRequest, UpdateIssueRequest } from '../types';


const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const issueService = {
  // Get all issues with filtering and pagination
  async getIssues(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    assigneeId?: string;
    creatorId?: string;
    projectId?: string;
    search?: string;
  }) {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get issue by ID
  async getIssueById(id: string) {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  // Create new issue
  async createIssue(data: CreateIssueRequest) {


    
    const response = await api.post('/issues', data);
    return response.data;
  },

  // Update issue
  async updateIssue(id: string, data: UpdateIssueRequest) {
    const response = await api.put(`/issues/${id}`, data);
    return response.data;
  },

  // Delete issue
  async deleteIssue(id: string) {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  },

  // Get issue statistics
  async getIssueStats(projectId?: string) {
    const response = await api.get('/issues/stats', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  }
};