import { useCallback, useState } from 'react';
import openaiService, {
  type CodeAnalysisRequest,
  type CodeAnalysisResponse,
  type LearningPathRequest,
  type LearningPathResponse,
} from '../services/openaiService';

type LearningStyle = NonNullable<LearningPathRequest['learningStyle']>;
type QuizResult = Record<string, unknown>;

interface UseOpenAIState {
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
}

interface UseOpenAIActions {
  analyzeCode: (
    code: string,
    language: string,
    problemContext?: string
  ) => Promise<CodeAnalysisResponse['data'] | null>;
  generateLearningPath: (
    goals: string[],
    currentSkills?: string[],
    learningStyle?: LearningStyle,
    timeCommitment?: number
  ) => Promise<LearningPathResponse['data'] | null>;
  explainCode: (code: string, language: string) => Promise<string>;
  suggestImprovements: (code: string, language: string) => Promise<string[]>;
  generateQuiz: (
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ) => Promise<QuizResult | null>;
  clearError: () => void;
  configureAPI: (apiKey: string) => void;
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;

export const useOpenAI = (): UseOpenAIState & UseOpenAIActions => {
  const [state, setState] = useState<UseOpenAIState>({
    isLoading: false,
    error: null,
    isConfigured: openaiService.isConfigured(),
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((previousState) => ({ ...previousState, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((previousState) => ({ ...previousState, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const analyzeCode = useCallback(
    async (
      code: string,
      language: string,
      problemContext?: string
    ): Promise<CodeAnalysisResponse['data'] | null> => {
      if (!state.isConfigured) {
        setError('OpenAI API not configured. Please add your API key.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const request: CodeAnalysisRequest = { code, language, problemContext };
        const response = await openaiService.analyzeCode(request);

        if (response.success) {
          return response.data ?? null;
        }

        setError(response.error || 'Failed to analyze code');
        return null;
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to analyze code'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state.isConfigured, setError, setLoading]
  );

  const generateLearningPath = useCallback(
    async (
      goals: string[],
      currentSkills?: string[],
      learningStyle?: LearningStyle,
      timeCommitment?: number
    ): Promise<LearningPathResponse['data'] | null> => {
      if (!state.isConfigured) {
        setError('OpenAI API not configured. Please add your API key.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const request: LearningPathRequest = {
          goals,
          currentSkills,
          learningStyle,
          timeCommitment,
        };
        const response = await openaiService.generateLearningPath(request);

        if (response.success) {
          return response.data ?? null;
        }

        setError(response.error || 'Failed to generate learning path');
        return null;
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to generate learning path'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state.isConfigured, setError, setLoading]
  );

  const explainCode = useCallback(
    async (code: string, language: string): Promise<string> => {
      if (!state.isConfigured) {
        setError('OpenAI API not configured. Please add your API key.');
        return '';
      }

      setLoading(true);
      setError(null);

      try {
        return await openaiService.generateCodeExplanation(code, language);
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to generate code explanation'));
        return '';
      } finally {
        setLoading(false);
      }
    },
    [state.isConfigured, setError, setLoading]
  );

  const suggestImprovements = useCallback(
    async (code: string, language: string): Promise<string[]> => {
      if (!state.isConfigured) {
        setError('OpenAI API not configured. Please add your API key.');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        return await openaiService.suggestImprovements(code, language);
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to generate suggestions'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [state.isConfigured, setError, setLoading]
  );

  const generateQuiz = useCallback(
    async (
      topic: string,
      difficulty: 'beginner' | 'intermediate' | 'advanced'
    ): Promise<QuizResult | null> => {
      if (!state.isConfigured) {
        setError('OpenAI API not configured. Please add your API key.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        return await openaiService.generateQuiz(topic, difficulty);
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to generate quiz'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state.isConfigured, setError, setLoading]
  );

  const configureAPI = useCallback(
    (apiKey: string) => {
      try {
        openaiService.updateConfig({ apiKey });
        setState((previousState) => ({
          ...previousState,
          isConfigured: true,
          error: null,
        }));
      } catch (_error: unknown) {
        setError('Failed to configure OpenAI API');
      }
    },
    [setError]
  );

  return {
    ...state,
    analyzeCode,
    generateLearningPath,
    explainCode,
    suggestImprovements,
    generateQuiz,
    clearError,
    configureAPI,
  };
};

export default useOpenAI;
