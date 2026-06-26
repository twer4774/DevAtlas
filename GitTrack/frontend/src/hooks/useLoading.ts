import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export const useLoading = (initialState: LoadingState = {}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({
        ...prev,
        [key]: false
      }));
    } else {
      setLoadingStates({});
    }
  }, []);

  // Async wrapper that automatically manages loading state
  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    withLoading
  };
};

// Hook for simple boolean loading state
export const useSimpleLoading = (initialLoading: boolean = false) => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading
  };
};