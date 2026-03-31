interface AIResponse {
  success: boolean;
  data?: {
    content: string;
    suggestions?: string[];
    analysis?: {
      complexity: 'low' | 'medium' | 'high';
      quality: number;
      improvements: string[];
    };
    explanation?: string;
    code_suggestions?: Array<{
      line: number;
      suggestion: string;
      code: string;
    }>;
  };
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CodeAnalysisRequest {
  code: string;
  language: string;
  context?: string;
  question?: string;
}

interface CodeExplanationRequest {
  code: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface DebugRequest {
  code: string;
  error_message: string;
  language: string;
  test_cases?: Array<{
    input: unknown;
    expected_output: unknown;
    actual_output?: unknown;
  }>;
}

interface TutorRequest {
  topic: string;
  question: string;
  current_level: 'beginner' | 'intermediate' | 'advanced';
  learning_goal?: string;
}

class AIService {
  private baseURL = '/api/ai';
  private fallbackResponses: Record<string, string> = {
    'code_analysis': 'I apologize, but AI analysis is currently unavailable. Please check your code manually or try again later.',
    'code_explanation': 'AI explanations are temporarily unavailable. Please refer to documentation or ask a mentor.',
    'debugging': 'AI debugging assistance is currently unavailable. Please review your code carefully or seek help from the community.',
    'tutoring': 'AI tutoring is temporarily unavailable. Please try the learning resources or ask an instructor.'
  };

  // Code Analysis
  async analyzeCode(request: CodeAnalysisRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Code Analysis Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: this.fallbackResponses.code_analysis,
        data: {
          content: this.fallbackResponses.code_analysis,
          analysis: {
            complexity: 'medium',
            quality: 0.7,
            improvements: ['Review code structure', 'Add comments', 'Check for edge cases']
          }
        }
      };
    }
  }

  // Code Explanation
  async explainCode(request: CodeExplanationRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Code Explanation Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: this.fallbackResponses.code_explanation,
        data: {
          content: this.fallbackResponses.code_explanation,
          explanation: 'This code appears to be a standard implementation. Please review the documentation for more details.'
        }
      };
    }
  }

  // Debugging Assistance
  async debugCode(request: DebugRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Debugging Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: this.fallbackResponses.debugging,
        data: {
          content: this.fallbackResponses.debugging,
          suggestions: [
            'Check for syntax errors',
            'Review variable names and types',
            'Verify logic flow',
            'Add debug print statements'
          ]
        }
      };
    }
  }

  // AI Tutoring
  async getTutoring(request: TutorRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Tutoring Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: this.fallbackResponses.tutoring,
        data: {
          content: this.fallbackResponses.tutoring,
          suggestions: [
            'Review the learning materials',
            'Practice with similar problems',
            'Ask questions in the community forum',
            'Schedule a session with an instructor'
          ]
        }
      };
    }
  }

  // Smart Code Suggestions
  async getCodeSuggestions(code: string, language: string, cursorPosition: number): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          code,
          language,
          cursor_position: cursorPosition
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Code Suggestions Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: 'Code suggestions are currently unavailable',
        data: {
          content: 'Code suggestions temporarily unavailable',
          code_suggestions: [
            {
              line: 1,
              suggestion: 'Consider adding comments to explain your code',
              code: '# Add your code here'
            }
          ]
        }
      };
    }
  }

  // Learning Path Recommendations
  async getLearningPathRecommendations(currentTopic: string, userLevel: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/learning-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_topic: currentTopic,
          user_level: userLevel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI Learning Path Error:', error);
      
      // Fallback response
      return {
        success: false,
        error: 'Learning path recommendations are currently unavailable',
        data: {
          content: 'Try exploring different topics in the course curriculum',
          suggestions: [
            'Review fundamentals',
            'Practice with exercises',
            'Join study groups',
            'Ask for mentor guidance'
          ]
        }
      };
    }
  }

  // Check AI Service Status
  async checkStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        return {
          available: false,
          message: 'AI service is currently unavailable'
        };
      }

      const data = await response.json();
      return {
        available: data.available,
        message: data.message
      };
    } catch (error) {
      console.error('AI Status Check Error:', error);
      return {
        available: false,
        message: 'Unable to check AI service status'
      };
    }
  }

  // Get AI Usage Statistics
  async getUsageStats(): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('AI Usage Stats Error:', error);
      return {
        success: false,
        error: 'Unable to fetch usage statistics'
      };
    }
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
