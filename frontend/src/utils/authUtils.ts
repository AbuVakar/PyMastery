/**
 * Authentication utilities for JWT token management and testing
 * Provides comprehensive token refresh mechanism and session management
 */

import { fixedApiService, type SessionUser } from '../services/fixedApi';

const navigateToLogin = () => {
  if (window.location.pathname === '/login') return;
  window.history.pushState({}, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error';
};

// Token management utilities
export const tokenUtils = {
  // Get tokens from storage
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser: (): SessionUser | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? (JSON.parse(userStr) as SessionUser) : null;
  },

  getTokenExpiry: (): number | null => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  },

  // Store tokens
  setTokens: (accessToken: string, refreshToken: string, user: SessionUser | null, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // Calculate expiry time (current time + expires_in in seconds)
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  // Clear all auth data
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  // Check if token is expired
  isTokenExpired: (): boolean => {
    const expiry = tokenUtils.getTokenExpiry();
    if (!expiry) return true;
    
    // Add 5-minute buffer before expiry
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= (expiry - bufferTime);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = tokenUtils.getAccessToken();
    const user = tokenUtils.getUser();
    const notExpired = !tokenUtils.isTokenExpired();
    
    return !!(token && user && notExpired);
  },

  // Get authorization header
  getAuthHeader: (): { Authorization?: string } => {
    const token = tokenUtils.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

// Enhanced token refresh mechanism
export class TokenRefreshManager {
  private static instance: TokenRefreshManager;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  // Refresh access token with proper queue management
  async refreshToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check if we have a refresh token
    const refreshToken = tokenUtils.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
      this.isRefreshing = false;
    }
  }

  private async performTokenRefresh(_refreshToken: string): Promise<string> {
    try {
      const response = await fixedApiService.auth.refreshToken();
      
      if (response.access_token) {
        // Update access token in storage
        localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
        
        // Update expiry time if provided
        if (response.expires_in) {
          const expiryTime = Date.now() + (response.expires_in * 1000);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
        
        return response.access_token;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (_error) {
      // Clear tokens on refresh failure
      tokenUtils.clearTokens();
      
      // Redirect to login if not already on login page
      if (window.location.pathname !== '/login') {
        navigateToLogin();
      }
      
      throw new Error('Token refresh failed');
    }
  }

  // Check if currently refreshing
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  // Reset refresh state
  resetRefreshState(): void {
    this.refreshPromise = null;
    this.isRefreshing = false;
  }
}

// Authentication testing utilities
export const authTestUtils = {
  // Test complete authentication flow
  testAuthFlow: async (email: string, password: string) => {
    try {
      // Step 1: Login
      const loginResponse = await fixedApiService.auth.login(email, password);
      
      if (!loginResponse.access_token || !loginResponse.refresh_token) {
        throw new Error('Login response missing tokens');
      }
      
      // Step 2: Test token storage
      tokenUtils.setTokens(
        loginResponse.access_token,
        loginResponse.refresh_token,
        loginResponse.user,
        loginResponse.expires_in || 1800
      );
      
      if (!tokenUtils.getAccessToken()) {
        throw new Error('Token storage failed');
      }
      
      // Step 3: Test authenticated API call
      const userResponse = await fixedApiService.auth.getCurrentUser();
      
      if (!userResponse) {
        throw new Error('Authenticated API call failed');
      }
      
      // Step 4: Test token refresh
      const refreshManager = TokenRefreshManager.getInstance();
      await refreshManager.refreshToken();
      
      // Step 5: Test API call after refresh
      const postRefreshUserResponse = await fixedApiService.auth.getCurrentUser();
      
      if (!postRefreshUserResponse) {
        throw new Error('Post-refresh API call failed');
      }
      
      // Step 6: Test logout
      await fixedApiService.auth.logout();
      
      if (tokenUtils.getAccessToken()) {
        throw new Error('Logout failed');
      }
      
      return {
        success: true,
        message: 'Complete authentication flow test passed'
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  },

  // Test token expiry and refresh
  testTokenExpiry: async () => {
    try {
      // Simulate token expiry
      const pastTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      localStorage.setItem(TOKEN_EXPIRY_KEY, pastTime.toString());
      
      // Try to make an API call (should trigger refresh)
      const refreshManager = TokenRefreshManager.getInstance();
      await refreshManager.refreshToken();
      
      // Verify new token is valid
      const newToken = tokenUtils.getAccessToken();
      if (!newToken) {
        throw new Error('Token refresh failed');
      }
      
      // Test API call with new token
      const userResponse = await fixedApiService.auth.getCurrentUser();
      if (!userResponse) {
        throw new Error('API call with new token failed');
      }
      
      return {
        success: true,
        message: 'Token expiry test passed'
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  },

  // Test concurrent refresh requests
  testConcurrentRefresh: async () => {
    try {
      const refreshManager = TokenRefreshManager.getInstance();
      
      // Simulate concurrent refresh requests
      const refreshPromises = [
        refreshManager.refreshToken(),
        refreshManager.refreshToken(),
        refreshManager.refreshToken()
      ];
      
      const results = await Promise.all(refreshPromises);
      
      // All results should be the same (no duplicate refreshes)
      const uniqueTokens = new Set(results);
      if (uniqueTokens.size > 1) {
        throw new Error('Concurrent refreshes returned different tokens');
      }
      
      return {
        success: true,
        message: 'Concurrent refresh test passed'
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  },

  // Test session persistence
  testSessionPersistence: () => {
    try {
      // Store test data
      const testData = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        user: { id: '1', name: 'Test User' } as SessionUser
      };
      
      tokenUtils.setTokens(testData.access_token, testData.refresh_token, testData.user, 1800);
      
      // Verify storage
      const storedToken = tokenUtils.getAccessToken();
      const storedUser = tokenUtils.getUser();
      
      if (!storedToken || !storedUser || storedUser.id !== '1') {
        throw new Error('Session persistence failed');
      }
      
      // Clean up test data
      tokenUtils.clearTokens();
      
      return {
        success: true,
        message: 'Session persistence test passed'
      };
      
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }
};

// Automatic token refresh interceptor
export const setupTokenRefreshInterceptor = () => {
  // Override the original fetch to add automatic token refresh
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestInit: RequestInit = init ? { ...init } : {};
    
    // Add auth header if token exists
    const token = tokenUtils.getAccessToken();
    if (token && !tokenUtils.isTokenExpired()) {
      requestInit.headers = {
        ...requestInit.headers,
        ...tokenUtils.getAuthHeader()
      };
    }
    
    let response = await originalFetch(input, requestInit);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      const refreshManager = TokenRefreshManager.getInstance();
      
      try {
        // Try to refresh token
        const newToken = await refreshManager.refreshToken();
        
        // Retry request with new token
        requestInit.headers = {
          ...requestInit.headers,
          Authorization: `Bearer ${newToken}`
        };
        
        response = await originalFetch(input, requestInit);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        tokenUtils.clearTokens();
        navigateToLogin();
        throw refreshError;
      }
    }
    
    return response;
  };
};

export default {
  tokenUtils,
  TokenRefreshManager,
  authTestUtils,
  setupTokenRefreshInterceptor
};
