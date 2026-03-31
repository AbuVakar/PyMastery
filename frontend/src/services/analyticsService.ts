/**
 * Analytics Service for PyMastery Frontend
 * Handles user behavior tracking and analytics data fetching
 */

// Create a simple HTTP client for analytics
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface DeviceConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

type NavigatorWithDeviceInfo = Navigator & {
  deviceMemory?: number;
  connection?: DeviceConnectionInfo;
};

interface PerformanceEntryWithDetails extends PerformanceEntry {
  url?: string;
  processingStart?: number;
  hadRecentInput?: boolean;
  value?: number;
}

interface SessionStartResponse {
  session_id: string;
}

interface UserEngagementResponse {
  engagement_metrics: UserEngagementMetrics[];
}

interface FeatureUsageResponse {
  feature_usage: PlatformAnalytics['feature_usage'];
}

// Simple HTTP client functions
const apiClient = {
  get: async <T = unknown>(url: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  post: async <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

export interface AnalyticsEvent {
  event_type: string;
  properties: Record<string, unknown>;
  session_id?: string;
}

export interface UserEngagementMetrics {
  user_id: string;
  date: string;
  session_count: number;
  total_time_seconds: number;
  page_views: number;
  problem_attempts: number;
  problem_solves: number;
  code_executions: number;
  ai_interactions: number;
  courses_started: number;
  courses_completed: number;
  login_count: number;
  error_count: number;
}

export interface RealTimeMetrics {
  timestamp: string;
  active_sessions: number;
  recent_events_5min: number;
  today_metrics: Record<string, unknown>;
  error_rate_last_hour: number;
  buffer_size: number;
}

export interface PlatformAnalytics {
  period: {
    start_date: string;
    end_date: string;
  };
  daily_active_users: Array<{ date: string; active_users: number }>;
  retention_metrics: Record<string, number>;
  feature_usage: Array<{
    feature_name: string;
    usage_count: number;
    unique_users: number;
  }>;
  course_completion: {
    courses: Array<{
      course_id: string;
      starts: number;
      completions: number;
      completion_rate: number;
    }>;
  };
  problem_analytics: {
    problems: Array<{
      problem_id: string;
      attempts: number;
      solves: number;
      success_rate: number;
      unique_attempters: number;
      unique_solvers: number;
    }>;
  };
  ai_usage: {
    ai_features: Array<{
      ai_feature: string;
      usage_count: number;
      unique_users: number;
      avg_response_time: number;
    }>;
  };
}

export interface UserBehaviorInsights {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  engagement_metrics: UserEngagementMetrics[];
  learning_patterns: {
    most_active_hour: number;
    most_active_day: number;
    activity_patterns: Array<{
      hour: number;
      day_of_week: number;
      activity_count: number;
    }>;
  };
  preferred_features: Array<{
    feature_name: string;
    usage_count: number;
  }>;
  progress_trends: Array<{
    _id: string;
    problems_solved: number;
    courses_completed: number;
  }>;
  engagement_score: {
    score: number;
    factors: Record<string, number>;
    grade: string;
  };
}

export interface DashboardSummary {
  role: string;
  real_time_metrics?: RealTimeMetrics;
  platform_analytics?: PlatformAnalytics;
  personal_insights?: UserBehaviorInsights;
}

class AnalyticsService {
  private currentSessionId: string | null = null;
  private isTracking = false;

  /**
   * Initialize analytics tracking
   */
  async initialize(): Promise<void> {
    try {
      // Start a new session
      await this.startSession();
      this.isTracking = true;
      
      // Track page view
      this.trackEvent('page_view', {
        page: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      });
      
      // Set up error tracking
      this.setupErrorTracking();
      
      // Set up performance tracking
      this.setupPerformanceTracking();
      
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Start an analytics session
   */
  async startSession(): Promise<string> {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      const response = await apiClient.post<SessionStartResponse>('/api/v1/analytics/session/start', {
        device_info: deviceInfo
      });
      
      if (response.success) {
        this.currentSessionId = response.data.session_id;
        return this.currentSessionId;
      }
      
      throw new Error('Failed to start session');
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * End the current analytics session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) return;
    
    try {
      await apiClient.post('/api/v1/analytics/session/end', {
        session_id: this.currentSessionId
      });
      
      this.currentSessionId = null;
      this.isTracking = false;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(eventType: string, properties: Record<string, unknown>): Promise<void> {
    if (!this.isTracking) return;
    
    try {
      const eventData: AnalyticsEvent = {
        event_type: eventType,
        properties,
        session_id: this.currentSessionId || undefined
      };
      
      await apiClient.post('/api/v1/analytics/track-event', eventData);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(path: string, title?: string): Promise<void> {
    await this.trackEvent('page_view', {
      page: path,
      title: title || document.title,
      referrer: document.referrer
    });
  }

  /**
   * Track user interaction
   */
  async trackInteraction(feature: string, action: string, details?: Record<string, unknown>): Promise<void> {
    await this.trackEvent('feature_used', {
      feature_name: feature,
      action,
      ...details
    });
  }

  /**
   * Track code execution
   */
  async trackCodeExecution(language: string, success: boolean, executionTime?: number): Promise<void> {
    await this.trackEvent('code_execution', {
      language,
      success,
      execution_time: executionTime
    });
  }

  /**
   * Track AI interaction
   */
  async trackAIInteraction(feature: string, responseTime?: number, success?: boolean): Promise<void> {
    await this.trackEvent('ai_interaction', {
      ai_feature: feature,
      response_time: responseTime,
      success
    });
  }

  /**
   * Track problem attempt
   */
  async trackProblemAttempt(problemId: string, language: string): Promise<void> {
    await this.trackEvent('problem_attempt', {
      problem_id: problemId,
      language
    });
  }

  /**
   * Track problem solve
   */
  async trackProblemSolve(problemId: string, attempts: number, timeSpent: number): Promise<void> {
    await this.trackEvent('problem_solve', {
      problem_id: problemId,
      attempts,
      time_spent: timeSpent
    });
  }

  /**
   * Track course progress
   */
  async trackCourseProgress(courseId: string, progress: number, action: 'start' | 'progress' | 'complete'): Promise<void> {
    await this.trackEvent(`course_${action}`, {
      course_id: courseId,
      progress
    });
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get<DashboardSummary>('/api/v1/analytics/dashboard/summary');
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch dashboard summary');
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const response = await apiClient.get<RealTimeMetrics>('/api/v1/analytics/real-time');
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch real-time metrics');
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(startDate?: string, endDate?: string, days: number = 30): Promise<PlatformAnalytics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (days !== 30) params.append('days', days.toString());
      
      const response = await apiClient.get<PlatformAnalytics>(`/api/v1/analytics/platform?${params}`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch platform analytics');
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get user behavior insights
   */
  async getUserBehaviorInsights(userId: string, days: number = 30): Promise<UserBehaviorInsights> {
    try {
      const response = await apiClient.get<UserBehaviorInsights>(`/api/v1/analytics/user/${userId}/behavior?days=${days}`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch user behavior insights');
    } catch (error) {
      console.error('Error fetching user behavior insights:', error);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(
    userId: string,
    startDate?: string,
    endDate?: string,
    days: number = 30
  ): Promise<UserEngagementMetrics[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (days !== 30) params.append('days', days.toString());
      
      const response = await apiClient.get<UserEngagementResponse>(`/api/v1/analytics/user/${userId}/engagement?${params}`);
      
      if (response.success) {
        return response.data.engagement_metrics;
      }
      
      throw new Error('Failed to fetch user engagement metrics');
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureUsageAnalytics(
    startDate?: string,
    endDate?: string,
    days: number = 30
  ): Promise<PlatformAnalytics['feature_usage']> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (days !== 30) params.append('days', days.toString());
      
      const response = await apiClient.get<FeatureUsageResponse>(`/api/v1/analytics/feature-usage?${params}`);
      
      if (response.success) {
        return response.data.feature_usage;
      }
      
      throw new Error('Failed to fetch feature usage analytics');
    } catch (error) {
      console.error('Error fetching feature usage analytics:', error);
      throw error;
    }
  }

  /**
   * Get learning progress analytics
   */
  async getLearningProgressAnalytics(
    startDate?: string,
    endDate?: string,
    days: number = 30
  ): Promise<Record<string, unknown>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (days !== 30) params.append('days', days.toString());
      
      const response = await apiClient.get<Record<string, unknown>>(`/api/v1/analytics/learning-progress?${params}`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error('Failed to fetch learning progress analytics');
    } catch (error) {
      console.error('Error fetching learning progress analytics:', error);
      throw error;
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent('error_occurred', {
        error_message: event.message,
        error_filename: event.filename,
        error_lineno: event.lineno,
        error_colno: event.colno,
        error_stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error_occurred', {
        error_type: 'unhandled_promise_rejection',
        error_message: event.reason?.message || String(event.reason),
        error_stack: event.reason?.stack
      });
    });
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    // Track page load performance
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          
          this.trackEvent('page_performance', {
            load_time: nav.loadEventEnd - nav.loadEventStart,
            dom_content_loaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
            first_paint: nav.responseStart - nav.requestStart,
            transfer_size: nav.transferSize,
            encoded_body_size: nav.encodedBodySize
          });
        }
      }, 0);
    }

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.trackEvent('performance_metric', {
            metric_name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            url: (lastEntry as PerformanceEntryWithDetails).url || window.location.href
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (_error) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-input') {
              this.trackEvent('performance_metric', {
                metric_name: 'first_input_delay',
                value: (entry as PerformanceEntryWithDetails).processingStart! - entry.startTime,
                url: (entry as PerformanceEntryWithDetails).url || window.location.href
              });
            }
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (_error) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const layoutEntry = entry as PerformanceEntryWithDetails;
            if (!layoutEntry.hadRecentInput) {
              clsValue += layoutEntry.value ?? 0;
            }
          });
          
          this.trackEvent('performance_metric', {
            metric_name: 'cumulative_layout_shift',
            value: clsValue,
            url: window.location.href
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (_error) {
        console.warn('CLS observer not supported');
      }
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): Record<string, unknown> {
    const navigatorWithDeviceInfo = navigator as NavigatorWithDeviceInfo;

    return {
      user_agent: navigator.userAgent,
      screen_width: screen.width,
      screen_height: screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio,
      language: navigator.language,
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled,
      on_line: navigator.onLine,
      hardware_concurrency: navigator.hardwareConcurrency,
      memory: navigatorWithDeviceInfo.deviceMemory,
      connection: navigatorWithDeviceInfo.connection ? {
        effective_type: navigatorWithDeviceInfo.connection.effectiveType,
        downlink: navigatorWithDeviceInfo.connection.downlink,
        rtt: navigatorWithDeviceInfo.connection.rtt
      } : null
    };
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      analyticsService.initialize();
    });
  } else {
    analyticsService.initialize();
  }

  // Track page unload
  window.addEventListener('beforeunload', () => {
    analyticsService.endSession();
  });

  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analyticsService.trackEvent('page_hidden', {
        session_id: analyticsService.getCurrentSessionId()
      });
    } else {
      analyticsService.trackEvent('page_visible', {
        session_id: analyticsService.getCurrentSessionId()
      });
    }
  });
}
