import { Template } from '../types';
import { apiClient } from './apiClient';

interface CreateTemplateRequest {
  name: string;
  issueType: 'bug' | 'task' | 'improvement' | 'feature';
  content: string;
}

interface UpdateTemplateRequest {
  name?: string;
  issueType?: 'bug' | 'task' | 'improvement' | 'feature';
  content?: string;
}

export const templateService = {
  async getTemplates(issueType?: string) {
    try {
      const response = await apiClient.get('/templates', {
        params: issueType ? { issue_type: issueType } : {}
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: [], error: { message: error.response?.data?.detail || 'Failed to load templates' } };
    }
  },

  async createTemplate(data: CreateTemplateRequest) {
    const response = await apiClient.post('/templates', data);
    return response.data;
  },

  async getTemplateById(id: string) {
    const response = await apiClient.get(`/templates/${id}`);
    return response.data;
  },

  async updateTemplate(id: string, data: UpdateTemplateRequest) {
    const response = await apiClient.put(`/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/templates/${id}`);
    return response.data;
  },

  async getTemplatesByType(issueType: 'bug' | 'task' | 'improvement' | 'feature') {
    try {
      const response = await apiClient.get(`/templates/type/${issueType}`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      return { success: true, data };
    } catch (error: any) {
      return { success: false, data: [], error: { message: error.response?.data?.detail || 'Failed to load templates' } };
    }
  },

  async getDefaultTemplates() {
    const response = await apiClient.get('/templates/defaults');
    return response.data;
  },

  async applyTemplate(id: string, customData?: { title?: string; description?: string }) {
    const response = await apiClient.post(`/templates/${id}/apply`, customData || {});
    return response.data;
  },

  async getTemplateStats() {
    const response = await apiClient.get('/templates/stats');
    return response.data;
  }
};
