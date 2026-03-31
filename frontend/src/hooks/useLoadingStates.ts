/**
 * Loading States Hooks and Context for PyMastery
 * Provides global and component-level loading state management
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Types
export interface LoadingItem {
  id: string;
  state: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  progress?: number;
  timestamp: number;
  category?: string;
}

export interface LoadingContextType {
  loadingItems: Map<string, LoadingItem>;
  globalLoading: boolean;
  addLoading: (id: string, options?: Partial<LoadingItem>) => void;
  updateLoading: (id: string, updates: Partial<LoadingItem>) => void;
  removeLoading: (id: string) => void;
  clearLoading: () => void;
  getLoadingByCategory: (category: string) => LoadingItem[];
  getLoadingState: (id: string) => 'idle' | 'loading' | 'success' | 'error' | undefined;
}

// Action types
type LoadingAction =
  | { type: 'ADD_LOADING'; payload: LoadingItem }
  | { type: 'UPDATE_LOADING'; payload: { id: string; updates: Partial<LoadingItem> } }
  | { type: 'REMOVE_LOADING'; payload: string }
  | { type: 'CLEAR_LOADING' };

// Reducer
const loadingReducer = (state: Map<string, LoadingItem>, action: LoadingAction): Map<string, LoadingItem> => {
  switch (action.type) {
    case 'ADD_LOADING':
      return new Map(state).set(action.payload.id, action.payload);
    
    case 'UPDATE_LOADING': {
      const { id, updates } = action.payload;
      const existing = state.get(id);
      if (existing) {
        return new Map(state).set(id, { ...existing, ...updates });
      }
      return state;
    }
    
    case 'REMOVE_LOADING': {
      const newState = new Map(state);
      newState.delete(action.payload);
      return newState;
    }
    
    case 'CLEAR_LOADING':
      return new Map();
    
    default:
      return state;
  }
};

// Context
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Provider Component
export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingItems, dispatch] = useReducer(loadingReducer, new Map());
  
  const globalLoading = Array.from(loadingItems.values()).some(
    item => item.state === 'loading'
  );
  
  const addLoading = useCallback((id: string, options: Partial<LoadingItem> = {}) => {
    const loadingItem: LoadingItem = {
      id,
      state: 'loading',
      timestamp: Date.now(),
      ...options
    };
    
    dispatch({ type: 'ADD_LOADING', payload: loadingItem });
  }, []);
  
  const updateLoading = useCallback((id: string, updates: Partial<LoadingItem>) => {
    dispatch({ type: 'UPDATE_LOADING', payload: { id, updates } });
  }, []);
  
  const removeLoading = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LOADING', payload: id });
  }, []);
  
  const clearLoading = useCallback(() => {
    dispatch({ type: 'CLEAR_LOADING' });
  }, []);
  
  const getLoadingByCategory = useCallback((category: string) => {
    return Array.from(loadingItems.values()).filter(
      item => item.category === category
    );
  }, [loadingItems]);
  
  const getLoadingState = useCallback((id: string) => {
    const item = loadingItems.get(id);
    return item?.state;
  }, [loadingItems]);
  
  const value: LoadingContextType = {
    loadingItems,
    globalLoading,
    addLoading,
    updateLoading,
    removeLoading,
    clearLoading,
    getLoadingByCategory,
    getLoadingState
  };
  
  return React.createElement(
    LoadingContext.Provider,
    { value },
    children
  );
};

// Hook to use loading context
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Hook for managing a single loading state
export const useLoadingItem = (
  id: string,
  options: Partial<LoadingItem> = {}
) => {
  const { addLoading, updateLoading, removeLoading, getLoadingState } = useLoading();
  
  const setLoading = useCallback((state: 'idle' | 'loading' | 'success' | 'error', updates?: Partial<LoadingItem>) => {
    const currentState = getLoadingState(id);
    
    if (currentState === undefined) {
      addLoading(id, { ...options, state, ...updates });
    } else {
      updateLoading(id, { state, ...updates });
    }
  }, [addLoading, updateLoading, getLoadingState, id, options]);
  
  const setMessage = useCallback((message: string) => {
    updateLoading(id, { message });
  }, [updateLoading, id]);
  
  const setProgress = useCallback((progress: number) => {
    updateLoading(id, { progress });
  }, [updateLoading, id]);
  
  const complete = useCallback(() => {
    updateLoading(id, { state: 'success' });
    setTimeout(() => removeLoading(id), 1000);
  }, [updateLoading, removeLoading, id]);
  
  const error = useCallback((errorMessage?: string) => {
    updateLoading(id, { state: 'error', message: errorMessage });
    setTimeout(() => removeLoading(id), 3000);
  }, [updateLoading, removeLoading, id]);
  
  const reset = useCallback(() => {
    removeLoading(id);
  }, [removeLoading, id]);
  
  const currentState = getLoadingState(id);
  
  return {
    isLoading: currentState === 'loading',
    isSuccess: currentState === 'success',
    isError: currentState === 'error',
    setLoading,
    setMessage,
    setProgress,
    complete,
    error,
    reset
  };
};

// Hook for async operations with loading states
export const useAsyncLoading = <T,>(
  id: string,
  asyncFn: () => Promise<T>,
  options: Partial<LoadingItem> = {}
) => {
  const { setLoading, complete, error, reset, isLoading } = useLoadingItem(id, options);
  const [data, setData] = React.useState<T | null>(null);
  const [errorState, setErrorState] = React.useState<string | null>(null);
  
  const execute = useCallback(async () => {
    try {
      reset();
      setLoading('loading');
      setErrorState(null);
      
      const result = await asyncFn();
      setData(result);
      complete();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrorState(errorMessage);
      error(errorMessage);
      throw err;
    }
  }, [asyncFn, setLoading, complete, error, reset]);
  
  return {
    execute,
    data,
    error: errorState,
    isLoading,
    reset
  };
};

// Hook for managing multiple loading states
export const useMultipleLoading = (ids: string[]) => {
  const { loadingItems } = useLoading();
  
  const states = React.useMemo(() => {
    return ids.reduce((acc, id) => {
      acc[id] = loadingItems.get(id)?.state || 'idle';
      return acc;
    }, {} as Record<string, 'idle' | 'loading' | 'success' | 'error'>);
  }, [loadingItems, ids]);
  
  const isLoadingAny = React.useMemo(() => {
    return Object.values(states).some(state => state === 'loading');
  }, [states]);
  
  const isLoadingAll = React.useMemo(() => {
    return Object.values(states).every(state => state === 'loading');
  }, [states]);
  
  const isCompleteAll = React.useMemo(() => {
    return Object.values(states).every(state => state === 'success');
  }, [states]);
  
  const hasError = React.useMemo(() => {
    return Object.values(states).some(state => state === 'error');
  }, [states]);
  
  return {
    states,
    isLoadingAny,
    isLoadingAll,
    isCompleteAll,
    hasError
  };
};

// Hook for category-based loading
export const useCategoryLoading = (category: string) => {
  const { getLoadingByCategory } = useLoading();
  
  const categoryItems = React.useMemo(() => {
    return getLoadingByCategory(category);
  }, [getLoadingByCategory, category]);
  
  const isLoading = React.useMemo(() => {
    return categoryItems.some(item => item.state === 'loading');
  }, [categoryItems]);
  
  const loadingCount = React.useMemo(() => {
    return categoryItems.filter(item => item.state === 'loading').length;
  }, [categoryItems]);
  
  const errorCount = React.useMemo(() => {
    return categoryItems.filter(item => item.state === 'error').length;
  }, [categoryItems]);
  
  const successCount = React.useMemo(() => {
    return categoryItems.filter(item => item.state === 'success').length;
  }, [categoryItems]);
  
  return {
    items: categoryItems,
    isLoading,
    loadingCount,
    errorCount,
    successCount
  };
};

// Hook for debounced loading
export const useDebouncedLoading = (
  id: string,
  delay: number = 300
) => {
  const { addLoading, updateLoading, getLoadingState } = useLoading();
  const [debouncedState, setDebouncedState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const currentLoadingState = getLoadingState(id);
  
  const setLoading = useCallback((state: 'idle' | 'loading' | 'success' | 'error', options?: Partial<LoadingItem>) => {
    if (state === 'loading') {
      addLoading(id, { state, ...options });
    } else {
      updateLoading(id, { state });
    }
  }, [addLoading, updateLoading, id]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(currentLoadingState || 'idle');
    }, delay);
    
    return () => clearTimeout(timer);
  }, [currentLoadingState, delay]);
  
  return {
    state: debouncedState,
    isLoading: debouncedState === 'loading',
    setLoading
  };
};

// Hook for retry logic with loading
export const useRetryLoading = <T,>(
  id: string,
  asyncFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
) => {
  const { setLoading, setMessage, complete, error, isLoading } = useLoadingItem(id);
  const [data, setData] = React.useState<T | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [finalError, setFinalError] = React.useState<string | null>(null);
  
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  
  const execute = useCallback(async () => {
    try {
      setAttempt(0);
      setFinalError(null);
      setLoading('loading', { message: `Attempting...` });
      
      let result: T;
      let currentAttempt = 0;
      
      while (currentAttempt <= maxRetries) {
        try {
          setAttempt(currentAttempt);
          setMessage(`Attempt ${currentAttempt + 1} of ${maxRetries + 1}...`);
          
          result = await asyncFn();
          setData(result);
          complete();
          return result;
        } catch (err) {
          currentAttempt++;
          
          if (currentAttempt <= maxRetries) {
            onRetry?.(currentAttempt);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            throw err;
          }
        }
      }
      
      // This should never be reached
      throw new Error('Max retries exceeded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setFinalError(errorMessage);
      error(errorMessage);
      throw err;
    }
  }, [asyncFn, setLoading, setMessage, complete, error, maxRetries, retryDelay, onRetry]);
  
  return {
    execute,
    data,
    error: finalError,
    attempt,
    maxRetries,
    isLoading,
    canRetry: attempt > maxRetries
  };
};

// Hook for progress tracking
export const useProgressLoading = (id: string) => {
  const { setLoading, setProgress, complete, isLoading } = useLoadingItem(id);
  const [steps, setSteps] = React.useState<string[]>([]);
  const [currentStep, setCurrentStep] = React.useState(0);
  
  const addStep = useCallback((step: string) => {
    setSteps(prev => [...prev, step]);
    setCurrentStep(prev => prev + 1);
    setProgress(((currentStep + 1) / (steps.length + 1)) * 100);
  }, [currentStep, steps.length, setProgress]);
  
  const startProgress = useCallback((totalSteps: string[]) => {
    setSteps(totalSteps);
    setCurrentStep(0);
    setLoading('loading', { progress: 0 });
  }, [setLoading]);
  
  const nextStep = useCallback(() => {
    if (currentStep < steps.length) {
      const stepIndex = currentStep + 1;
      const stepMessage = steps[stepIndex - 1];
      setCurrentStep(stepIndex);
      setProgress((stepIndex / steps.length) * 100);
      setLoading('loading', { 
        message: stepMessage,
        progress: (stepIndex / steps.length) * 100 
      });
    }
  }, [currentStep, steps, setLoading, setProgress]);
  
  const finishProgress = useCallback(() => {
    setProgress(100);
    complete();
  }, [setProgress, complete]);
  
  return {
    steps,
    currentStep,
    progress: (currentStep / Math.max(steps.length, 1)) * 100,
    addStep,
    startProgress,
    nextStep,
    finishProgress,
    isLoading
  };
};

// Hook for network status with loading
export const useNetworkLoading = () => {
  const { addLoading, removeLoading } = useLoading();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      removeLoading('network-status');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      addLoading('network-status', {
        state: 'error',
        message: 'You are offline',
        category: 'network'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLoading, removeLoading]);
  
  return {
    isOnline,
    isLoading: !isOnline
  };
};

// Hook for optimistic updates with loading
export const useOptimisticLoading = <T,>(
  id: string,
  optimisticData: T,
  asyncFn: (data: T) => Promise<unknown>
) => {
  const { setLoading, complete, error, reset, isLoading } = useLoadingItem(id);
  const [data, setData] = React.useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = React.useState(false);
  
  const execute = useCallback(async () => {
    try {
      // Set optimistic state
      setData(optimisticData);
      setIsOptimistic(true);
      setLoading('loading', { message: 'Updating...' });
      
      // Execute async operation
      await asyncFn(optimisticData);
      
      // Complete successfully
      complete();
      setIsOptimistic(false);
      
    } catch (err) {
      // Revert to original state
      setData(null);
      setIsOptimistic(false);
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      error(errorMessage);
      throw err;
    }
  }, [optimisticData, asyncFn, setLoading, complete, error]);
  
  return {
    execute,
    data,
    isOptimistic,
    isLoading,
    reset
  };
};

export default useLoading;
