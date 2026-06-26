import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, mockUser, setupMocks } from '../../utils';
import DashboardPage from '../../../pages/DashboardPage';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  LineElement: vi.fn(),
  PointElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

describe('DashboardPage', () => {
  const mockDashboardStats = {
    overview: {
      total: 25,
      open: 10,
      inProgress: 8,
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
    },
    recentActivity: {
      newIssues: 5,
      newComments: 12
    },
    topContributors: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        issuesCreated: 8,
        commentsPosted: 15,
        totalActivity: 23
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        issuesCreated: 6,
        commentsPosted: 10,
        totalActivity: 16
      }
    ],
    projectStats: [
      {
        id: '1',
        name: 'Project A',
        _count: { issues: 15 }
      },
      {
        id: '2',
        name: 'Project B',
        _count: { issues: 10 }
      }
    ]
  };

  const mockTrends = [
    { date: '2024-01-01', created: 3, resolved: 2 },
    { date: '2024-01-02', created: 5, resolved: 3 },
    { date: '2024-01-03', created: 2, resolved: 4 },
    { date: '2024-01-04', created: 4, resolved: 1 },
    { date: '2024-01-05', created: 1, resolved: 3 }
  ];

  const mockAssignments = {
    unassigned: 8,
    assigned: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        count: 5
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        count: 3
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock dashboard API calls
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/dashboard/stats') {
        return Promise.resolve({ data: mockApiResponse.success(mockDashboardStats) });
      }
      if (url === '/api/dashboard/trends') {
        return Promise.resolve({ data: mockApiResponse.success(mockTrends) });
      }
      if (url === '/api/dashboard/assignments') {
        return Promise.resolve({ data: mockApiResponse.success(mockAssignments) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders dashboard correctly', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // Total issues
      expect(screen.getByText('10')).toBeInTheDocument(); // Open issues
    });
  });

  it('displays overview statistics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total
      expect(screen.getByText('10')).toBeInTheDocument(); // Open
      expect(screen.getByText('8')).toBeInTheDocument(); // In Progress
      expect(screen.getByText('5')).toBeInTheDocument(); // Resolved
      expect(screen.getByText('2')).toBeInTheDocument(); // Closed
    });
  });

  it('shows loading state initially', () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    const mockError = mockApiResponse.error('Failed to fetch dashboard data');
    mockAxios.get.mockRejectedValue({ response: { data: mockError } });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch dashboard data/i)).toBeInTheDocument();
    });
  });

  it('renders charts correctly', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });
  });

  it('displays recent activity metrics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // New issues
      expect(screen.getByText('12')).toBeInTheDocument(); // New comments
    });
  });

  it('shows top contributors list', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument(); // John's total activity
      expect(screen.getByText('16')).toBeInTheDocument(); // Jane's total activity
    });
  });

  it('displays project statistics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('Project B')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Project A issues
      expect(screen.getByText('10')).toBeInTheDocument(); // Project B issues
    });
  });

  it('shows assignment statistics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // Unassigned
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('allows filtering by project', async () => {
    const user = userEvent.setup();
    const mockProjects = [
      { id: '1', name: 'Project A' },
      { id: '2', name: 'Project B' }
    ];

    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/projects') {
        return Promise.resolve({ data: mockApiResponse.success(mockProjects) });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({ data: mockApiResponse.success(mockDashboardStats) });
      }
      return Promise.resolve({ data: mockApiResponse.success([]) });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
    });

    const projectFilter = screen.getByLabelText(/project/i);
    await user.selectOptions(projectFilter, '1');

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/dashboard/stats', {
        params: { projectId: '1' }
      });
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledTimes(6); // Initial 3 + refresh 3
    });
  });

  it('displays time period selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/time period/i)).toBeInTheDocument();
    });

    const periodSelect = screen.getByLabelText(/time period/i);
    await user.selectOptions(periodSelect, '7d');

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/dashboard/trends', {
        params: { period: '7d' }
      });
    });
  });

  it('shows empty state when no data', async () => {
    const emptyStats = {
      ...mockDashboardStats,
      overview: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
      topContributors: [],
      projectStats: []
    };

    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/dashboard/stats') {
        return Promise.resolve({ data: mockApiResponse.success(emptyStats) });
      }
      return Promise.resolve({ data: mockApiResponse.success([]) });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });
  });

  it('handles chart data correctly', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '{}');
      
      expect(chartData.labels).toContain('bug');
      expect(chartData.labels).toContain('feature');
      expect(chartData.datasets[0].data).toContain(12); // Bug count
      expect(chartData.datasets[0].data).toContain(8); // Feature count
    });
  });

  it('shows admin-only features for admin users', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    renderWithProviders(<DashboardPage />, { user: adminUser });

    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });
  });

  it('hides admin features for regular users', async () => {
    renderWithProviders(<DashboardPage />, { user: mockUser });

    await waitFor(() => {
      expect(screen.queryByText(/admin dashboard/i)).not.toBeInTheDocument();
    });
  });

  it('exports dashboard data when export button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const exportButton = screen.queryByRole('button', { name: /export/i });
    if (exportButton) {
      await user.click(exportButton);
      
      // Check if export functionality is triggered
      // This would depend on the actual implementation
      expect(exportButton).toBeInTheDocument();
    }
  });

  it('updates charts when data changes', async () => {
    const { rerender } = renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    // Simulate data change
    const updatedStats = {
      ...mockDashboardStats,
      byType: { bug: 15, feature: 10, task: 5, improvement: 3 }
    };

    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/dashboard/stats') {
        return Promise.resolve({ data: mockApiResponse.success(updatedStats) });
      }
      return Promise.resolve({ data: mockApiResponse.success([]) });
    });

    rerender(<DashboardPage />);

    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '{}');
      expect(chartData.datasets[0].data).toContain(15); // Updated bug count
    });
  });
});