import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError, handleNetworkError, handleValidationError } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: {
        code: string;
        message: string;
        details?: any;
      };
    };
  };
  message?: string;
  code?: string;
}

export const useErrorHandler = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleError = useCallback((error: ApiError, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    // Handle network errors
    if (!error.response) {
      handleNetworkError(error);
      return;
    }

    const { status, data } = error.response;
    const errorData = data?.error;

    switch (status) {
      case 400:
        if (errorData?.code === 'VALIDATION_ERROR') {
          handleValidationError(errorData);
        } else {
          handleApiError(error, 'Invalid request. Please check your input.');
        }
        break;

      case 401:
        // Unauthorized - redirect to login
        if (errorData?.code === 'TOKEN_EXPIRED') {
          handleApiError(error, 'Your session has expired. Please log in again.');
          logout();
          navigate('/login');
        } else {
          handleApiError(error, 'Authentication required. Please log in.');
          navigate('/login');
        }
        break;

      case 403:
        // Forbidden
        handleApiError(error, 'You do not have permission to perform this action.');
        break;

      case 404:
        // Not found
        handleApiError(error, 'The requested resource was not found.');
        break;

      case 409:
        // Conflict
        handleApiError(error, 'This action conflicts with existing data.');
        break;

      case 413:
        // Payload too large
        handleApiError(error, 'The file or data is too large.');
        break;

      case 422:
        // Unprocessable entity
        if (errorData?.details?.validationErrors) {
          handleValidationError(errorData);
        } else {
          handleApiError(error, 'The data provided is invalid.');
        }
        break;

      case 429:
        // Too many requests
        handleApiError(error, 'Too many requests. Please wait a moment and try again.');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        handleApiError(error, 'Server error. Please try again later.');
        break;

      default:
        handleApiError(error, 'An unexpected error occurred.');
    }
  }, [navigate, logout]);

  // Specific error handlers
  const handleAuthError = useCallback((error: ApiError) => {
    handleError(error, 'authentication');
  }, [handleError]);

  const handleFormError = useCallback((error: ApiError) => {
    handleError(error, 'form submission');
  }, [handleError]);

  const handleApiCallError = useCallback((error: ApiError, operation?: string) => {
    handleError(error, operation || 'API call');
  }, [handleError]);

  return {
    handleError,
    handleAuthError,
    handleFormError,
    handleApiCallError
  };
};