import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock user for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockAdmin = {
  id: '2',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock project
export const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  githubRepoUrl: null,
  githubToken: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock issue
export const mockIssue = {
  id: '1',
  title: 'Test Issue',
  description: 'A test issue description',
  type: 'bug' as const,
  priority: 'medium' as const,
  status: 'open' as const,
  projectId: '1',
  creatorId: '1',
  assigneeId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creator: mockUser,
  assignee: null,
  project: mockProject,
  comments: [],
  attachments: [],
  _count: {
    comments: 0,
    attachments: 0
  }
};

// Mock comment
export const mockComment = {
  id: '1',
  content: 'Test comment',
  issueId: '1',
  authorId: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: mockUser
};

// Mock template
export const mockTemplate = {
  id: '1',
  name: 'Bug Report Template',
  issueType: 'bug' as const,
  content: '## Bug Report\n\n**Description:**\n\n**Steps to Reproduce:**',
  createdBy: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creator: mockUser
};

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: typeof mockUser | null;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    user = mockUser,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API responses
export const mockApiResponse = {
  success: (data: any) => ({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }),
  error: (message: string, code = 'ERROR') => ({
    success: false,
    error: {
      message,
      code,
      details: null
    },
    timestamp: new Date().toISOString()
  }),
  paginated: (data: any[], page = 1, limit = 10) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit)
    },
    timestamp: new Date().toISOString()
  })
};

// Mock axios
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  create: vi.fn(() => mockAxios),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn()
    },
    response: {
      use: vi.fn(),
      eject: vi.fn()
    }
  }
};

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock toast
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn()
};

// Setup mocks
export function setupMocks() {
  // Mock axios
  vi.mock('axios', () => ({
    default: mockAxios,
    create: vi.fn(() => mockAxios)
  }));

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Mock toast
  vi.mock('react-hot-toast', () => ({
    default: mockToast,
    toast: mockToast
  }));

  // Mock react-router-dom navigate
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate
    };
  });

  return {
    mockAxios,
    mockLocalStorage,
    mockToast,
    mockNavigate
  };
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create mock file
export function createMockFile(name: string, size: number, type: string) {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  return file;
}

// Mock chart.js
export const mockChart = {
  Chart: vi.fn(),
  registerables: []
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';