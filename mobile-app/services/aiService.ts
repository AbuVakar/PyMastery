import axios from 'axios';

// AI Service Configuration
const AI_BASE_URL = 'http://localhost:8000/api/v1/ai';

export interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    response_time?: number;
  };
}

export interface AIChatSession {
  id: string;
  title: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface CodeAnalysis {
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    line: number;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  suggestions: string[];
  quality_score: number;
  complexity_score: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  topics: string[];
  prerequisites: string[];
  courses: string[];
  problems: string[];
}

class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Chat with AI Mentor
  async sendMessage(message: string, sessionId?: string): Promise<AIMessage> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/chat`, {
        message,
        session_id: sessionId,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      throw error.response?.data?.message || 'Failed to send message';
    }
  }

  // Get chat sessions
  async getChatSessions(): Promise<AIChatSession[]> {
    try {
      const response = await axios.get(`${AI_BASE_URL}/chat/sessions`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get sessions');
      }
    } catch (error: any) {
      console.error('Get Sessions Error:', error);
      throw error.response?.data?.message || 'Failed to get sessions';
    }
  }

  // Create new chat session
  async createChatSession(title: string): Promise<AIChatSession> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/chat/sessions`, {
        title,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create session');
      }
    } catch (error: any) {
      console.error('Create Session Error:', error);
      throw error.response?.data?.message || 'Failed to create session';
    }
  }

  // Analyze code
  async analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/code/analyze`, {
        code,
        language,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to analyze code');
      }
    } catch (error: any) {
      console.error('Code Analysis Error:', error);
      throw error.response?.data?.message || 'Failed to analyze code';
    }
  }

  // Get code suggestions
  async getCodeSuggestions(code: string, language: string, cursor_position?: number): Promise<string[]> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/code/suggest`, {
        code,
        language,
        cursor_position,
      });

      if (response.data.success) {
        return response.data.data.suggestions;
      } else {
        throw new Error(response.data.message || 'Failed to get suggestions');
      }
    } catch (error: any) {
      console.error('Code Suggestions Error:', error);
      throw error.response?.data?.message || 'Failed to get suggestions';
    }
  }

  // Generate personalized learning path
  async generateLearningPath(userLevel: string, interests: string[], goals: string[]): Promise<LearningPath> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/learning/path`, {
        user_level: userLevel,
        interests,
        goals,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate learning path');
      }
    } catch (error: any) {
      console.error('Learning Path Error:', error);
      throw error.response?.data?.message || 'Failed to generate learning path';
    }
  }

  // Get problem hints
  async getProblemHint(problemId: string, userCode?: string, stuckPoint?: string): Promise<string> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/problems/hint`, {
        problem_id: problemId,
        user_code: userCode,
        stuck_point: stuckPoint,
      });

      if (response.data.success) {
        return response.data.data.hint;
      } else {
        throw new Error(response.data.message || 'Failed to get hint');
      }
    } catch (error: any) {
      console.error('Problem Hint Error:', error);
      throw error.response?.data?.message || 'Failed to get hint';
    }
  }

  // Explain code concept
  async explainCodeConcept(concept: string, context?: string): Promise<string> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/explain`, {
        concept,
        context,
      });

      if (response.data.success) {
        return response.data.data.explanation;
      } else {
        throw new Error(response.data.message || 'Failed to explain concept');
      }
    } catch (error: any) {
      console.error('Explain Concept Error:', error);
      throw error.response?.data?.message || 'Failed to explain concept';
    }
  }

  // Get AI models status
  async getAIModelsStatus(): Promise<{
    openai: boolean;
    groq: boolean;
    gemini: boolean;
    current_model: string;
  }> {
    try {
      const response = await axios.get(`${AI_BASE_URL}/models/status`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get models status');
      }
    } catch (error: any) {
      console.error('Models Status Error:', error);
      throw error.response?.data?.message || 'Failed to get models status';
    }
  }

  // Switch AI model
  async switchAIModel(model: 'openai' | 'groq' | 'gemini'): Promise<boolean> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/models/switch`, {
        model,
      });

      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to switch model');
      }
    } catch (error: any) {
      console.error('Switch Model Error:', error);
      throw error.response?.data?.message || 'Failed to switch model';
    }
  }
}

export default AIService;
