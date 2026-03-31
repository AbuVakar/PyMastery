import axios from 'axios';

// Analytics Configuration
const ANALYTICS_BASE_URL = 'http://localhost:8000/api/v1/analytics';

export interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  session_id?: string;
  timestamp: string;
  properties: Record<string, any>;
  platform: 'mobile' | 'web' | 'desktop';
  app_version: string;
  device_info?: {
    platform: string;
    version: string;
    model: string;
    manufacturer: string;
  };
}

export interface UserMetrics {
  user_id: string;
  total_sessions: number;
  total_time_spent: number;
  courses_completed: number;
  problems_solved: number;
  current_streak: number;
  last_active: string;
  engagement_score: number;
  learning_velocity: number;
}

export interface CourseMetrics {
  course_id: string;
  title: string;
  total_enrollments: number;
  active_students: number;
  completion_rate: number;
  average_completion_time: number;
  difficulty_rating: number;
  satisfaction_score: number;
  drop_off_points: Array<{
    lesson_id: string;
    lesson_title: string;
    drop_off_rate: number;
    position: number;
  }>;
}

export interface ProblemMetrics {
  problem_id: string;
  title: string;
  total_attempts: number;
  success_rate: number;
  average_attempts: number;
  average_time: number;
  difficulty_score: number;
  common_errors: Array<{
    error_type: string;
    frequency: number;
    example: string;
  }>;
  language_stats: Record<string, {
    attempts: number;
    success_rate: number;
  }>;
}

