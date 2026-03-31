/**
 * Custom hooks for API integration to replace mock data
 * Provides real data fetching with proper error handling and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { fixedApiService, type ApiResponse } from '../services/fixedApi';

const serializeDependency = (dependency: unknown): string => {
  if (typeof dependency === 'string' || typeof dependency === 'number' || typeof dependency === 'boolean') {
    return String(dependency);
  }

  if (dependency === null || dependency === undefined) {
    return '';
  }

  try {
    return JSON.stringify(dependency);
  } catch {
    return String(dependency);
  }
};

// Generic API hook
export const useApiData = <T>(
  apiCall: () => Promise<T>,
  dependencies: readonly unknown[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dependencyKey = dependencies.map(serializeDependency).join('|');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dependencyKey]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// KPI Analytics hook
export const useKPIAnalytics = (timeRange?: string) => {
  return useApiData(
    () => fixedApiService.dashboard.getStats(),
    [timeRange]
  );
};

// Study Groups hook
export const useStudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, these would be separate API calls
      // For now, we'll simulate with available endpoints
      const [allGroupsData, myGroupsData] = await Promise.all([
        // Mock API call - replace with actual endpoint when available
        Promise.resolve([]), // apiService.studyGroups.getAll(),
        Promise.resolve([]), // apiService.studyGroups.getMyGroups(),
      ]);

      setGroups(allGroupsData);
      setMyGroups(myGroupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch study groups');
      console.error('Study Groups Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, myGroups, loading, error, refetch: fetchGroups };
};

// Mentorship hook
export const useMentorship = () => {
  return useApiData(
    () => Promise.resolve([]), // Replace with apiService.mentorship.getMentors()
  );
};

// Community Forum hook
export const useCommunityForum = () => {
  return useApiData(
    () => Promise.resolve([]), // Replace with apiService.forum.getPosts()
  );
};

// Payment/Subscription hook
export const useSubscription = () => {
  return useApiData(
    () => Promise.resolve({
      plans: [],
      currentSubscription: null,
      billingHistory: []
    }) // Replace with apiService.billing.getSubscription()
  );
};

// Smart IDE hook
export const useSmartIDE = () => {
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [visualization, setVisualization] = useState([]);

  const executeCode = useCallback(async (code: string, language: string, stdin?: string) => {
    try {
      setIsExecuting(true);
      setOutput('');
      setVisualization([]);

      const result = (await fixedApiService.codeExecution.execute({
        source_code: code,
        language: language,
        stdin: stdin
      })) as {
        data?: {
          stdout?: string;
          visualization?: unknown[];
        };
      };
      
      if (result.data?.stdout) {
        setOutput(result.data.stdout);
      }
      
      if (result.data?.visualization) {
        setVisualization(result.data.visualization);
      }
      
      return result;
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Execution failed'}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return { output, isExecuting, visualization, executeCode };
};

// Learning Progress hook
export const useLearningProgress = () => {
  return useApiData(
    () => fixedApiService.users.getStats()
  );
};

// Gamification hook
export const useGamification = () => {
  return useApiData(
    () => fixedApiService.users.getStats()
  );
};

// AI Recommendations hook
export const useAIRecommendations = (type?: string) => {
  return useApiData(
    () => fixedApiService.aiTutor.chat({
      message: 'Get recommendations',
      message_type: 'recommendation',
      user_id: 'current-user',
      context: { type }
    }) as Promise<{ data?: unknown }>,
    [type]
  );
};

// Code Analysis hook
export const useCodeAnalysis = () => {
  const [analysis, setAnalysis] = useState<ApiResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCode = useCallback(async (code: string, language: string, context?: string) => {
    try {
      setIsAnalyzing(true);
      const result = await fixedApiService.aiTutor.chat({
        message: `Analyze code: ${code}`,
        message_type: 'code_analysis',
        user_id: 'current-user',
        context: {
          code,
          language,
          problem_context: context
        }
      });
      setAnalysis(result);
      return result;
    } catch (err) {
      console.error('Code Analysis Error:', err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analysis, isAnalyzing, analyzeCode };
};

// Export the main hook for easy access
export default {
  useApiData,
  useKPIAnalytics,
  useStudyGroups,
  useMentorship,
  useCommunityForum,
  useSubscription,
  useSmartIDE,
  useLearningProgress,
  useGamification,
  useAIRecommendations,
  useCodeAnalysis,
};
