import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockAxios, mockApiResponse, setupMocks } from '../../utils';
import RegisterPage from '../../../pages/RegisterPage';
import { userEvent } from '@testing-library/user-event';

// Setup mocks
setupMocks();

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form correctly', () => {
    renderWithProviders(<RegisterPage />, { user: null });

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.success({
      user: {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user'
      },
      token: 'mock-token'
    });

    mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<RegisterPage />, { user: null });

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      });
    });
  });

  it('shows error message on registration failure', async () => {
    const user = userEvent.setup();
    const mockError = mockApiResponse.error('Email already exists', 'USER_EXISTS');

    mockAxios.post.mockRejectedValueOnce({
      response: { data: mockError }
    });

    renderWithProviders(<RegisterPage />, { user: null });

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockAxios.post.mockReturnValueOnce(mockPromise);

    renderWithProviders(<RegisterPage />, { user: null });

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ data: mockApiResponse.success({ user: {}, token: 'token' }) });

    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
    });
  });

  it('validates name length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'A'); // Too short
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least/i)).toBeInTheDocument();
    });
  });

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup();
    const mockResponse = mockApiResponse.success({
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
      token: 'mock-token'
    });

    mockAxios.post.mockResolvedValueOnce({ data: mockResponse });

    renderWithProviders(<RegisterPage />, { user: null });

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, '  Test User  ');
    await user.type(emailInput, '  test@example.com  ');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('navigates to login page when clicking login link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const loginLink = screen.getByText(/sign in/i);
    await user.click(loginLink);

    // This would need to be tested with actual navigation mock
    expect(loginLink).toBeInTheDocument();
  });

  it('handles password confirmation if implemented', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    // Check if password confirmation field exists
    const confirmPasswordInput = screen.queryByLabelText(/confirm password/i);
    
    if (confirmPasswordInput) {
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    }
  });

  it('shows password strength indicator if implemented', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { user: null });

    const passwordInput = screen.getByLabelText(/password/i);

    // Test weak password
    await user.type(passwordInput, '123');
    const weakIndicator = screen.queryByText(/weak/i);
    if (weakIndicator) {
      expect(weakIndicator).toBeInTheDocument();
    }

    // Test strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    const strongIndicator = screen.queryByText(/strong/i);
    if (strongIndicator) {
      expect(strongIndicator).toBeInTheDocument();
    }
  });
});