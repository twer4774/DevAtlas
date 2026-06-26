import axios from 'axios';
import { Project, CreateProjectRequest, UpdateProjectRequest, ApiResponse } from '../types';
import { EnhancedProject, CreateEnhancedProjectRequest, UpdateEnhancedProjectRequest } from '../types/project-groups';


const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const projectService = {
  // Get all projects (enhanced version)
  async getProjects(projectGroupId?: string): Promise<ApiResponse<EnhancedProject[]>> {
    try {
      const params = projectGroupId ? { projectGroupId } : {};
      const response = await api.get('/projects', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch projects'
        }
      };
    }
  },

  // Get project by ID (enhanced version)
  async getProjectById(id: string): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await api.get(`/projects/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching project:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch project'
        }
      };
    }
  },

  // Create new enhanced project
  async createProject(data: CreateEnhancedProjectRequest): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await api.post('/projects', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to create project'
        }
      };
    }
  },

  // Update enhanced project
  async updateProject(id: string, data: UpdateEnhancedProjectRequest): Promise<ApiResponse<EnhancedProject>> {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to update project'
        }
      };
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/projects/${id}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to delete project'
        }
      };
    }
  },

  // Get default project
  async getDefaultProject(): Promise<ApiResponse<Project>> {
    try {
      const response = await api.get('/projects/default');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching default project:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch default project'
        }
      };
    }
  },

  // Legacy methods for backward compatibility
  async getProjectsLegacy() {
    const response = await api.get('/projects');
    return response.data;
  },

  async createProjectLegacy(data: CreateProjectRequest) {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async updateProjectLegacy(id: string, data: UpdateProjectRequest) {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  }
};