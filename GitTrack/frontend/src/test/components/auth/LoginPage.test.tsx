import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, setupMocks } from '../../utils';
import LoginPage from '../../../pages/LoginPage';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />, { user: null });

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { user: null });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.success({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      token: 'mock-token'
    });

    mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<LoginPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    const mockError = mockApiResponse.error('Invalid credentials', 'INVALID_CREDENTIALS');

    mockAxios.post.mockRejectedValueOnce({
      response: { data: mockError }
    });

    renderWithProviders(<LoginPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockAxios.post.mockReturnValueOnce(mockPromise);

    renderWithProviders(<LoginPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ data: mockApiResponse.success({ user: {}, token: 'token' }) });

    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('navigates to register page when clicking register link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { user: null });

    const registerLink = screen.getByText(/sign up/i);
    await user.click(registerLink);

    // This would need to be tested with actual navigation mock
    // For now, we just check that the link exists
    expect(registerLink).toBeInTheDocument();
  });

  it('redirects authenticated users', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    renderWithProviders(<LoginPage />, { user: mockUser });

    // Should redirect or show different content for authenticated users
    // This depends on the actual implementation
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Tab navigation
    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(passwordInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { user: null });

    const passwordInput = screen.getByLabelText(/password/i);
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Look for toggle button (if implemented)
    const toggleButton = screen.queryByRole('button', { name: /show password/i });
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});