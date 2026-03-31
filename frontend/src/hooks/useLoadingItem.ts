import { useState, useCallback } from 'react';

type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseLoadingItemReturn<TData = unknown, TError = unknown> {
  setLoading: (status: LoadingStatus, data?: TData | TError) => void;
  reset: () => void;
  loading: boolean;
  error: TError | null;
  data: TData | null;
}

export const useLoadingItem = <TData = unknown, TError = unknown>(
  _itemId: string
): UseLoadingItemReturn<TData, TError> => {
  const [state, setState] = useState<{
    loading: boolean;
    error: TError | null;
    data: TData | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const setLoading = useCallback((status: LoadingStatus, data?: TData | TError) => {
    setState((previousState) => ({
      loading: status === 'loading',
      error: status === 'error' ? (data as TError) : null,
      data: status === 'success' ? (data as TData) : previousState.data,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    setLoading,
    reset,
    loading: state.loading,
    error: state.error,
    data: state.data,
  };
};

export default useLoadingItem;
