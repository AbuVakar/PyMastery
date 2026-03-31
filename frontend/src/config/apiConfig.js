/**
 * API Configuration for PyMastery Frontend
 * Centralized API endpoints and configuration
 */

import { API_BASE_URL } from '../utils/apiBase';

const env = import.meta.env;
const FRONTEND_URL = env.VITE_FRONTEND_URL || 'http://localhost:5173';

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    PASSWORD_RESET_REQUEST: `${API_BASE_URL}/api/auth/password-reset-request`,
    PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/api/auth/password-reset-confirm`,
    VERIFY_EMAIL_REQUEST: `${API_BASE_URL}/api/auth/verify-email-request`,
    VERIFY_EMAIL_CONFIRM: `${API_BASE_URL}/api/auth/verify-email-confirm`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  },

  // Problems endpoints
  PROBLEMS: {
    LIST: `${API_BASE_URL}/api/v1/problems`,
    DETAIL: (id) => `${API_BASE_URL}/api/v1/problems/${id}`,
    CREATE: `${API_BASE_URL}/api/v1/problems`,
    UPDATE: (id) => `${API_BASE_URL}/api/v1/problems/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/v1/problems/${id}`,
    SEARCH: `${API_BASE_URL}/api/v1/problems/search`,
    BY_DIFFICULTY: (difficulty) => `${API_BASE_URL}/api/v1/problems/difficulty/${difficulty}`,
    BY_TAG: (tag) => `${API_BASE_URL}/api/v1/problems/tag/${tag}`,
  },

  // Code execution endpoints
  CODE_EXECUTION: {
    RUN: `${API_BASE_URL}/api/v1/code/execute`,
    SUBMIT: `${API_BASE_URL}/api/v1/code/submit`,
    BATCH_EXECUTE: `${API_BASE_URL}/api/v1/code/batch-execute`,
    TEST_RUN: `${API_BASE_URL}/api/v1/code/test-run`,
    LANGUAGES: `${API_BASE_URL}/api/v1/code/languages`,
    SERVICE_STATUS: `${API_BASE_URL}/api/v1/code/service-status`,
    SUBMISSIONS: (userId) => `${API_BASE_URL}/api/v1/code/submissions/${userId}`,
  },

  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/api/v1/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/v1/users/profile`,
    STATS: `${API_BASE_URL}/api/v1/users/stats`,
    ACTIVITY: `${API_BASE_URL}/api/v1/users/activity`,
    ACHIEVEMENTS: `${API_BASE_URL}/api/v1/users/achievements`,
    PROGRESS: `${API_BASE_URL}/api/v1/users/progress`,
    CERTIFICATES: `${API_BASE_URL}/api/v1/users/certificates`,
  },

  // Courses endpoints
  COURSES: {
    LIST: `${API_BASE_URL}/api/v1/courses`,
    DETAIL: (id) => `${API_BASE_URL}/api/v1/courses/${id}`,
    ENROLL: (id) => `${API_BASE_URL}/api/v1/courses/${id}/enroll`,
    UNENROLL: (id) => `${API_BASE_URL}/api/v1/courses/${id}/unenroll`,
    PROGRESS: (id) => `${API_BASE_URL}/api/v1/courses/${id}/progress`,
    LESSONS: (id) => `${API_BASE_URL}/api/v1/courses/${id}/lessons`,
    LESSON_DETAIL: (courseId, lessonId) => `${API_BASE_URL}/api/v1/courses/${courseId}/lessons/${lessonId}`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: `${API_BASE_URL}/api/v1/dashboard/stats`,
    ACTIVITY: `${API_BASE_URL}/api/v1/dashboard/activity`,
    COURSES: `${API_BASE_URL}/api/v1/dashboard/courses`,
    PERFORMERS: `${API_BASE_URL}/api/v1/dashboard/performers`,
    OVERVIEW: `${API_BASE_URL}/api/v1/dashboard/overview`,
  },

  // Leaderboards endpoints
  LEADERBOARDS: {
    LIST: `${API_BASE_URL}/api/v1/leaderboards`,
    MY_RANKING: `${API_BASE_URL}/api/v1/leaderboards/my-ranking`,
    TOP_PERFORMERS: `${API_BASE_URL}/api/v1/leaderboards/top-performers`,
    STATISTICS: `${API_BASE_URL}/api/v1/leaderboards/statistics`,
  },

  // Peer review endpoints
  PEER_REVIEW: {
    REQUEST: `${API_BASE_URL}/api/v1/peer-review/request`,
    MY_REQUESTS: `${API_BASE_URL}/api/v1/peer-review/my-requests`,
    AVAILABLE: `${API_BASE_URL}/api/v1/peer-review/available`,
    SUBMIT_REVIEW: `${API_BASE_URL}/api/v1/peer-review/submit-review`,
    SUMMARY: (id) => `${API_BASE_URL}/api/v1/peer-review/${id}/summary`,
    MY_REVIEWS: `${API_BASE_URL}/api/v1/peer-review/my-reviews`,
  },

  // Certificates endpoints
  CERTIFICATES: {
    GENERATE: `${API_BASE_URL}/api/v1/certificates/generate`,
    MY_CERTIFICATES: `${API_BASE_URL}/api/v1/certificates/my-certificates`,
    DOWNLOAD: (code) => `${API_BASE_URL}/api/v1/certificates/${code}/download`,
    VERIFY: (code) => `${API_BASE_URL}/api/v1/certificates/${code}/verify`,
    TEMPLATES: `${API_BASE_URL}/api/v1/certificates/templates`,
    SHARE: (id) => `${API_BASE_URL}/api/v1/certificates/${id}/share`,
  },

  // Export endpoints
  EXPORT: {
    REQUEST: `${API_BASE_URL}/api/v1/export/request`,
    MY_EXPORTS: `${API_BASE_URL}/api/v1/export/my-exports`,
    DOWNLOAD: (id) => `${API_BASE_URL}/api/v1/export/${id}/download`,
    TEMPLATES: `${API_BASE_URL}/api/v1/export/templates`,
    DELETE: (id) => `${API_BASE_URL}/api/v1/export/${id}`,
    ANALYTICS_SUMMARY: `${API_BASE_URL}/api/v1/export/analytics/summary`,
  },

  // Analytics endpoints
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/api/v1/analytics/overview`,
    PERFORMANCE: `${API_BASE_URL}/api/v1/analytics/performance`,
    PROGRESS: `${API_BASE_URL}/api/v1/analytics/progress`,
    ENGAGEMENT: `${API_BASE_URL}/api/v1/analytics/engagement`,
    REPORTS: `${API_BASE_URL}/api/v1/analytics/reports`,
    METRICS: `${API_BASE_URL}/api/v1/analytics/metrics`,
  },

  // Search endpoints
  SEARCH: {
    GLOBAL: `${API_BASE_URL}/api/v1/search`,
    SUGGESTIONS: `${API_BASE_URL}/api/v1/search/suggestions`,
    COURSES: `${API_BASE_URL}/api/v1/search/courses`,
    PROBLEMS: `${API_BASE_URL}/api/v1/search/problems`,
    USERS: `${API_BASE_URL}/api/v1/search/users`,
  },

  // OAuth endpoints
  OAUTH: {
    GOOGLE: `${API_BASE_URL}/api/oauth/google`,
    GITHUB: `${API_BASE_URL}/api/oauth/github`,
    CALLBACK: (provider) => `${API_BASE_URL}/api/oauth/${provider}/callback`,
  },
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  SHORT: 5000,      // 5 seconds
  MEDIUM: 10000,    // 10 seconds
  LONG: 30000,      // 30 seconds
  UPLOAD: 60000,    // 1 minute
  DOWNLOAD: 120000, // 2 minutes
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'text/plain',
    'application/pdf',
    'application/json',
    'text/x-python',
    'application/javascript',
    'text/x-java-source',
  ],
};

// Cache settings
export const CACHE_SETTINGS = {
  DEFAULT_TTL: 3600000, // 1 hour in milliseconds
  SHORT_TTL: 300000,    // 5 minutes
  LONG_TTL: 86400000,   // 24 hours
  KEYS: {
    USER_PROFILE: 'user_profile_',
    COURSE_LIST: 'course_list_',
    PROBLEM_LIST: 'problem_list_',
    DASHBOARD_STATS: 'dashboard_stats_',
  },
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful! Please check your email for verification.',
  PASSWORD_RESET_SUCCESS: 'Password reset instructions sent to your email.',
  EMAIL_VERIFIED_SUCCESS: 'Email verified successfully!',
  PROFILE_UPDATED_SUCCESS: 'Profile updated successfully!',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully!',
  COURSE_ENROLLED_SUCCESS: 'Successfully enrolled in the course!',
  PROBLEM_SUBMITTED_SUCCESS: 'Problem submitted successfully!',
};

// Loading messages
export const LOADING_MESSAGES = {
  AUTHENTICATING: 'Authenticating...',
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading...',
  DOWNLOADING: 'Downloading...',
  PROCESSING: 'Processing...',
  GENERATING: 'Generating...',
};

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PROBLEM_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  COURSE_TITLE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 200,
  },
};

// Theme configuration
export const THEME_CONFIG = {
  DEFAULT: 'light',
  AVAILABLE: ['light', 'dark'],
  STORAGE_KEY: 'pymastery_theme',
};

// Language configuration
export const LANGUAGE_CONFIG = {
  DEFAULT: 'en',
  AVAILABLE: ['en', 'hi', 'es', 'fr', 'de', 'ja', 'zh'],
  STORAGE_KEY: 'pymastery_language',
};

// Feature flags
export const FEATURE_FLAGS = {
  DARK_MODE: env.VITE_FEATURE_DARK_MODE === 'true',
  NOTIFICATIONS: env.VITE_FEATURE_NOTIFICATIONS === 'true',
  ANALYTICS: env.VITE_FEATURE_ANALYTICS === 'true',
  LIVE_CHAT: env.VITE_FEATURE_LIVE_CHAT === 'true',
  VIDEO_CALLS: env.VITE_FEATURE_VIDEO_CALLS === 'true',
};

// Development settings
export const DEV_SETTINGS = {
  LOG_API_CALLS: env.DEV,
  SHOW_PERFORMANCE_METRICS: env.DEV,
  ENABLE_DEBUG_PANEL: env.VITE_DEBUG_PANEL === 'true',
  MOCK_APIS: env.VITE_MOCK_APIS === 'true',
};

// Export configuration object
export const CONFIG = {
  API_BASE_URL,
  FRONTEND_URL,
  ENDPOINTS: API_ENDPOINTS,
  HTTP_METHODS,
  STATUS_CODES,
  CONTENT_TYPES,
  TIMEOUTS,
  PAGINATION,
  UPLOAD_LIMITS,
  CACHE_SETTINGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  VALIDATION_RULES,
  THEME_CONFIG,
  LANGUAGE_CONFIG,
  FEATURE_FLAGS,
  DEV_SETTINGS,
};

// Export default configuration
export default CONFIG;
