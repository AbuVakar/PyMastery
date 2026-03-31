/**
 * Fixed API Service for PyMastery Frontend
 * Resolves integration issues with backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/apiBase';

const isDev = import.meta.env.DEV;

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

const createRequestId = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const debugLog = (message: string, details?: unknown) => {
  if (isDev) {
    console.debug(message, details);
  }
};

const debugError = (message: string, details?: unknown) => {
  if (isDev) {
    console.error(message, details);
  }
};

const debugAuthNoise = (message: string, details?: unknown) => {
  if (isDev) {
    console.debug(message, details);
  }
};

export interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  role_track?: string;
  avatar?: string;
  subscription?: string;
  bio?: string;
  location?: string;
  phone?: string;
  createdAt?: string;
  [key: string]: unknown;
}

type ApiRecord = Record<string, unknown>;
type ApiErrorPayload = ApiRecord & {
  detail?: string;
  message?: string;
  error?: string;
  code?: string;
};

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  warning?: string;
  error?: string;
  token?: string;
  refresh_token?: string;
  user?: SessionUser | null;
  expires_in?: number;
  access_token?: string;  // Add backend's actual field
  requires_otp?: boolean;
}

export interface RuntimeFeatureStatus {
  configured?: boolean;
  mode?: 'live' | 'demo' | 'disabled';
  message?: string;
}

export interface AuthRuntimeStatus {
  email_service?: RuntimeFeatureStatus;
  google_oauth?: RuntimeFeatureStatus;
  login_otp?: {
    required?: boolean;
    mode?: 'live' | 'demo';
    message?: string;
  };
}

export interface AITutorStatus {
  available?: boolean;
  mode?: 'live' | 'demo';
  label?: string;
  message?: string;
}

const emitAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pymastery-auth-changed'));
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    public details?: unknown,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const parseStoredUser = (): SessionUser | null => {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as SessionUser;
  } catch (error) {
    debugError('Failed to parse stored user', error);
    localStorage.removeItem('user');
    return null;
  }
};

// Token utilities - FIXED STORAGE KEYS
const tokenUtils = {
  getTokens: () => ({
    access: localStorage.getItem('access_token'), // Fixed: match AuthProvider
    refresh: localStorage.getItem('refresh_token'),
    user: parseStoredUser()
  }),
  
  setTokens: (access: string, refresh: string, user: SessionUser | null, expiresIn?: number) => {
    localStorage.setItem('access_token', access); // Fixed: match AuthProvider
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    if (expiresIn) {
      const expiresAt = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem('token_expires_at', expiresAt.toString());
    }
    emitAuthChange();
  },
  
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    emitAuthChange();
  },
  
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!token) return false;
    if (!expiresAt) return true;

    const expiresAtValue = Number(expiresAt);
    if (Number.isNaN(expiresAtValue)) {
      return true;
    }

    return Date.now() < expiresAtValue;
  },

  hasActiveSession: (): boolean => {
    const { user } = tokenUtils.getTokens();
    return tokenUtils.isAuthenticated() && Boolean(user);
  }
};

const navigateToLogin = () => {
  if (window.location.pathname === '/login') return;
  window.history.pushState({}, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Create Axios instance with proper configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = tokenUtils.getTokens().access;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request ID for debugging
      config.headers['X-Request-ID'] = createRequestId();
      
      debugLog(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
      
      return config;
    },
    (error) => {
      debugError('[API] Request interceptor error', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      debugLog(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} completed`, {
        status: response.status,
        data: response.data
      });
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined;
      const status = error.response?.status;
      const hasRefreshToken = Boolean(tokenUtils.getTokens().refresh);
      
      const logMessage = `[API] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} failed`;
      const logPayload = {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      };

      if (status === 401 && !hasRefreshToken) {
        debugAuthNoise(logMessage, logPayload);
      } else {
        debugError(logMessage, logPayload);
      }

      // Handle 401 Unauthorized - Try token refresh
      if (status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = tokenUtils.getTokens().refresh;
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken
            });
            
            const { access_token, refresh_token: new_refresh_token, user } = response.data;
            
            // Update tokens
            tokenUtils.setTokens(
              access_token,
              new_refresh_token || refreshToken,
              user,
              response.data.expires_in || 1800
            );
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            
            return instance(originalRequest);
          }
        } catch (refreshError) {
          debugError('[API] Token refresh failed', refreshError);
          tokenUtils.clearTokens();
          navigateToLogin();
        }
      }

      // Handle network errors
      if (!error.response) {
        throw new ApiError(
          'Network error. Please check your internet connection.',
          error,
          0,
          'NETWORK_ERROR'
        );
      }

      // Handle API errors
      const errorData = error.response?.data as ApiErrorPayload | undefined;
      const errorMessage = errorData?.detail || 
                          errorData?.message || 
                          errorData?.error ||
                          'An unexpected error occurred';
      
      throw new ApiError(
        errorMessage,
        error.response?.data,
        error.response?.status,
        errorData?.code
      );
    }
  );

  return instance;
};

// Create API instance
const apiInstance = createApiInstance();

// Fixed API Service
export const fixedApiService = {
  // Authentication endpoints - FIXED TO MATCH BACKEND
  auth: {
    login: async (email: string, password: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/login', {
          email,
          password
        });
        
        const backendData = response.data;
        
        // Store tokens on successful login
        if (backendData.access_token && backendData.refresh_token) {
          tokenUtils.setTokens(
            backendData.access_token,
            backendData.refresh_token,
            backendData.user,
            backendData.expires_in || 1800
          );
        }
        
        // Check if OTP is required
        if (backendData.requires_otp) {
          return {
            success: true,
            requires_otp: true,
            message: backendData.message || 'OTP sent'
          };
        }

        // Convert backend response to frontend format
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in,
          message: backendData.message,
          warning: backendData.warning
        };
      } catch (error) {
        debugError('Login error', error);
        throw error;
      }
    },

    verifyOtp: async (email: string, otp: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/verify-login-otp', {
          email,
          otp
        });
        
        const backendData = response.data;
        
        if (backendData.access_token && backendData.refresh_token) {
          tokenUtils.setTokens(backendData.access_token, backendData.refresh_token, backendData.user, backendData.expires_in || 1800);
        }
        
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in,
          message: backendData.message,
          warning: backendData.warning
        };
      } catch (error) {
        debugError('Verify OTP error', error);
        throw error;
      }
    },

    register: async (userData: {
      name: string;
      email: string;
      password: string;
      role_track?: string;
      agree_terms?: boolean;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/register', {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role_track: userData.role_track || 'general',
          agree_terms: userData.agree_terms ?? true
        });
        
        const backendData = response.data;
        
        // Store tokens on successful registration
        if (backendData.access_token && backendData.refresh_token) {
          tokenUtils.setTokens(
            backendData.access_token,
            backendData.refresh_token,
            backendData.user,
            backendData.expires_in || 1800
          );
        }
        
        // Check if OTP is required
        if (backendData.requires_otp) {
          return {
            success: true,
            requires_otp: true,
            message: backendData.message || 'OTP sent'
          };
        }

        // Convert backend response to frontend format
        return {
          success: true,
          token: backendData.access_token,
          refresh_token: backendData.refresh_token,
          user: backendData.user,
          expires_in: backendData.expires_in,
          message: backendData.message,
          warning: backendData.warning
        };
      } catch (error) {
        debugError('Registration error', error);
        throw error;
      }
    },

    logout: async (): Promise<void> => {
      try {
        await apiInstance.post('/api/v1/auth/logout');
      } catch (error) {
        debugError('Logout error', error);
      } finally {
        tokenUtils.clearTokens();
      }
    },

    refreshToken: async (): Promise<ApiResponse> => {
      const refreshToken = tokenUtils.getTokens().refresh;
      if (!refreshToken) {
        throw new ApiError('No refresh token available', null, 401, 'NO_REFRESH_TOKEN');
      }

      try {
        const response = await apiInstance.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token: new_refresh_token, user } = response.data;
        
        tokenUtils.setTokens(
          access_token,
          new_refresh_token || refreshToken,
          user,
          response.data.expires_in || 1800
        );
        
        return response.data;
      } catch (error) {
        debugError('Token refresh error', error);
        tokenUtils.clearTokens();
        throw error;
      }
    },

    getCurrentUser: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/auth/me');
        return response.data;
      } catch (error) {
        debugError('Get current user error', error);
        throw error;
      }
    },

    updateProfile: async (userData: Partial<SessionUser> & ApiRecord): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.put('/api/v1/auth/me', userData);
        return response.data;
      } catch (error) {
        debugError('Update profile error', error);
        throw error;
      }
    },

    requestPasswordReset: async (email: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/password-reset-request', { email });
        return {
          success: true,
          message: response.data?.message || 'Reset email sent',
          warning: response.data?.warning
        };
      } catch (error) {
        debugError('Password reset request error', error);
        throw error;
      }
    },

    confirmPasswordReset: async (token: string, new_password: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/password-reset-confirm', {
          token,
          new_password,
        });
        return { success: true, message: response.data?.message || 'Password reset successfully' };
      } catch (error) {
        debugError('Password reset confirm error', error);
        throw error;
      }
    },

    confirmEmailVerification: async (token: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/auth/verify-email-confirm', { token });
        return { success: true, message: response.data?.message || 'Email verified successfully' };
      } catch (error) {
        debugError('Email verification confirm error', error);
        throw error;
      }
    },

    getRuntimeStatus: async (): Promise<AuthRuntimeStatus> => {
      try {
        const response = await apiInstance.get('/api/v1/auth/runtime-status');
        return response.data;
      } catch (error) {
        debugError('Auth runtime status error', error);
        throw error;
      }
    },
  },

  // User endpoints
  users: {
    getProfile: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/users/me');
        return response.data;
      } catch (error) {
        debugError('Get profile error', error);
        throw error;
      }
    },

    updateProfile: async (userData: Partial<SessionUser> & ApiRecord): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.put('/api/users/me', userData);
        return response.data;
      } catch (error) {
        debugError('Update profile error', error);
        throw error;
      }
    },

    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/users/stats');
        return response.data;
      } catch (error) {
        debugError('Get stats error', error);
        throw error;
      }
    }
  },

  // Problems endpoints
  problems: {
    getList: async (params?: {
      page?: number;
      limit?: number;
      difficulty?: string;
      tag?: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/problems', { params });
        return response.data;
      } catch (error) {
        debugError('Get problems error', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get(`/api/v1/problems/${id}`);
        return response.data;
      } catch (error) {
        debugError('Get problem error', error);
        throw error;
      }
    },

    create: async (problemData: ApiRecord): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/problems', problemData);
        return response.data;
      } catch (error) {
        debugError('Create problem error', error);
        throw error;
      }
    }
  },

  // Code execution endpoints
  codeExecution: {
    execute: async (codeData: {
      source_code: string;
      language: string;
      stdin?: string;
      time_limit?: number;
      memory_limit?: number;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/code/execute', codeData);
        return response.data;
      } catch (error) {
        debugError('Code execution error', error);
        throw error;
      }
    },

    testRun: async (testData: {
      source_code: string;
      language: string;
      test_cases: Array<{ input: string; expected: string }>;
      time_limit?: number;
      memory_limit?: number;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/code/test-run', testData);
        return response.data;
      } catch (error) {
        debugError('Test run error', error);
        throw error;
      }
    },

    getServiceStatus: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/code/service-status');
        return response.data;
      } catch (error) {
        debugError('Code execution status error', error);
        throw error;
      }
    }
  },

  // Dashboard endpoints
  dashboard: {
    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/dashboard/stats');
        return response.data;
      } catch (error) {
        debugError('Get dashboard stats error', error);
        throw error;
      }
    },

    getActivity: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/dashboard/activity');
        return response.data;
      } catch (error) {
        debugError('Get dashboard activity error', error);
        throw error;
      }
    }
  },

  // Courses endpoints
  courses: {
    getList: async (params?: {
      page?: number;
      limit?: number;
      difficulty?: string;
      status?: string;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/v1/courses', { params });
        return response.data;
      } catch (error) {
        debugError('Get courses error', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get(`/api/v1/courses/${id}`);
        return response.data;
      } catch (error) {
        debugError('Get course error', error);
        throw error;
      }
    },

    enroll: async (courseId: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post(`/api/v1/courses/${courseId}/enroll`);
        return response.data;
      } catch (error) {
        debugError('Enroll course error', error);
        throw error;
      }
    }
  },

  // AI Tutor API
  aiTutor: {
    chat: async (messageData: {
      message: string;
      message_type: string;
      user_id: string;
      session_id?: string;
      context?: ApiRecord;
    }): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.post('/api/v1/ai-tutor/chat', messageData);
        return response.data;
      } catch (error) {
        debugError('AI Tutor chat error', error);
        throw error;
      }
    },

    getSession: async (sessionId: string): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get(`/api/v1/ai-tutor/session/${sessionId}`);
        return response.data;
      } catch (error) {
        debugError('Get AI session error', error);
        throw error;
      }
    },

    getStatus: async (): Promise<AITutorStatus> => {
      try {
        const response = await apiInstance.get('/api/v1/ai-tutor/status');
        return response.data;
      } catch (error) {
        debugError('AI Tutor status error', error);
        throw error;
      }
    }
  },

  // Health check
  health: {
    check: async (): Promise<ApiResponse> => {
      try {
        const response = await apiInstance.get('/api/health');
        return response.data;
      } catch (error) {
        debugError('Health check error', error);
        throw error;
      }
    }
  }
};

// Export utilities
export { tokenUtils };

// Export default
export default fixedApiService;
