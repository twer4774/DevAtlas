import toast, { type ToastOptions } from 'react-hot-toast'

// Default toast options
const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

// Success toast
export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      background: '#10B981',
      color: '#FFFFFF',
    },
    iconTheme: {
      primary: '#FFFFFF',
      secondary: '#10B981',
    },
  });
};

// Error toast
export const showError = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    duration: 6000, // Longer duration for errors
    ...options,
    style: {
      background: '#EF4444',
      color: '#FFFFFF',
    },
    iconTheme: {
      primary: '#FFFFFF',
      secondary: '#EF4444',
    },
  });
};

// Warning toast
export const showWarning = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#FFFFFF',
    },
  });
};

// Info toast
export const showInfo = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultOptions,
    ...options,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#FFFFFF',
    },
  });
};

// Loading toast
export const showLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
    style: {
      background: '#6B7280',
      color: '#FFFFFF',
    },
  });
};

// Promise toast
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
) => {
  return toast.promise(promise, messages, {
    ...defaultOptions,
    ...options,
    success: {
      style: {
        background: '#10B981',
        color: '#FFFFFF',
      },
    },
    error: {
      style: {
        background: '#EF4444',
        color: '#FFFFFF',
      },
    },
    loading: {
      style: {
        background: '#6B7280',
        color: '#FFFFFF',
      },
    },
  });
};

// API Error handler
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred') => {
  let message = defaultMessage;
  
  if (error?.response?.data?.error?.message) {
    message = error.response.data.error.message;
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  showError(message);
  return message;
};

// Network error handler
export const handleNetworkError = (error: any) => {
  if (!navigator.onLine) {
    showError('No internet connection. Please check your network and try again.');
    return;
  }
  
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    showError('Network error. Please check your connection and try again.');
    return;
  }
  
  if (error?.response?.status === 0) {
    showError('Unable to connect to the server. Please try again later.');
    return;
  }
  
  handleApiError(error, 'Network error occurred');
};

// Validation error handler
export const handleValidationError = (errors: any) => {
  if (Array.isArray(errors)) {
    errors.forEach((error: any) => {
      showError(error.message || 'Validation error');
    });
  } else if (errors?.details?.validationErrors) {
    errors.details.validationErrors.forEach((error: any) => {
      showError(`${error.field}: ${error.message}`);
    });
  } else {
    showError('Validation failed. Please check your input.');
  }
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Dismiss specific toast
export const dismiss = (toastId: string) => {
  toast.dismiss(toastId);
};