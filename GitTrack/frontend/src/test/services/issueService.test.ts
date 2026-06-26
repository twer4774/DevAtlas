import { describe, it, expect, vi, beforeEach } from 'vitest';
import { issueService } from '../../services/issueService';
import { mockAxios, mockApiResponse, mockIssue, mockUser, setupMocks } from '../utils';

// Setup mocks
setupMocks();

describe('issueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIssues', () => {
    const mockIssues = [mockIssue, { ...mockIssue, id: '2', title: 'Another Issue' }];

    it('should get issues with default parameters', async () => {
      const mockResponse = mockApiResponse.paginated(mockIssues);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssues();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: {}
      });

      expect(result).toEqual({
        data: mockIssues,
        pagination: mockResponse.pagination
      });
    });

    it('should get issues with filters', async () => {
      const mockResponse = mockApiResponse.paginated(mockIssues);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const filters = {
        status: 'open',
        type: 'bug',
        priority: 'high',
        assigneeId: '1',
        projectId: '1',
        search: 'test',
        page: 2,
        limit: 20
      };

      await issueService.getIssues(filters);

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: filters
      });
    });

    it('should handle sorting parameters', async () => {
      const mockResponse = mockApiResponse.paginated(mockIssues);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      await issueService.getIssues({
        sortBy: 'title',
        sortOrder: 'asc'
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: {
          sortBy: 'title',
          sortOrder: 'asc'
        }
      });
    });

    it('should throw error on API failure', async () => {
      const mockError = mockApiResponse.error('Failed to fetch issues');
      mockAxios.get.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(issueService.getIssues()).rejects.toThrow('Failed to fetch issues');
    });
  });

  describe('getIssueById', () => {
    it('should get issue by id successfully', async () => {
      const mockResponse = mockApiResponse.success(mockIssue);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssueById('1');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues/1');
      expect(result).toEqual(mockIssue);
    });

    it('should throw error for non-existent issue', async () => {
      const mockError = mockApiResponse.error('Issue not found', 'RECORD_NOT_FOUND');
      mockAxios.get.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(issueService.getIssueById('999')).rejects.toThrow('Issue not found');
    });
  });

  describe('createIssue', () => {
    const issueData = {
      title: 'New Issue',
      description: 'Issue description',
      type: 'bug' as const,
      priority: 'medium' as const,
      projectId: '1'
    };

    it('should create issue successfully', async () => {
      const createdIssue = { ...mockIssue, ...issueData };
      const mockResponse = mockApiResponse.success(createdIssue);
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.createIssue(issueData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/issues', issueData);
      expect(result).toEqual(createdIssue);
    });

    it('should handle validation errors', async () => {
      const mockError = mockApiResponse.error('Title is required', 'VALIDATION_ERROR');
      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        issueService.createIssue({ ...issueData, title: '' })
      ).rejects.toThrow('Title is required');
    });

    it('should create issue with assignee', async () => {
      const issueWithAssignee = { ...issueData, assigneeId: '2' };
      const createdIssue = { ...mockIssue, ...issueWithAssignee };
      const mockResponse = mockApiResponse.success(createdIssue);
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.createIssue(issueWithAssignee);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/issues', issueWithAssignee);
      expect(result.assigneeId).toBe('2');
    });
  });

  describe('updateIssue', () => {
    const updateData = {
      title: 'Updated Title',
      description: 'Updated description',
      status: 'in_progress' as const
    };

    it('should update issue successfully', async () => {
      const updatedIssue = { ...mockIssue, ...updateData };
      const mockResponse = mockApiResponse.success(updatedIssue);
      mockAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.updateIssue('1', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/api/issues/1', updateData);
      expect(result).toEqual(updatedIssue);
    });

    it('should handle permission errors', async () => {
      const mockError = mockApiResponse.error('Permission denied', 'PERMISSION_DENIED');
      mockAxios.put.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        issueService.updateIssue('1', updateData)
      ).rejects.toThrow('Permission denied');
    });

    it('should update partial fields', async () => {
      const partialUpdate = { status: 'resolved' as const };
      const updatedIssue = { ...mockIssue, status: 'resolved' as const };
      const mockResponse = mockApiResponse.success(updatedIssue);
      mockAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.updateIssue('1', partialUpdate);

      expect(mockAxios.put).toHaveBeenCalledWith('/api/issues/1', partialUpdate);
      expect(result.status).toBe('resolved');
    });
  });

  describe('deleteIssue', () => {
    it('should delete issue successfully', async () => {
      const mockResponse = mockApiResponse.success({ message: 'Issue deleted successfully' });
      mockAxios.delete.mockResolvedValueOnce({ data: mockResponse });

      await issueService.deleteIssue('1');

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/issues/1');
    });

    it('should handle permission errors', async () => {
      const mockError = mockApiResponse.error('Permission denied', 'PERMISSION_DENIED');
      mockAxios.delete.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(issueService.deleteIssue('1')).rejects.toThrow('Permission denied');
    });

    it('should handle non-existent issue', async () => {
      const mockError = mockApiResponse.error('Issue not found', 'RECORD_NOT_FOUND');
      mockAxios.delete.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(issueService.deleteIssue('999')).rejects.toThrow('Issue not found');
    });
  });

  describe('assignIssue', () => {
    it('should assign issue successfully', async () => {
      const assignedIssue = { ...mockIssue, assigneeId: '2', assignee: mockUser };
      const mockResponse = mockApiResponse.success(assignedIssue);
      mockAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.assignIssue('1', '2');

      expect(mockAxios.put).toHaveBeenCalledWith('/api/issues/1', { assigneeId: '2' });
      expect(result.assigneeId).toBe('2');
    });

    it('should unassign issue when assigneeId is null', async () => {
      const unassignedIssue = { ...mockIssue, assigneeId: null, assignee: null };
      const mockResponse = mockApiResponse.success(unassignedIssue);
      mockAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.assignIssue('1', null);

      expect(mockAxios.put).toHaveBeenCalledWith('/api/issues/1', { assigneeId: null });
      expect(result.assigneeId).toBeNull();
    });
  });

  describe('getIssueComments', () => {
    const mockComments = [
      {
        id: '1',
        content: 'First comment',
        issueId: '1',
        authorId: '1',
        author: mockUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    it('should get issue comments successfully', async () => {
      const mockResponse = mockApiResponse.success(mockComments);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssueComments('1');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues/1/comments');
      expect(result).toEqual(mockComments);
    });

    it('should return empty array for issue with no comments', async () => {
      const mockResponse = mockApiResponse.success([]);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssueComments('1');

      expect(result).toEqual([]);
    });
  });

  describe('addComment', () => {
    const commentData = {
      content: 'New comment'
    };

    it('should add comment successfully', async () => {
      const newComment = {
        id: '1',
        content: commentData.content,
        issueId: '1',
        authorId: '1',
        author: mockUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockResponse = mockApiResponse.success(newComment);
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.addComment('1', commentData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/issues/1/comments', commentData);
      expect(result).toEqual(newComment);
    });

    it('should handle validation errors', async () => {
      const mockError = mockApiResponse.error('Content is required', 'VALIDATION_ERROR');
      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        issueService.addComment('1', { content: '' })
      ).rejects.toThrow('Content is required');
    });
  });

  describe('getIssueStats', () => {
    const mockStats = {
      total: 25,
      byStatus: {
        open: 10,
        in_progress: 8,
        resolved: 5,
        closed: 2
      },
      byType: {
        bug: 12,
        feature: 8,
        task: 3,
        improvement: 2
      },
      byPriority: {
        urgent: 2,
        high: 8,
        medium: 12,
        low: 3
      }
    };

    it('should get overall issue statistics', async () => {
      const mockResponse = mockApiResponse.success(mockStats);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssueStats();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues/stats');
      expect(result).toEqual(mockStats);
    });

    it('should get project-specific statistics', async () => {
      const mockResponse = mockApiResponse.success(mockStats);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.getIssueStats('1');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues/stats', {
        params: { projectId: '1' }
      });
      expect(result).toEqual(mockStats);
    });
  });

  describe('searchIssues', () => {
    it('should search issues successfully', async () => {
      const mockResponse = mockApiResponse.paginated([mockIssue]);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.searchIssues('bug');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: { search: 'bug' }
      });
      expect(result.data).toEqual([mockIssue]);
    });

    it('should handle empty search results', async () => {
      const mockResponse = mockApiResponse.paginated([]);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.searchIssues('nonexistent');

      expect(result.data).toEqual([]);
    });
  });

  describe('bulkUpdateIssues', () => {
    it('should bulk update issues successfully', async () => {
      const issueIds = ['1', '2', '3'];
      const updateData = { status: 'closed' as const };
      const mockResponse = mockApiResponse.success({ updated: 3 });
      mockAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await issueService.bulkUpdateIssues(issueIds, updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/api/issues/bulk', {
        issueIds,
        updateData
      });
      expect(result).toEqual({ updated: 3 });
    });

    it('should handle partial failures', async () => {
      const mockError = mockApiResponse.error('Some issues could not be updated', 'PARTIAL_FAILURE');
      mockAxios.put.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        issueService.bulkUpdateIssues(['1', '2'], { status: 'closed' as const })
      ).rejects.toThrow('Some issues could not be updated');
    });
  });
});