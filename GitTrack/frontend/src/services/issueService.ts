import { Issue, CreateIssueRequest, UpdateIssueRequest } from '../types';
import { apiClient } from './apiClient';

export const issueService = {
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
    const response = await apiClient.get('/issues', { params });
    return response.data;
  },

  async getIssueById(id: string) {
    const response = await apiClient.get(`/issues/${id}`);
    return response.data;
  },

  async createIssue(data: CreateIssueRequest) {
    const response = await apiClient.post('/issues', data);
    return response.data;
  },

  async updateIssue(id: string, data: UpdateIssueRequest) {
    const response = await apiClient.put(`/issues/${id}`, data);
    return response.data;
  },

  async deleteIssue(id: string) {
    const response = await apiClient.delete(`/issues/${id}`);
    return response.data;
  },

  async getIssueStats(projectId?: string) {
    const response = await apiClient.get('/issues/stats', {
      params: projectId ? { projectId } : {}
    });
    return response.data;
  }
};
