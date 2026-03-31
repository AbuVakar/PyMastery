import axios from 'axios';

// Enhanced AI Service Configuration
const AI_BASE_URL = 'http://localhost:8000/api/v1/ai';

// AI Provider Configuration
export interface AIProvider {
  name: string;
  displayName: string;
  models: AIModel[];
  capabilities: AICapability[];
  pricing: AIPricing;
  limits: AILimits;
  status: 'active' | 'inactive' | 'error';
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  type: 'chat' | 'completion' | 'embedding' | 'image';
  maxTokens: number;
  costPerToken: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'standard' | 'premium';
  features: string[];
}

export interface AICapability {
  name: string;
  description: string;
  supported: boolean;
  confidence: number;
}

export interface AIPricing {
  inputTokenCost: number;
  outputTokenCost: number;
  currency: string;
  billingUnit: 'token' | 'character' | 'request';
}

export interface AILimits {
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxTokensPerDay: number;
  contextWindow: number;
}

// Enhanced AI Response Types
export interface EnhancedAIResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  responseTime: number;
  quality: {
    relevance: number;
    accuracy: number;
    completeness: number;
  };
  metadata: {
    timestamp: string;
    sessionId: string;
    userId?: string;
    context?: any;
  };
}

export interface CodeAnalysisEnhanced {
  summary: {
    overallScore: number;
    complexity: 'simple' | 'moderate' | 'complex';
    readability: number;
    maintainability: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion' | 'best-practice';
    severity: 'low' | 'medium' | 'high' | 'critical';
    line: number;
    column: number;
    message: string;
    rule: string;
    suggestion?: string;
    confidence: number;
  }>;
  suggestions: Array<{
    type: 'optimization' | 'refactoring' | 'security' | 'performance';
    priority: 'low' | 'medium' | 'high';
    description: string;
    example: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
  };
  patterns: Array<{
    name: string;
    type: 'design' | 'anti' | 'idiom';
    confidence: number;
    description: string;
  }>;
}

export interface LearningPathEnhanced {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: {
    minimum: number;
    average: number;
    maximum: number;
  };
  prerequisites: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    required: boolean;
  }>;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    type: 'lesson' | 'exercise' | 'project' | 'assessment';
    duration: number;
    order: number;
    content: {
      topics: string[];
      skills: string[];
      objectives: string[];
    };
    resources: Array<{
      type: 'video' | 'article' | 'code' | 'quiz';
      title: string;
      url?: string;
      content?: string;
    }>;
    assessment: {
      type: 'quiz' | 'coding' | 'project';
      questions?: number;
      passScore: number;
      timeLimit?: number;
    };
  }>;
  outcomes: Array<{
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    confidence: number;
  }>;
  personalization: {
    adaptedToUser: boolean;
    adaptationReasons: string[];
    userLevel: string;
    learningStyle: string;
  };
  progress: {
    completedModules: number;
    totalModules: number;
    averageScore: number;
    timeSpent: number;
    lastAccessed: string;
  };
}

export interface ProblemRecommendationEnhanced {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  tags: string[];
  estimatedTime: number;
  successRate: number;
  averageAttempts: number;
  reasoning: {
    whyRecommended: string;
    skillMatch: number;
    difficultyMatch: number;
    interestMatch: number;
    prerequisites: string[];
    learningObjectives: string[];
  };
  personalization: {
    adaptedToUser: boolean;
    userSkillLevel: string;
    userInterests: string[];
    userWeaknesses: string[];
    adaptationFactors: Array<{
      factor: string;
      weight: number;
      impact: string;
    }>;
  };
  hints: Array<{
    level: number;
    content: string;
    type: 'general' | 'specific' | 'code';
    cost: number;
  }>;
  solution: {
    code: string;
    explanation: string;
    complexity: 'O(n)' | 'O(n²)' | 'O(log n)' | 'O(1)';
    alternatives: Array<{
      approach: string;
      code: string;
      pros: string[];
      cons: string[];
    }>;
  };
}

class EnhancedAIService {
  private static instance: EnhancedAIService;
  private currentProvider: string = 'openai';
  private currentModel: string = 'gpt-4';
  private providers: Map<string, AIProvider> = new Map();
  private userPreferences: any = {};

