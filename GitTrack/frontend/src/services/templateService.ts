import axios from 'axios';
import { Template } from '../types';


const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  // Get all templates with optional filtering
  async getTemplates(issueType?: string) {
    const response = await api.get('/templates', {
      params: issueType ? { issueType } : {}
    });
    return response.data;
  },

  // Create new template
  async createTemplate(data: CreateTemplateRequest) {
    const response = await api.post('/templates', data);
    return response.data;
  },

  // Get template by ID
  async getTemplateById(id: string) {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  // Update template
  async updateTemplate(id: string, data: UpdateTemplateRequest) {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  // Delete template
  async deleteTemplate(id: string) {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },

  // Get templates by issue type
  async getTemplatesByType(issueType: 'bug' | 'task' | 'improvement' | 'feature') {
    const response = await api.get(`/templates/type/${issueType}`);
    return response.data;
  },

  // Get default templates
  async getDefaultTemplates() {
    const response = await api.get('/templates/defaults');
    return response.data;
  },

  // Apply template
  async applyTemplate(id: string, customData?: { title?: string; description?: string }) {
    const response = await api.post(`/templates/${id}/apply`, customData || {});
    return response.data;
  },

  // Get template statistics (admin only)
  async getTemplateStats() {
    const response = await api.get('/templates/stats');
    return response.data;
  }
};