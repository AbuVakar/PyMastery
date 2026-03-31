import axios, { type AxiosError, type AxiosInstance } from 'axios';

interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface CodeAnalysisRequest {
  code: string;
  language: string;
  problemContext?: string;
}

interface CodeAnalysisResponse {
  success: boolean;
  data?: {
    analysis: string;
    suggestions: string[];
    errors: string[];
    improvements: string[];
    complexity: 'low' | 'medium' | 'high';
    score: number;
  };
  error?: string;
}

interface LearningPathRequest {
  goals: string[];
  currentSkills?: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  timeCommitment?: number; // hours per week
}

interface LearningPathResponse {
  success: boolean;
  data?: {
    path: string[];
    estimatedDuration: number;
    resources: Array<{
      title: string;
      type: 'video' | 'article' | 'exercise' | 'project';
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedTime: number;
    }>;
    milestones: Array<{
      title: string;
      description: string;
      targetDate: string;
    }>;
  };
  error?: string;
}

class OpenAIService {
  private config: OpenAIConfig;
  private client: AxiosInstance;

  constructor(config?: Partial<OpenAIConfig>) {
    this.config = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      ...config
    };

    if (!this.config.apiKey) {
      console.warn('OpenAI API key not configured');
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  private async makeRequest(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      return response.data.choices[0].message.content;
    } catch (error: unknown) {
      console.error('OpenAI API error:', error);
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (axiosError.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (axiosError.response?.status === 400) {
        throw new Error('Invalid request to OpenAI API');
      } else {
        throw new Error('Failed to connect to OpenAI API');
      }
    }
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    try {
      const systemPrompt = `You are an expert code reviewer and Python programming instructor. 
      Analyze the provided code and give constructive feedback. 
      Focus on: correctness, efficiency, readability, and best practices.
      Provide specific, actionable suggestions for improvement.`;

      const prompt = `Please analyze this ${request.language} code:
      
${request.code}

${request.problemContext ? `Context: ${request.problemContext}` : ''}

Please provide:
1. Overall analysis of the code
2. Specific suggestions for improvement
3. Any errors or issues found
4. Best practices recommendations
5. Complexity assessment (low/medium/high)
6. Score from 1-100

Format your response as JSON with the following structure:
{
  "analysis": "Overall analysis text",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "errors": ["error 1", "error 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "complexity": "low|medium|high",
  "score": 85
}`;

      const response = await this.makeRequest(prompt, systemPrompt);
      
      try {
        const parsed = JSON.parse(response);
        return {
          success: true,
          data: parsed
        };
      } catch (_parseError) {
        // If JSON parsing fails, extract information manually
        return {
          success: true,
          data: {
            analysis: response,
            suggestions: [],
            errors: [],
            improvements: [],
            complexity: 'medium',
            score: 75
          }
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze code'
      };
    }
  }

  async generateLearningPath(request: LearningPathRequest): Promise<LearningPathResponse> {
    try {
      const systemPrompt = `You are an expert educational planner and Python instructor.
      Create a personalized learning path based on the user's goals and current skills.
      Consider their learning style and time commitment.
      Provide realistic timelines and specific resources.`;

      const prompt = `Create a personalized Python learning path with the following details:

Goals: ${request.goals.join(', ')}
Current Skills: ${request.currentSkills?.join(', ') || 'None specified'}
Learning Style: ${request.learningStyle || 'Not specified'}
Time Commitment: ${request.timeCommitment || 'Not specified'} hours per week

Please provide:
1. A step-by-step learning path
2. Estimated total duration in weeks
3. Specific resources for each step (videos, articles, exercises, projects)
4. Key milestones with descriptions and target dates

Format your response as JSON with this structure:
{
  "path": ["Step 1: Python Basics", "Step 2: Data Structures", ...],
  "estimatedDuration": 12,
  "resources": [
    {
      "title": "Resource title",
      "type": "video|article|exercise|project",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": 2
    }
  ],
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What you'll accomplish",
      "targetDate": "Week 4"
    }
  ]
}`;

      const response = await this.makeRequest(prompt, systemPrompt);
      
      try {
        const parsed = JSON.parse(response);
        return {
          success: true,
          data: parsed
        };
      } catch (_parseError) {
        // If JSON parsing fails, create a basic structure
        return {
          success: true,
          data: {
            path: response.split('\n').filter(line => line.trim()),
            estimatedDuration: 12,
            resources: [],
            milestones: []
          }
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate learning path'
      };
    }
  }

  async generateCodeExplanation(code: string, language: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert programming instructor. 
      Explain code in a clear, educational way suitable for learners.
      Break down complex concepts and provide examples.`;

      const prompt = `Please explain this ${language} code line by line:

${code}

Focus on:
1. What each part of the code does
2. Key concepts being used
3. Why certain approaches were taken
4. How a beginner should understand this
5. Any important details or gotchas`;

      return await this.makeRequest(prompt, systemPrompt);
    } catch (error: unknown) {
      throw new Error(
        `Failed to generate code explanation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async suggestImprovements(code: string, language: string): Promise<string[]> {
    try {
      const systemPrompt = `You are a senior software engineer and code reviewer.
      Provide specific, actionable suggestions for code improvement.
      Focus on best practices, performance, readability, and maintainability.`;

      const prompt = `Please suggest improvements for this ${language} code:

${code}

Provide 5-7 specific suggestions as a numbered list.
Each suggestion should be actionable and explain why it's better.`;

      const response = await this.makeRequest(prompt, systemPrompt);
      
      // Parse numbered list
      return response
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
    } catch (error: unknown) {
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateQuiz(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<Record<string, unknown>> {
    try {
      const systemPrompt = `You are an educational content creator specializing in programming.
      Create engaging quiz questions that test understanding of the topic.`;

      const prompt = `Create a 5-question quiz about ${topic} for ${difficulty} level learners.

For each question provide:
1. The question
2. 4 multiple choice options (A, B, C, D)
3. The correct answer
4. A brief explanation

Format as JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "Explanation text"
    }
  ]
}`;

      const response = await this.makeRequest(prompt, systemPrompt);
      
      try {
        return JSON.parse(response);
      } catch (_parseError) {
        throw new Error('Failed to parse quiz response');
      }
    } catch (error: unknown) {
      throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  updateConfig(newConfig: Partial<OpenAIConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
    }
  }
}

// Create singleton instance
const openaiService = new OpenAIService();

export default openaiService;
export { OpenAIService, type OpenAIConfig, type CodeAnalysisRequest, type CodeAnalysisResponse, type LearningPathRequest, type LearningPathResponse };
