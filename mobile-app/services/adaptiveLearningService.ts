import axios from 'axios';

// Adaptive Learning Engine Configuration
const ADAPTIVE_LEARNING_URL = 'http://localhost:8000/api/v1/adaptive-learning';

export interface LearningProfile {
  user_id: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pace_preference: 'slow' | 'moderate' | 'fast';
  difficulty_tolerance: 'conservative' | 'balanced' | 'aggressive';
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  goals: string[];
  time_available: number; // minutes per day
  preferred_session_length: number; // minutes
  completion_rate: number;
  average_session_time: number;
  streak_days: number;
  last_active: string;
}

export interface AdaptiveContent {
  id: string;
  type: 'lesson' | 'exercise' | 'quiz' | 'project' | 'video' | 'article';
  title: string;
  description: string;
  difficulty: number; // 1-100 scale
  estimated_time: number; // minutes
  prerequisites: string[];
  learning_objectives: string[];
  content: {
    text?: string;
    code?: string;
    video_url?: string;
    interactive_elements?: any[];
  };
  adaptations: {
    visual_aids: boolean;
    step_by_step: boolean;
    examples_count: number;
    hints_available: number;
    difficulty_adjustment: number;
  };
  metadata: {
    topics: string[];
    skills: string[];
    cognitive_load: 'low' | 'medium' | 'high';
    engagement_score: number;
  };
}

export interface LearningSession {
  id: string;
  user_id: string;
  content_id: string;
  start_time: string;
  end_time?: string;
  duration: number; // minutes
  completion_status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  performance_metrics: {
    accuracy: number;
    time_efficiency: number;
    help_requests: number;
    mistakes: number;
    hints_used: number;
  };
  feedback: {
    difficulty_rating: number; // 1-5
    engagement_rating: number; // 1-5
    confidence_rating: number; // 1-5
    comments?: string;
  };
  adaptations_made: {
    difficulty_adjusted: boolean;
    hints_provided: boolean;
    pace_modified: boolean;
    content_modified: boolean;
  };
}

export interface LearningRecommendation {
  content_id: string;
  confidence: number; // 0-1
  reasoning: {
    skill_match: number;
    difficulty_match: number;
    interest_alignment: number;
    time_fit: number;
    learning_style_match: number;
  };
  personalization_factors: {
    adapted_difficulty: number;
    modified_pace: boolean;
    additional_support: boolean;
    enrichment_opportunities: boolean;
  };
  expected_outcomes: {
    success_probability: number;
    estimated_time: number;
    skill_gain: number;
    engagement_score: number;
  };
}

export interface AdaptiveLearningInsights {
  user_id: string;
  learning_velocity: number; // skills learned per week
  retention_rate: number; // knowledge retention percentage
  optimal_difficulty: number; // ideal difficulty level
  optimal_session_length: number; // ideal session duration
  learning_patterns: {
    best_time_of_day: string;
    preferred_content_types: string[];
    engagement_triggers: string[];
    frustration_points: string[];
  };
  performance_trends: {
    accuracy_trend: 'improving' | 'stable' | 'declining';
    speed_trend: 'improving' | 'stable' | 'declining';
    consistency_trend: 'improving' | 'stable' | 'declining';
  };
  recommendations: {
    should_increase_difficulty: boolean;
    should_change_pace: boolean;
    should_try_new_content_type: boolean;
    should_review_prerequisites: boolean;
  };
}

class AdaptiveLearningService {
  private static instance: AdaptiveLearningService;
  private userProfile: LearningProfile | null = null;
  private currentSession: LearningSession | null = null;
  private adaptationHistory: any[] = [];

