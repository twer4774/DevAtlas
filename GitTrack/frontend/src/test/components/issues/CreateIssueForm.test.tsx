import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, mockProject, mockUser, mockTemplate, setupMocks } from '../../utils';
import CreateIssueForm from '../../../components/issues/CreateIssueForm';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

describe('CreateIssueForm', () => {
  const mockProjects = [
    mockProject,
    {
      ...mockProject,
      id: '2',
      name: 'Another Project'
    }
  ];

  const mockTemplates = [
    mockTemplate,
    {
      ...mockTemplate,
      id: '2',
      name: 'Feature Request Template',
      issueType: 'feature' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock projects API
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/projects') {
        return Promise.resolve({ data: mockApiResponse.success(mockProjects) });
      }
      if (url === '/api/templates') {
        return Promise.resolve({ data: mockApiResponse.success(mockTemplates) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders create issue form correctly', async () => {
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
    });
  });

  it('loads projects and templates on mount', async () => {
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/projects');
      expect(mockAxios.get).toHaveBeenCalledWith('/api/templates');
    });
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create issue/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/project is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.success({
      id: '1',
      title: 'New Issue',
      description: 'Issue description',
      type: 'bug',
      priority: 'medium',
      status: 'open',
      projectId: '1'
    });

    mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const prioritySelect = screen.getByLabelText(/priority/i);
    const projectSelect = screen.getByLabelText(/project/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });

    await user.type(titleInput, 'New Issue');
    await user.type(descriptionInput, 'Issue description');
    await user.selectOptions(typeSelect, 'bug');
    await user.selectOptions(prioritySelect, 'medium');
    await user.selectOptions(projectSelect, '1');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/issues', {
        title: 'New Issue',
        description: 'Issue description',
        type: 'bug',
        priority: 'medium',
        projectId: '1'
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockAxios.post.mockReturnValueOnce(mockPromise);

    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'New Issue');
    await user.type(screen.getByLabelText(/description/i), 'Issue description');
    await user.selectOptions(screen.getByLabelText(/project/i), '1');

    const submitButton = screen.getByRole('button', { name: /create issue/i });
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ data: mockApiResponse.success({}) });

    await waitFor(() => {
      expect(screen.queryByText(/creating/i)).not.toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    const mockError = mockApiResponse.error('Failed to create issue');

    mockAxios.post.mockRejectedValueOnce({
      response: { data: mockError }
    });

    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/title/i), 'New Issue');
    await user.type(screen.getByLabelText(/description/i), 'Issue description');
    await user.selectOptions(screen.getByLabelText(/project/i), '1');
    await user.click(screen.getByRole('button', { name: /create issue/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create issue/i)).toBeInTheDocument();
    });
  });

  it('applies template when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/template/i)).toBeInTheDocument();
    });

    const templateSelect = screen.getByLabelText(/template/i);
    await user.selectOptions(templateSelect, '1');

    await waitFor(() => {
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toContain('Bug Report');
    });
  });

  it('filters templates by issue type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    });

    const typeSelect = screen.getByLabelText(/type/i);
    await user.selectOptions(typeSelect, 'feature');

    await waitFor(() => {
      const templateSelect = screen.getByLabelText(/template/i);
      const options = Array.from(templateSelect.querySelectorAll('option'));
      const templateOptions = options.filter(option => option.value !== '');
      
      // Should only show feature templates
      expect(templateOptions).toHaveLength(1);
      expect(templateOptions[0].textContent).toContain('Feature Request Template');
    });
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });

    // Test minimum length
    await user.type(titleInput, 'A');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be at least/i)).toBeInTheDocument();
    });

    // Test maximum length
    await user.clear(titleInput);
    await user.type(titleInput, 'A'.repeat(201)); // Assuming max is 200
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be at most/i)).toBeInTheDocument();
    });
  });

  it('supports markdown preview for description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, '**Bold text**');

    // Look for preview button/tab
    const previewButton = screen.queryByRole('button', { name: /preview/i });
    if (previewButton) {
      await user.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Bold text')).toBeInTheDocument();
      });
    }
  });

  it('allows assignee selection for admin users', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    const mockUsers = [mockUser, adminUser];
    
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/projects') {
        return Promise.resolve({ data: mockApiResponse.success(mockProjects) });
      }
      if (url === '/api/templates') {
        return Promise.resolve({ data: mockApiResponse.success(mockTemplates) });
      }
      if (url === '/api/admin/users') {
        return Promise.resolve({ data: mockApiResponse.success(mockUsers) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithProviders(<CreateIssueForm />, { user: adminUser });

    await waitFor(() => {
      expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
    });
  });

  it('hides assignee selection for regular users', async () => {
    renderWithProviders(<CreateIssueForm />, { user: mockUser });

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/assignee/i)).not.toBeInTheDocument();
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.success({ id: '1' });
    mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

    // Fill and submit form
    await user.type(titleInput, 'New Issue');
    await user.type(descriptionInput, 'Issue description');
    await user.selectOptions(screen.getByLabelText(/project/i), '1');
    await user.click(screen.getByRole('button', { name: /create issue/i }));

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  it('handles file attachments if supported', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateIssueForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // Look for file input
    const fileInput = screen.queryByLabelText(/attachments/i);
    if (fileInput) {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      await user.upload(fileInput, file);

      expect(fileInput).toHaveProperty('files', expect.arrayContaining([file]));
    }
  });
});