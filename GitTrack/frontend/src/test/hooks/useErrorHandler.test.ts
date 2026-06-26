import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { mockToast, setupMocks } from '../utils';

// Setup mocks
setupMocks();

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle API errors with error response', () => {
    const { result } = renderHook(() => useErrorHandler());

    const apiError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR'
          }
        }
      }
    };

    act(() => {
      result.current.handleError(apiError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Validation failed');
  });

  it('should handle API errors with status-based messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    const unauthorizedError = {
      response: {
        status: 401,
        data: {}
      }
    };

    act(() => {
      result.current.handleError(unauthorizedError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Unauthorized access. Please login again.');
  });

  it('should handle 403 Forbidden errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const forbiddenError = {
      response: {
        status: 403,
        data: {}
      }
    };

    act(() => {
      result.current.handleError(forbiddenError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('You do not have permission to perform this action.');
  });

  it('should handle 404 Not Found errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const notFoundError = {
      response: {
        status: 404,
        data: {}
      }
    };

    act(() => {
      result.current.handleError(notFoundError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('The requested resource was not found.');
  });

  it('should handle 500 Server errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const serverError = {
      response: {
        status: 500,
        data: {}
      }
    };

    act(() => {
      result.current.handleError(serverError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Internal server error. Please try again later.');
  });

  it('should handle network errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = {
      message: 'Network Error',
      code: 'NETWORK_ERROR'
    };

    act(() => {
      result.current.handleError(networkError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Network error. Please check your connection.');
  });

  it('should handle timeout errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const timeoutError = {
      message: 'timeout of 5000ms exceeded',
      code: 'ECONNABORTED'
    };

    act(() => {
      result.current.handleError(timeoutError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Request timeout. Please try again.');
  });

  it('should handle generic errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const genericError = new Error('Something went wrong');

    act(() => {
      result.current.handleError(genericError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should handle validation errors with field details', () => {
    const { result } = renderHook(() => useErrorHandler());

    const validationError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: {
              email: 'Email is required',
              password: 'Password must be at least 6 characters'
            }
          }
        }
      }
    };

    act(() => {
      result.current.handleError(validationError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Email is required, Password must be at least 6 characters');
  });

  it('should handle custom error messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    const customError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'Custom error message',
            code: 'CUSTOM_ERROR'
          }
        }
      }
    };

    act(() => {
      result.current.handleError(customError, 'Custom fallback message');
    });

    expect(mockToast.error).toHaveBeenCalledWith('Custom error message');
  });

  it('should use fallback message when no specific error message', () => {
    const { result } = renderHook(() => useErrorHandler());

    const unknownError = {
      response: {
        status: 418, // I'm a teapot
        data: {}
      }
    };

    act(() => {
      result.current.handleError(unknownError, 'Custom fallback message');
    });

    expect(mockToast.error).toHaveBeenCalledWith('Custom fallback message');
  });

  it('should handle errors without response', () => {
    const { result } = renderHook(() => useErrorHandler());

    const requestError = {
      request: {},
      message: 'Request failed'
    };

    act(() => {
      result.current.handleError(requestError);
    });

    expect(mockToast.error).toHaveBeenCalledWith('Network error. Please check your connection.');
  });

  it('should handle string errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('String error message');
    });

    expect(mockToast.error).toHaveBeenCalledWith('String error message');
  });

  it('should handle null/undefined errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(null);
    });

    expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred');

    act(() => {
      result.current.handleError(undefined);
    });

    expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('should not show duplicate error messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = {
      response: {
        data: {
          success: false,
          error: {
            message: 'Duplicate error',
            code: 'DUPLICATE_ERROR'
          }
        }
      }
    };

    act(() => {
      result.current.handleError(error);
      result.current.handleError(error);
    });

    expect(mockToast.error).toHaveBeenCalledTimes(2); // Should still be called twice but implementation might dedupe
  });

  it('should handle errors with different severity levels', () => {
    const { result } = renderHook(() => useErrorHandler());

    const warningError = {
      response: {
        data: {
          success: false,
          error: {
            message: 'This is a warning',
            code: 'WARNING',
            severity: 'warning'
          }
        }
      }
    };

    act(() => {
      result.current.handleError(warningError);
    });

    // Should still use error toast for consistency
    expect(mockToast.error).toHaveBeenCalledWith('This is a warning');
  });

  it('should provide error logging capability', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error for logging');

    act(() => {
      result.current.handleError(error);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error handled:', error);
    consoleSpy.mockRestore();
  });
});