  static getInstance(): AdaptiveLearningService {
    if (!AdaptiveLearningService.instance) {
      AdaptiveLearningService.instance = new AdaptiveLearningService();
    }
    return AdaptiveLearningService.instance;
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<LearningProfile> {
    try {
      const response = await axios.get(`${ADAPTIVE_LEARNING_URL}/profile/${userId}`);
      this.userProfile = response.data.data;
      return this.userProfile;
    } catch (error: any) {
      console.error('Get User Profile Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  async updateUserProfile(userId: string, updates: Partial<LearningProfile>): Promise<LearningProfile> {
    try {
      const response = await axios.put(`${ADAPTIVE_LEARNING_URL}/profile/${userId}`, updates);
      this.userProfile = response.data.data;
      return this.userProfile;
    } catch (error: any) {
      console.error('Update User Profile Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user profile');
    }
  }

  async createUserProfile(userId: string, profileData: Partial<LearningProfile>): Promise<LearningProfile> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/profile`, {
        user_id: userId,
        ...profileData,
      });
      this.userProfile = response.data.data;
      return this.userProfile;
    } catch (error: any) {
      console.error('Create User Profile Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create user profile');
    }
  }

  // Adaptive Content Management
  async getAdaptiveContent(
    userId: string,
    options: {
      content_type?: string;
      difficulty_range?: [number, number];
      session_length?: number;
      current_mood?: 'focused' | 'tired' | 'motivated' | 'frustrated';
    } = {}
  ): Promise<AdaptiveContent[]> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/content/adaptive`, {
        user_id: userId,
        ...options,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Get Adaptive Content Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get adaptive content');
    }
  }

  async adaptContentForUser(
    userId: string,
    contentId: string,
    adaptations: {
      difficulty_adjustment?: number;
      pace_modification?: number;
      additional_support?: boolean;
      enrichment_opportunities?: boolean;
    }
  ): Promise<AdaptiveContent> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/content/adapt`, {
        user_id: userId,
        content_id: contentId,
        adaptations,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Adapt Content Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to adapt content');
    }
  }

  // Learning Session Management
  async startLearningSession(
    userId: string,
    contentId: string,
    sessionData: {
      estimated_duration: number;
      user_mood?: string;
      context?: string;
    } = {}
  ): Promise<LearningSession> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/session/start`, {
        user_id: userId,
        content_id: contentId,
        ...sessionData,
      });
      this.currentSession = response.data.data;
      return this.currentSession;
    } catch (error: any) {
      console.error('Start Learning Session Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to start learning session');
    }
  }

  async updateLearningSession(
    sessionId: string,
    updates: {
      progress?: number;
      performance_metrics?: Partial<LearningSession['performance_metrics']>;
      feedback?: Partial<LearningSession['feedback']>;
    }
  ): Promise<LearningSession> {
    try {
      const response = await axios.put(`${ADAPTIVE_LEARNING_URL}/session/${sessionId}`, updates);
      this.currentSession = response.data.data;
      return this.currentSession;
    } catch (error: any) {
      console.error('Update Learning Session Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update learning session');
    }
  }

  async completeLearningSession(
    sessionId: string,
    completionData: {
      final_performance: LearningSession['performance_metrics'];
      final_feedback: LearningSession['feedback'];
      total_time: number;
    }
  ): Promise<LearningSession> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/session/${sessionId}/complete`, completionData);
      this.currentSession = null;
      return response.data.data;
    } catch (error: any) {
      console.error('Complete Learning Session Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete learning session');
    }
  }

  // Real-time Adaptation
  async getRealTimeAdaptation(
    userId: string,
    sessionData: {
      current_performance: number;
      time_spent: number;
      help_requests: number;
      mistakes: number;
      engagement_level: number;
    }
  ): Promise<{
    should_adjust_difficulty: boolean;
    new_difficulty?: number;
    should_provide_hint: boolean;
    should_modify_pace: boolean;
    should_change_content: boolean;
    recommendations: string[];
  }> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/adapt/realtime`, {
        user_id: userId,
        session_data,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Real-time Adaptation Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get real-time adaptation');
    }
  }

  // Learning Recommendations
  async getPersonalizedRecommendations(
    userId: string,
    options: {
      count?: number;
      content_types?: string[];
      difficulty_range?: [number, number];
      time_available?: number;
      learning_goals?: string[];
    } = {}
  ): Promise<LearningRecommendation[]> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/recommendations`, {
        user_id: userId,
        ...options,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Get Recommendations Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get recommendations');
    }
  }

  // Learning Analytics and Insights
  async getLearningInsights(userId: string): Promise<AdaptiveLearningInsights> {
    try {
      const response = await axios.get(`${ADAPTIVE_LEARNING_URL}/insights/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get Learning Insights Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get learning insights');
    }
  }

  async getLearningProgress(
    userId: string,
    timeRange: 'day' | 'week' | 'month' | 'year' = 'week'
  ): Promise<{
    sessions_completed: number;
    total_time_spent: number;
    average_accuracy: number;
    difficulty_progression: number[];
    skill_mastery: Record<string, number>;
    engagement_trends: number[];
    learning_velocity: number;
  }> {
    try {
      const response = await axios.get(`${ADAPTIVE_LEARNING_URL}/progress/${userId}?range=${timeRange}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get Learning Progress Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get learning progress');
    }
  }

  // Difficulty Adjustment Algorithm
  async calculateOptimalDifficulty(
    userId: string,
    recentPerformance: {
      accuracy: number;
      completion_time: number;
      help_requests: number;
      engagement: number;
    }[]
  ): Promise<{
    optimal_difficulty: number;
    confidence: number;
    reasoning: string;
    adjustment_factors: {
      performance_factor: number;
      engagement_factor: number;
      time_factor: number;
      help_factor: number;
    };
  }> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/difficulty/optimal`, {
        user_id: userId,
        recent_performance,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Calculate Optimal Difficulty Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to calculate optimal difficulty');
    }
  }

  // Learning Style Detection
  async detectLearningStyle(
    userId: string,
    behaviorData: {
      content_preferences: Record<string, number>;
      interaction_patterns: Record<string, number>;
      time_spent_by_type: Record<string, number>;
      performance_by_type: Record<string, number>;
    }
  ): Promise<{
    primary_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    confidence: number;
    secondary_style: string;
    recommendations: string[];
  }> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/style/detect`, {
        user_id: userId,
        behavior_data,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Detect Learning Style Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to detect learning style');
    }
  }

  // Engagement Monitoring
  async monitorEngagement(
    userId: string,
    sessionData: {
      time_active: number;
      time_idle: number;
      interactions: number;
      help_requests: number;
      mistakes: number;
      completion_rate: number;
    }
  ): Promise<{
    engagement_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    risk_of_abandonment: number;
    interventions: string[];
  }> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/engagement/monitor`, {
        user_id: userId,
        session_data,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Monitor Engagement Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to monitor engagement');
    }
  }

  // Utility Methods
  getCurrentProfile(): LearningProfile | null {
    return this.userProfile;
  }

  getCurrentSession(): LearningSession | null {
    return this.currentSession;
  }

  async refreshProfile(userId: string): Promise<LearningProfile> {
    return await this.getUserProfile(userId);
  }

  // Learning Path Optimization
  async optimizeLearningPath(
    userId: string,
    currentPath: string[],
    performanceData: Record<string, {
      completion_time: number;
      accuracy: number;
      engagement: number;
      difficulty_rating: number;
    }>
  ): Promise<{
    optimized_path: string[];
    removed_items: string[];
    added_items: string[];
    reasoning: string;
    expected_improvement: number;
  }> {
    try {
      const response = await axios.post(`${ADAPTIVE_LEARNING_URL}/path/optimize`, {
        user_id: userId,
        current_path,
        performance_data,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Optimize Learning Path Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to optimize learning path');
    }
  }
}

export default AdaptiveLearningService;
