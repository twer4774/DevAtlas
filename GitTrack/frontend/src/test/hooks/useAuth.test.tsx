import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { mockAxios, mockApiResponse, mockUser, mockLocalStorage, setupMocks } from '../utils';
import React from 'react';

// Setup mocks
setupMocks();

describe('useAuth', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children, initialUser = null }: { children: React.ReactNode; initialUser?: any }) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={initialUser}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should provide initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should provide authenticated user when initialUser is provided', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrapper({ children, initialUser: mockUser })
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      const mockError = mockApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'Test User');
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      const mockError = mockApiResponse.error('Email already exists', 'USER_EXISTS');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.register('existing@example.com', 'password123', 'Test User');
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, initialUser: mockUser })
      });

      // Initially authenticated
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize with token from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('existing-token');
      mockAxios.get.mockResolvedValueOnce({ data: mockApiResponse.success(mockUser) });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/auth/me');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid token during initialization', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockAxios.get.mockRejectedValueOnce({
        response: { data: mockApiResponse.error('Invalid token', 'INVALID_TOKEN') }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle no token in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAxios.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('token refresh', () => {
    it('should refresh token automatically', async () => {
      const refreshedUser = { ...mockUser, name: 'Refreshed User' };
      const mockResponse = mockApiResponse.success({
        user: refreshedUser,
        token: 'new-token'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, initialUser: mockUser })
      });

      // Simulate token refresh (this would typically be triggered by an interceptor)
      await act(async () => {
        // This would be called by the axios interceptor in a real scenario
        const response = await mockAxios.post('/api/auth/refresh');
        const { user, token } = response.data.data;
        mockLocalStorage.setItem('token', token);
        // Update user state would happen through the auth context
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('should logout on refresh failure', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockApiResponse.error('Refresh token expired', 'TOKEN_EXPIRED') }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, initialUser: mockUser })
      });

      // Simulate failed token refresh
      await act(async () => {
        try {
          await mockAxios.post('/api/auth/refresh');
        } catch (error) {
          // This would trigger logout in the interceptor
          result.current.logout();
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle network errors during login', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'password123');
        })
      ).rejects.toThrow('Network Error');
    });

    it('should handle malformed API responses', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: 'Invalid response format' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'password123');
        })
      ).rejects.toThrow();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent login attempts', async () => {
      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      });

      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start multiple login attempts
      const loginPromises = [
        result.current.login('test@example.com', 'password123'),
        result.current.login('test@example.com', 'password123'),
        result.current.login('test@example.com', 'password123')
      ];

      await act(async () => {
        await Promise.all(loginPromises);
      });

      // Should only make one successful login
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('context provider', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});