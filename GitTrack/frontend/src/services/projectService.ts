import { Project, CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../types';
import { EnhancedProject, CreateEnhancedProjectRequest, UpdateEnhancedProjectRequest } from '../types/project-groups';
import { apiClient } from './apiClient';

export const projectService = {
  async getProjects(projectGroupId?: string): Promise<ApiResponse<EnhancedProject[]>> {
    try {
      const params = projectGroupId ? { projectGroupId } : {};
      const response = await apiClient.get('/projects', { params });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch projects' } };
    }
  },

  async getProjectById(id: string): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await apiClient.get(`/projects/${id}`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching project:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch project' } };
    }
  },

  async createProject(data: CreateEnhancedProjectRequest): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await apiClient.post('/projects', data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to create project' } };
    }
  },

  async updateProject(id: string, data: UpdateEnhancedProjectRequest): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await apiClient.put(`/projects/${id}`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to update project' } };
    }
  },

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/projects/${id}`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to delete project' } };
    }
  },

  async getDefaultProject(): Promise<ApiResponse<Project>> {
    try {
      const response = await apiClient.get('/projects/default');
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching default project:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch default project' } };
    }
  },

  async getProjectsLegacy() {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  async createProjectLegacy(data: CreateProjectRequest) {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async updateProjectLegacy(id: string, data: UpdateProjectRequest) {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  }
};
