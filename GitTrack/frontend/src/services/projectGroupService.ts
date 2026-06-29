import { ProjectGroup, CreateProjectGroupRequest, UpdateProjectGroupRequest } from '../types/project-groups';
import { ApiResponse } from '../types';
import { apiClient } from './apiClient';

export interface ProjectGroupWithStats extends ProjectGroup {
  _count: {
    projects: number;
    issues: number;
  };
}

class ProjectGroupService {
  async getProjectGroups(mine?: boolean): Promise<ApiResponse<ProjectGroupWithStats[]>> {
    try {
      const params = mine ? { mine: 'true' } : {};
      const response = await apiClient.get('/project-groups', { params });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching project groups:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch project groups' } };
    }
  }

  async getProjectGroupById(id: string): Promise<ApiResponse<ProjectGroupWithStats>> {
    try {
      const response = await apiClient.get(`/project-groups/${id}`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching project group:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch project group' } };
    }
  }

  async createProjectGroup(data: CreateProjectGroupRequest): Promise<ApiResponse<ProjectGroup>> {
    try {
      const response = await apiClient.post('/project-groups', data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error creating project group:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to create project group' } };
    }
  }

  async updateProjectGroup(id: string, data: UpdateProjectGroupRequest): Promise<ApiResponse<ProjectGroup>> {
    try {
      const response = await apiClient.put(`/project-groups/${id}`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error updating project group:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to update project group' } };
    }
  }

  async deleteProjectGroup(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/project-groups/${id}`);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error('Error deleting project group:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to delete project group' } };
    }
  }

  async getProjectGroupStats(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/project-groups/${id}/stats`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error fetching project group stats:', error);
      return { success: false, error: { message: error.response?.data?.error?.message || 'Failed to fetch project group statistics' } };
    }
  }
}

export const projectGroupService = new ProjectGroupService();
