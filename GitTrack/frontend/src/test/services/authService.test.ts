import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService';
import { mockAxios, mockApiResponse, mockUser, setupMocks } from '../utils';

// Setup mocks
setupMocks();

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token'
      });
    });

    it('should throw error on invalid credentials', async () => {
      const mockError = mockApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = mockApiResponse.success({
        user: mockUser,
        token: 'mock-token'
      });

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.register('test@example.com', 'password123', 'Test User');

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token'
      });
    });

    it('should throw error when email already exists', async () => {
      const mockError = mockApiResponse.error('Email already exists', 'USER_EXISTS');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        authService.register('existing@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already exists');
    });

    it('should handle validation errors', async () => {
      const mockError = mockApiResponse.error('Validation failed', 'VALIDATION_ERROR');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        authService.register('invalid-email', '123', 'A')
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user with valid token', async () => {
      const mockResponse = mockApiResponse.success(mockUser);
      mockAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.getCurrentUser();

      expect(mockAxios.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should throw error with invalid token', async () => {
      const mockError = mockApiResponse.error('Invalid token', 'INVALID_TOKEN');

      mockAxios.get.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(authService.getCurrentUser()).rejects.toThrow('Network error. Please try again.');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = mockApiResponse.success({ message: 'Logout successful' });
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

      await authService.logout();

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should handle logout errors gracefully', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw error
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should extract error message from API response', async () => {
      const mockError = mockApiResponse.error('Custom error message', 'CUSTOM_ERROR');

      mockAxios.post.mockRejectedValueOnce({
        response: { data: mockError }
      });

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Custom error message');
    });

    it('should handle network errors without response', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Network Error');
    });

    it('should handle unexpected response format', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { data: 'Unexpected format' }
      });

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow();
    });
  });
});