import axios from 'axios';
import { ProjectGroup, CreateProjectGroupRequest, UpdateProjectGroupRequest } from '../types/project-groups';
import { ApiResponse } from '../types';


// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ProjectGroupWithStats extends ProjectGroup {
  _count: {
    projects: number;
    issues: number;
  };
}

class ProjectGroupService {
  /**
   * Get all project groups
   */
  async getProjectGroups(mine?: boolean): Promise<ApiResponse<ProjectGroupWithStats[]>> {
    try {
      const params = mine ? { mine: 'true' } : {};
      const response = await api.get('/project-groups', { params });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching project groups:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch project groups'
        }
      };
    }
  }

  /**
   * Get project group by ID
   */
  async getProjectGroupById(id: string): Promise<ApiResponse<ProjectGroupWithStats>> {
    try {
      const response = await api.get(`/project-groups/${id}`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching project group:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch project group'
        }
      };
    }
  }

  /**
   * Create new project group
   */
  async createProjectGroup(data: CreateProjectGroupRequest): Promise<ApiResponse<ProjectGroup>> {
    try {
      const response = await api.post('/project-groups', data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error creating project group:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to create project group'
        }
      };
    }
  }

  /**
   * Update project group
   */
  async updateProjectGroup(id: string, data: UpdateProjectGroupRequest): Promise<ApiResponse<ProjectGroup>> {
    try {
      const response = await api.put(`/project-groups/${id}`, data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error updating project group:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to update project group'
        }
      };
    }
  }

  /**
   * Delete project group
   */
  async deleteProjectGroup(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/project-groups/${id}`);
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error deleting project group:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to delete project group'
        }
      };
    }
  }

  /**
   * Get project group statistics
   */
  async getProjectGroupStats(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/project-groups/${id}/stats`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error fetching project group stats:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Failed to fetch project group statistics'
        }
      };
    }
  }
}

export const projectGroupService = new ProjectGroupService();