  static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    try {
      const response = await axios.get(`${AI_BASE_URL}/providers`);
      const providers = response.data.data;
      
      providers.forEach((provider: AIProvider) => {
        this.providers.set(provider.name, provider);
      });
    } catch (error) {
      console.error('Failed to initialize AI providers:', error);
      this.setFallbackProviders();
    }
  }

  private setFallbackProviders() {
    // Fallback providers if API fails
    const fallbackProviders: AIProvider[] = [
      {
        name: 'openai',
        displayName: 'OpenAI',
        models: [
          {
            id: 'gpt-4',
            name: 'gpt-4',
            displayName: 'GPT-4',
            provider: 'openai',
            type: 'chat',
            maxTokens: 8192,
            costPerToken: 0.00003,
            speed: 'medium',
            quality: 'premium',
            features: ['code-analysis', 'learning-paths', 'problem-recommendations']
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'gpt-3.5-turbo',
            displayName: 'GPT-3.5 Turbo',
            provider: 'openai',
            type: 'chat',
            maxTokens: 4096,
            costPerToken: 0.0000015,
            speed: 'fast',
            quality: 'standard',
            features: ['chat', 'basic-analysis']
          }
        ],
        capabilities: [
          { name: 'chat', description: 'Conversational AI', supported: true, confidence: 0.95 },
          { name: 'code-analysis', description: 'Code review and analysis', supported: true, confidence: 0.90 },
          { name: 'learning-paths', description: 'Personalized learning paths', supported: true, confidence: 0.85 },
          { name: 'problem-recommendations', description: 'Smart problem recommendations', supported: true, confidence: 0.88 }
        ],
        pricing: {
          inputTokenCost: 0.0000015,
          outputTokenCost: 0.000002,
          currency: 'USD',
          billingUnit: 'token'
        },
        limits: {
          maxTokensPerRequest: 8192,
          maxRequestsPerMinute: 60,
          maxTokensPerDay: 100000,
          contextWindow: 8192
        },
        status: 'active'
      },
      {
        name: 'groq',
        displayName: 'Groq',
        models: [
          {
            id: 'llama2-70b-4096',
            name: 'llama2-70b-4096',
            displayName: 'Llama 2 70B',
            provider: 'groq',
            type: 'chat',
            maxTokens: 4096,
            costPerToken: 0.0000006,
            speed: 'fast',
            quality: 'standard',
            features: ['chat', 'code-analysis']
          }
        ],
        capabilities: [
          { name: 'chat', description: 'Conversational AI', supported: true, confidence: 0.88 },
          { name: 'code-analysis', description: 'Code review and analysis', supported: true, confidence: 0.82 },
          { name: 'learning-paths', description: 'Personalized learning paths', supported: false, confidence: 0.0 },
          { name: 'problem-recommendations', description: 'Smart problem recommendations', supported: false, confidence: 0.0 }
        ],
        pricing: {
          inputTokenCost: 0.0000006,
          outputTokenCost: 0.0000006,
          currency: 'USD',
          billingUnit: 'token'
        },
        limits: {
          maxTokensPerRequest: 4096,
          maxRequestsPerMinute: 30,
          maxTokensPerDay: 50000,
          contextWindow: 4096
        },
        status: 'active'
      },
      {
        name: 'gemini',
        displayName: 'Google Gemini',
        models: [
          {
            id: 'gemini-pro',
            name: 'gemini-pro',
            displayName: 'Gemini Pro',
            provider: 'gemini',
            type: 'chat',
            maxTokens: 32768,
            costPerToken: 0.00000025,
            speed: 'medium',
            quality: 'standard',
            features: ['chat', 'code-analysis', 'learning-paths']
          }
        ],
        capabilities: [
          { name: 'chat', description: 'Conversational AI', supported: true, confidence: 0.92 },
          { name: 'code-analysis', description: 'Code review and analysis', supported: true, confidence: 0.85 },
          { name: 'learning-paths', description: 'Personalized learning paths', supported: true, confidence: 0.80 },
          { name: 'problem-recommendations', description: 'Smart problem recommendations', supported: true, confidence: 0.83 }
        ],
        pricing: {
          inputTokenCost: 0.00000025,
          outputTokenCost: 0.0000005,
          currency: 'USD',
          billingUnit: 'token'
        },
        limits: {
          maxTokensPerRequest: 32768,
          maxRequestsPerMinute: 60,
          maxTokensPerDay: 150000,
          contextWindow: 32768
        },
        status: 'active'
      }
    ];

    fallbackProviders.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
  }

  // Enhanced AI Chat with multiple providers
  async chatWithAI(
    message: string,
    options: {
      provider?: string;
      model?: string;
      context?: any;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<EnhancedAIResponse> {
    try {
      const provider = options.provider || this.currentProvider;
      const model = options.model || this.currentModel;
      
      const response = await axios.post(`${AI_BASE_URL}/chat`, {
        message,
        provider,
        model,
        context: options.context,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to chat with AI');
    }
  }

  // Enhanced Code Analysis
  async analyzeCode(
    code: string,
    language: string,
    options: {
      provider?: string;
      model?: string;
      analysisType?: 'basic' | 'comprehensive' | 'security';
    } = {}
  ): Promise<CodeAnalysisEnhanced> {
    try {
      const provider = options.provider || this.currentProvider;
      const model = options.model || this.currentModel;
      
      const response = await axios.post(`${AI_BASE_URL}/code/analyze`, {
        code,
        language,
        provider,
        model,
        analysisType: options.analysisType || 'comprehensive',
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Code Analysis Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze code');
    }
  }

  // Enhanced Learning Path Generation
  async generateLearningPath(
    userProfile: {
      currentSkills: string[];
      desiredSkills: string[];
      skillLevel: string;
      learningStyle: string;
      interests: string[];
      timeAvailable: number;
      goals: string[];
    },
    options: {
      provider?: string;
      model?: string;
      duration?: number;
      difficulty?: string;
    } = {}
  ): Promise<LearningPathEnhanced> {
    try {
      const provider = options.provider || this.currentProvider;
      const model = options.model || this.currentModel;
      
      const response = await axios.post(`${AI_BASE_URL}/learning/path/generate`, {
        userProfile,
        provider,
        model,
        duration: options.duration || 30,
        difficulty: options.difficulty || 'intermediate',
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Learning Path Generation Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate learning path');
    }
  }

  // Enhanced Problem Recommendations
  async getProblemRecommendations(
    userProfile: {
      solvedProblems: string[];
      skillLevel: string;
      interests: string[];
      weaknesses: string[];
      learningGoals: string[];
      recentActivity: any[];
    },
    options: {
      provider?: string;
      model?: string;
      count?: number;
      difficulty?: string;
      category?: string;
    } = {}
  ): Promise<ProblemRecommendationEnhanced[]> {
    try {
      const provider = options.provider || this.currentProvider;
      const model = options.model || this.currentModel;
      
      const response = await axios.post(`${AI_BASE_URL}/problems/recommend`, {
        userProfile,
        provider,
        model,
        count: options.count || 10,
        difficulty: options.difficulty,
        category: options.category,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Problem Recommendations Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get problem recommendations');
    }
  }

  // Provider Management
  async getProviders(): Promise<AIProvider[]> {
    return Array.from(this.providers.values());
  }

  async switchProvider(providerName: string): Promise<boolean> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider || provider.status !== 'active') {
        throw new Error(`Provider ${providerName} is not available`);
      }

      const response = await axios.post(`${AI_BASE_URL}/providers/switch`, {
        provider: providerName,
      });

      if (response.data.success) {
        this.currentProvider = providerName;
        this.currentModel = provider.models[0].id;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Provider Switch Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to switch provider');
    }
  }

  async switchModel(modelName: string): Promise<boolean> {
    try {
      const response = await axios.post(`${AI_BASE_URL}/models/switch`, {
        model: modelName,
      });

      if (response.data.success) {
        this.currentModel = modelName;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Model Switch Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to switch model');
    }
  }

  // AI Model Status and Capabilities
  async getModelStatus(): Promise<{
    currentProvider: string;
    currentModel: string;
    availableProviders: AIProvider[];
    capabilities: AICapability[];
    performance: {
      averageResponseTime: number;
      successRate: number;
      errorRate: number;
    };
  }> {
    try {
      const response = await axios.get(`${AI_BASE_URL}/models/status`);
      return response.data.data;
    } catch (error: any) {
      console.error('Model Status Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get model status');
    }
  }

  // AI Cost and Usage Tracking
  async getUsageStats(timeRange: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalTokens: number;
    totalCost: number;
    requests: number;
    averageResponseTime: number;
    byProvider: Record<string, {
      tokens: number;
      cost: number;
      requests: number;
    }>;
    byModel: Record<string, {
      tokens: number;
      cost: number;
      requests: number;
    }>;
  }> {
    try {
      const response = await axios.get(`${AI_BASE_URL}/usage/stats?range=${timeRange}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Usage Stats Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get usage stats');
    }
  }

  // AI Settings and Preferences
  async updatePreferences(preferences: {
    preferredProvider?: string;
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
    responseStyle?: 'concise' | 'detailed' | 'educational';
    language?: string;
  }): Promise<boolean> {
    try {
      const response = await axios.put(`${AI_BASE_URL}/preferences`, preferences);
      
      if (response.data.success) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Update Preferences Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update preferences');
    }
  }

  async getPreferences(): Promise<any> {
    try {
      const response = await axios.get(`${AI_BASE_URL}/preferences`);
      this.userPreferences = response.data.data;
      return this.userPreferences;
    } catch (error: any) {
      console.error('Get Preferences Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get preferences');
    }
  }

  // Current state getters
  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  getUserPreferences(): any {
    return this.userPreferences;
  }
}

export default EnhancedAIService;
