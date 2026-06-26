import { apiClient } from './apiClient';

export interface Spec {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bug' | 'task';
  status: 'draft' | 'review' | 'approved' | 'implemented' | 'archived';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  projectId: string;
  createdBy: string;
  assigneeId?: string;
  requirements?: string;
  acceptance?: string;
  design?: string;
  implementation?: string;
  testing?: string;
  estimatedHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  issues?: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    priority: string;
  }>;
}

export interface SpecTemplate {
  title: string;
  requirements: string;
  acceptance: string;
  design: string;
  implementation: string;
  testing: string;
}

export interface CreateSpecData {
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bug' | 'task';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  projectId: string;
  assigneeId?: string;
  requirements?: string;
  acceptance?: string;
  design?: string;
  implementation?: string;
  testing?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface CreateIssueFromSpecData {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  assigneeId?: string;
}

class SpecService {
  /**
   * Spec 생성
   */
  async createSpec(data: CreateSpecData) {
    try {
      const response = await apiClient.post('/specs', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Create spec error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create spec'
      };
    }
  }

  /**
   * Spec 목록 조회
   */
  async getSpecs(params?: {
    projectId?: string;
    status?: string;
    type?: string;
    assigneeId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const response = await apiClient.get('/specs', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Get specs error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get specs'
      };
    }
  }

  /**
   * Spec 상세 조회
   */
  async getSpecById(id: string) {
    try {
      const response = await apiClient.get(`/specs/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Get spec by ID error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get spec'
      };
    }
  }

  /**
   * Spec에서 이슈 생성 (spec-driven development)
   */
  async createIssueFromSpec(specId: string, data: CreateIssueFromSpecData) {
    try {
      const response = await apiClient.post(`/specs/${specId}/issues`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Create issue from spec error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create issue from spec'
      };
    }
  }

  /**
   * 타입별 Spec 템플릿 생성
   */
  async generateSpecTemplate(type: 'feature' | 'improvement' | 'bug' | 'task', projectId?: string) {
    try {
      const response = await apiClient.post('/specs/template', { type, projectId });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Generate spec template error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to generate spec template'
      };
    }
  }
}

export const specService = new SpecService();