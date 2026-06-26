import axios from 'axios';
import { Comment, CommentFormData } from '../types';


const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const commentService = {
  // Get comments for an issue
  async getCommentsByIssueId(issueId: string) {
    const response = await api.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  // Create new comment
  async createComment(issueId: string, data: CommentFormData) {
    const response = await api.post(`/issues/${issueId}/comments`, data);
    return response.data;
  },

  // Update comment
  async updateComment(id: string, data: CommentFormData) {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  },

  // Delete comment
  async deleteComment(id: string) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  // Get comment by ID
  async getCommentById(id: string) {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  }
};