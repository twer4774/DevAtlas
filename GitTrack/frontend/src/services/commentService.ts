import { Comment, CommentFormData } from '../types';
import { apiClient } from './apiClient';

export const commentService = {
  async getCommentsByIssueId(issueId: string) {
    const response = await apiClient.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  async createComment(issueId: string, data: CommentFormData) {
    const response = await apiClient.post(`/issues/${issueId}/comments`, data);
    return response.data;
  },

  async updateComment(id: string, data: CommentFormData) {
    const response = await apiClient.put(`/comments/${id}`, data);
    return response.data;
  },

  async deleteComment(id: string) {
    const response = await apiClient.delete(`/comments/${id}`);
    return response.data;
  },

  async getCommentById(id: string) {
    const response = await apiClient.get(`/comments/${id}`);
    return response.data;
  }
};