export interface SystemMetrics {
  timestamp: string;
  active_users: number;
  total_sessions: number;
  server_response_time: number;
  error_rate: number;
  throughput: number;
  memory_usage: number;
  cpu_usage: number;
  database_connections: number;
  cache_hit_rate: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = true;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchFlush();
  }

  // Event Tracking
  trackEvent(eventType: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      event_type: eventType,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      platform: 'mobile',
      app_version: '1.0.0',
    };

    this.eventQueue.push(event);

    // Flush immediately for critical events
    if (this.isCriticalEvent(eventType)) {
      this.flushEvents();
    }
  }

  // User Actions
  trackUserLogin(userId: string, method: string = 'email') {
    this.userId = userId;
    this.trackEvent('user_login', {
      login_method: method,
      timestamp: new Date().toISOString(),
    });
  }

  trackUserLogout() {
    this.trackEvent('user_logout', {
      session_duration: this.getSessionDuration(),
    });
    this.userId = undefined;
  }

  trackCourseEnrollment(courseId: string, courseTitle: string) {
    this.trackEvent('course_enrollment', {
      course_id: courseId,
      course_title: courseTitle,
      timestamp: new Date().toISOString(),
    });
  }

  trackCourseProgress(courseId: string, lessonId: string, progress: number) {
    this.trackEvent('course_progress', {
      course_id: courseId,
      lesson_id: lessonId,
      progress_percentage: progress,
      timestamp: new Date().toISOString(),
    });
  }

  trackCourseCompletion(courseId: string, courseTitle: string, completionTime: number) {
    this.trackEvent('course_completion', {
      course_id: courseId,
      course_title: courseTitle,
      completion_time_seconds: completionTime,
      timestamp: new Date().toISOString(),
    });
  }

  trackProblemAttempt(problemId: string, language: string, code: string) {
    this.trackEvent('problem_attempt', {
      problem_id: problemId,
      programming_language: language,
      code_length: code.length,
      timestamp: new Date().toISOString(),
    });
  }

  trackProblemSubmission(problemId: string, success: boolean, timeSpent: number, attempts: number) {
    this.trackEvent('problem_submission', {
      problem_id: problemId,
      success: success,
      time_spent_seconds: timeSpent,
      attempt_number: attempts,
      timestamp: new Date().toISOString(),
    });
  }

  trackCodeExecution(language: string, success: boolean, executionTime: number) {
    this.trackEvent('code_execution', {
      programming_language: language,
      success: success,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
    });
  }

  trackAIInteraction(interactionType: string, query: string, responseTime: number) {
    this.trackEvent('ai_interaction', {
      interaction_type: interactionType,
      query_length: query.length,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    });
  }

  trackSocialActivity(activityType: string, targetType: string, targetId: string) {
    this.trackEvent('social_activity', {
      activity_type: activityType,
      target_type: targetType,
      target_id: targetId,
      timestamp: new Date().toISOString(),
    });
  }

  // Screen Tracking
  trackScreenView(screenName: string, properties: Record<string, any> = {}) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Error Tracking
  trackError(error: Error, context: Record<string, any> = {}) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance Tracking
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance', {
      metric_name: metricName,
      value: value,
      unit: unit,
      timestamp: new Date().toISOString(),
    });
  }

  // Analytics Data Retrieval
  async getUserMetrics(userId?: string): Promise<UserMetrics> {
    try {
      const targetUserId = userId || this.userId;
      if (!targetUserId) {
        throw new Error('User ID not available');
      }

      const response = await axios.get(`${ANALYTICS_BASE_URL}/users/${targetUserId}/metrics`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user metrics');
      }
    } catch (error: any) {
      console.error('Get User Metrics Error:', error);
      throw error.response?.data?.message || 'Failed to get user metrics';
    }
  }

  async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
    try {
      const response = await axios.get(`${ANALYTICS_BASE_URL}/courses/${courseId}/metrics`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get course metrics');
      }
    } catch (error: any) {
      console.error('Get Course Metrics Error:', error);
      throw error.response?.data?.message || 'Failed to get course metrics';
    }
  }

  async getProblemMetrics(problemId: string): Promise<ProblemMetrics> {
    try {
      const response = await axios.get(`${ANALYTICS_BASE_URL}/problems/${problemId}/metrics`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get problem metrics');
      }
    } catch (error: any) {
      console.error('Get Problem Metrics Error:', error);
      throw error.response?.data?.message || 'Failed to get problem metrics';
    }
  }

  async getSystemMetrics(timeRange: string = '24h'): Promise<SystemMetrics[]> {
    try {
      const response = await axios.get(`${ANALYTICS_BASE_URL}/system/metrics?range=${timeRange}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get system metrics');
      }
    } catch (error: any) {
      console.error('Get System Metrics Error:', error);
      throw error.response?.data?.message || 'Failed to get system metrics';
    }
  }

  async getLeaderboard(type: 'points' | 'streak' | 'courses' = 'points', limit: number = 10): Promise<Array<{
    rank: number;
    user_id: string;
    name: string;
    value: number;
    change: number;
  }>> {
    try {
      const response = await axios.get(`${ANALYTICS_BASE_URL}/leaderboard?type=${type}&limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get leaderboard');
      }
    } catch (error: any) {
      console.error('Get Leaderboard Error:', error);
      throw error.response?.data?.message || 'Failed to get leaderboard';
    }
  }

  // Event Management
  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = this.eventQueue.splice(0, this.batchSize);

    try {
      if (this.isOnline) {
        await this.sendEvents(eventsToSend);
      } else {
        // Store events locally when offline
        this.storeEventsOffline(eventsToSend);
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-queue events if sending failed
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]) {
    try {
      const response = await axios.post(`${ANALYTICS_BASE_URL}/events/batch`, {
        events: events,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send events');
      }
    } catch (error) {
      console.error('Send Events Error:', error);
      throw error;
    }
  }

  private storeEventsOffline(events: AnalyticsEvent[]) {
    // Store events in local storage for later sync
    try {
      const existingEvents = JSON.parse(localStorage.getItem('offline_events') || '[]');
      const updatedEvents = [...existingEvents, ...events];
      localStorage.setItem('offline_events', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Failed to store events offline:', error);
    }
  }

  private startBatchFlush() {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      'user_login',
      'user_logout',
      'course_completion',
      'problem_submission',
      'error',
    ];
    return criticalEvents.includes(eventType);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getSessionDuration(): number {
    // Calculate session duration (simplified - in real app, track session start time)
    return Math.floor(Math.random() * 3600); // Random duration for demo
  }

  // Utility Methods
  setUserId(userId: string) {
    this.userId = userId;
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.syncOfflineEvents();
    }
  }

  private async syncOfflineEvents() {
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('offline_events') || '[]');
      if (offlineEvents.length > 0) {
        await this.sendEvents(offlineEvents);
        localStorage.removeItem('offline_events');
      }
    } catch (error) {
      console.error('Failed to sync offline events:', error);
    }
  }

  // Analytics Summary
  async getAnalyticsSummary(timeRange: string = '7d') {
    try {
      const response = await axios.get(`${ANALYTICS_BASE_URL}/summary?range=${timeRange}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get analytics summary');
      }
    } catch (error: any) {
      console.error('Get Analytics Summary Error:', error);
      throw error.response?.data?.message || 'Failed to get analytics summary';
    }
  }
}

export default AnalyticsService;
