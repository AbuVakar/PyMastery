import { useState, useCallback } from 'react';

interface LoadingState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

interface UseAsyncLoadingReturn<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult>;
  isLoading: boolean;
  error: string | null;
  data: TResult | null;
}

export const useAsyncLoading = <TArgs extends unknown[], TResult>(
  asyncFunction: (...args: TArgs) => Promise<TResult>
): UseAsyncLoadingReturn<TArgs, TResult> => {
  const [state, setState] = useState<LoadingState<TResult>>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async (...args: TArgs) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      setState({
        loading: false,
        error: null,
        data: result,
      });
      return result;
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        data: null,
      });
      throw error;
    }
  }, [asyncFunction]);

  return {
    execute,
    isLoading: state.loading,
    error: state.error,
    data: state.data,
  };
};

export default useAsyncLoading;
