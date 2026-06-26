import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, mockUser, mockProject, mockIssue, setupMocks } from '../utils';
import App from '../../App';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

describe('Issue Workflow Integration', () => {
  const mockProjects = [mockProject];
  const mockIssues = [
    mockIssue,
    {
      ...mockIssue,
      id: '2',
      title: 'Feature Request',
      type: 'feature' as const,
      status: 'open' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/projects') {
        return Promise.resolve({ data: mockApiResponse.success(mockProjects) });
      }
      if (url === '/api/issues') {
        return Promise.resolve({ data: mockApiResponse.paginated(mockIssues) });
      }
      if (url.startsWith('/api/issues/')) {
        const issueId = url.split('/').pop();
        const issue = mockIssues.find(i => i.id === issueId);
        return Promise.resolve({ data: mockApiResponse.success(issue || mockIssue) });
      }
      if (url === '/api/templates') {
        return Promise.resolve({ data: mockApiResponse.success([]) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should complete full issue creation workflow', async () => {
    const user = userEvent.setup();
    
    // Mock successful issue creation
    const newIssue = {
      ...mockIssue,
      id: '3',
      title: 'New Bug Report',
      description: 'This is a new bug report'
    };
    
    mockAxios.post.mockResolvedValueOnce({ 
      data: mockApiResponse.success(newIssue) 
    });

    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: ['/issues/create']
    });

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // Fill out the form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const prioritySelect = screen.getByLabelText(/priority/i);
    const projectSelect = screen.getByLabelText(/project/i);

    await user.type(titleInput, 'New Bug Report');
    await user.type(descriptionInput, 'This is a new bug report');
    await user.selectOptions(typeSelect, 'bug');
    await user.selectOptions(prioritySelect, 'high');
    await user.selectOptions(projectSelect, mockProject.id);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/issues', {
        title: 'New Bug Report',
        description: 'This is a new bug report',
        type: 'bug',
        priority: 'high',
        projectId: mockProject.id
      });
    });

    // Should redirect to issue list or show success message
    await waitFor(() => {
      expect(screen.getByText(/issue created successfully/i)).toBeInTheDocument();
    });
  });

  it('should complete issue viewing and commenting workflow', async () => {
    const user = userEvent.setup();
    
    const mockComments = [
      {
        id: '1',
        content: 'This is a comment',
        issueId: mockIssue.id,
        authorId: mockUser.id,
        author: mockUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock issue comments API
    mockAxios.get.mockImplementation((url) => {
      if (url === `/api/issues/${mockIssue.id}/comments`) {
        return Promise.resolve({ data: mockApiResponse.success(mockComments) });
      }
      if (url === `/api/issues/${mockIssue.id}`) {
        return Promise.resolve({ data: mockApiResponse.success(mockIssue) });
      }
      return Promise.resolve({ data: mockApiResponse.success([]) });
    });

    // Mock comment creation
    const newComment = {
      id: '2',
      content: 'New comment',
      issueId: mockIssue.id,
      authorId: mockUser.id,
      author: mockUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockAxios.post.mockResolvedValueOnce({
      data: mockApiResponse.success(newComment)
    });

    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: [`/issues/${mockIssue.id}`]
    });

    // Wait for issue details to load
    await waitFor(() => {
      expect(screen.getByText(mockIssue.title)).toBeInTheDocument();
    });

    // Verify issue details are displayed
    expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
    expect(screen.getByText('This is a comment')).toBeInTheDocument();

    // Add a new comment
    const commentInput = screen.getByPlaceholderText(/add a comment/i);
    await user.type(commentInput, 'New comment');

    const submitCommentButton = screen.getByRole('button', { name: /post comment/i });
    await user.click(submitCommentButton);

    // Verify comment API call
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(`/api/issues/${mockIssue.id}/comments`, {
        content: 'New comment'
      });
    });

    // Should show the new comment
    await waitFor(() => {
      expect(screen.getByText('New comment')).toBeInTheDocument();
    });
  });

  it('should complete issue status update workflow', async () => {
    const user = userEvent.setup();
    
    const updatedIssue = {
      ...mockIssue,
      status: 'in_progress' as const
    };

    mockAxios.put.mockResolvedValueOnce({
      data: mockApiResponse.success(updatedIssue)
    });

    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: [`/issues/${mockIssue.id}`]
    });

    // Wait for issue details to load
    await waitFor(() => {
      expect(screen.getByText(mockIssue.title)).toBeInTheDocument();
    });

    // Find and click status update button/dropdown
    const statusSelect = screen.getByLabelText(/status/i);
    await user.selectOptions(statusSelect, 'in_progress');

    // Submit status change
    const updateButton = screen.getByRole('button', { name: /update status/i });
    await user.click(updateButton);

    // Verify API call
    await waitFor(() => {
      expect(mockAxios.put).toHaveBeenCalledWith(`/api/issues/${mockIssue.id}`, {
        status: 'in_progress'
      });
    });

    // Should show updated status
    await waitFor(() => {
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  it('should handle issue filtering and search workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: ['/issues']
    });

    // Wait for issues to load
    await waitFor(() => {
      expect(screen.getByText(mockIssues[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockIssues[1].title)).toBeInTheDocument();
    });

    // Apply status filter
    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'open');

    // Verify filtered API call
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          status: 'open'
        })
      });
    });

    // Apply search
    const searchInput = screen.getByPlaceholderText(/search issues/i);
    await user.type(searchInput, 'Bug');

    // Wait for debounced search
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          search: 'Bug',
          status: 'open'
        })
      });
    }, { timeout: 1000 });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(statusFilter).toHaveValue('');
      expect(searchInput).toHaveValue('');
    });
  });

  it('should handle pagination workflow', async () => {
    const user = userEvent.setup();
    
    // Mock paginated response
    const paginatedResponse = mockApiResponse.paginated(mockIssues, 1, 1);
    paginatedResponse.pagination.totalPages = 2;
    
    mockAxios.get.mockResolvedValue({
      data: paginatedResponse
    });

    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: ['/issues']
    });

    // Wait for issues to load
    await waitFor(() => {
      expect(screen.getByText(mockIssues[0].title)).toBeInTheDocument();
    });

    // Navigate to next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Verify pagination API call
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          page: 2
        })
      });
    });

    // Navigate back to previous page
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          page: 1
        })
      });
    });
  });

  it('should handle error states gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockAxios.get.mockRejectedValueOnce({
      response: { 
        data: mockApiResponse.error('Failed to fetch issues') 
      }
    });

    renderWithProviders(<App />, { 
      user: mockUser,
      initialEntries: ['/issues']
    });

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch issues/i)).toBeInTheDocument();
    });

    // Should have retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    
    // Mock successful retry
    mockAxios.get.mockResolvedValueOnce({
      data: mockApiResponse.paginated(mockIssues)
    });

    await user.click(retryButton);

    // Should show issues after retry
    await waitFor(() => {
      expect(screen.getByText(mockIssues[0].title)).toBeInTheDocument();
    });
  });

  it('should handle authentication workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<App />, { 
      user: null, // Not authenticated
      initialEntries: ['/issues']
    });

    // Should redirect to login or show login prompt
    await waitFor(() => {
      expect(screen.getByText(/sign in/i) || screen.getByText(/login/i)).toBeInTheDocument();
    });

    // Mock login
    mockAxios.post.mockResolvedValueOnce({
      data: mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      })
    });

    // Fill login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, mockUser.email);
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should redirect to issues after login
    await waitFor(() => {
      expect(screen.getByText(mockIssues[0].title)).toBeInTheDocument();
    });
  });
});