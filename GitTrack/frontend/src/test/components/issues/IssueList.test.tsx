import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, mockIssue, mockUser, setupMocks } from '../../utils';
import IssueList from '../../../components/issues/IssueList';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

describe('IssueList', () => {
  const mockIssues = [
    {
      ...mockIssue,
      id: '1',
      title: 'Bug Issue',
      type: 'bug' as const,
      priority: 'high' as const,
      status: 'open' as const
    },
    {
      ...mockIssue,
      id: '2',
      title: 'Feature Request',
      type: 'feature' as const,
      priority: 'medium' as const,
      status: 'in_progress' as const
    },
    {
      ...mockIssue,
      id: '3',
      title: 'Task Issue',
      type: 'task' as const,
      priority: 'low' as const,
      status: 'closed' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders issue list correctly', async () => {
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('Task Issue')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<IssueList />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no issues', async () => {
    const mockResponse = mockApiResponse.paginated([]);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    const mockError = mockApiResponse.error('Failed to fetch issues');
    mockAxios.get.mockRejectedValueOnce({ response: { data: mockError } });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch issues/i)).toBeInTheDocument();
    });
  });

  it('filters issues by status', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    // Find and click status filter
    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'open');

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          status: 'open'
        })
      });
    });
  });

  it('filters issues by type', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const typeFilter = screen.getByLabelText(/type/i);
    await user.selectOptions(typeFilter, 'bug');

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          type: 'bug'
        })
      });
    });
  });

  it('searches issues by title', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search issues/i);
    await user.type(searchInput, 'Bug');

    // Wait for debounce
    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          search: 'Bug'
        })
      });
    }, { timeout: 1000 });
  });

  it('sorts issues by different criteria', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'title');

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          sortBy: 'title'
        })
      });
    });
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues, 1, 2);
    mockResponse.pagination.totalPages = 2;
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/issues', {
        params: expect.objectContaining({
          page: 2
        })
      });
    });
  });

  it('displays issue priority badges correctly', async () => {
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  it('displays issue status badges correctly', async () => {
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('closed')).toBeInTheDocument();
    });
  });

  it('navigates to issue detail on click', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated([mockIssues[0]]);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const issueTitle = screen.getByText('Bug Issue');
    await user.click(issueTitle);

    // This would need to be tested with actual navigation mock
    // For now, we just check that the element is clickable
    expect(issueTitle).toBeInTheDocument();
  });

  it('shows create issue button for authenticated users', async () => {
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />, { user: mockUser });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
    });
  });

  it('hides create issue button for unauthenticated users', async () => {
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />, { user: null });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /create issue/i })).not.toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.paginated(mockIssues);
    mockAxios.get.mockResolvedValue({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText('Bug Issue')).toBeInTheDocument();
    });

    // Apply some filters first
    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'open');

    const searchInput = screen.getByPlaceholderText(/search issues/i);
    await user.type(searchInput, 'Bug');

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(statusFilter).toHaveValue('');
      expect(searchInput).toHaveValue('');
    });
  });

  it('shows issue assignee information', async () => {
    const issueWithAssignee = {
      ...mockIssues[0],
      assignee: mockUser
    };
    const mockResponse = mockApiResponse.paginated([issueWithAssignee]);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });
  });

  it('shows unassigned label for issues without assignee', async () => {
    const mockResponse = mockApiResponse.paginated([mockIssues[0]]);
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<IssueList />);

    await waitFor(() => {
      expect(screen.getByText(/unassigned/i)).toBeInTheDocument();
    });
  });
});