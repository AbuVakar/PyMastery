import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  level: number;
  login_streak: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configure Axios
  useEffect(() => {
    const configureAxios = () => {
      // Request interceptor
      axios.interceptors.request.use(
        async (config) => {
          const token = await AsyncStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Response interceptor for token refresh
      axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              await refreshToken();
              const newToken = await AsyncStorage.getItem('access_token');
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              await logout();
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );
    };

    configureAxios();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { data } = response.data;
      
      if (data.access_token && data.refresh_token) {
        // Store tokens
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        
        // Store user data
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error.response?.data?.message || 'Login failed';
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        role: 'student',
      });

      const { data } = response.data;
      
      if (data.access_token && data.refresh_token) {
        // Store tokens
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        
        // Store user data
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error.response?.data?.message || 'Registration failed';
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token,
      });

      const { data } = response.data;
      
      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('refresh_token', data.refresh_token);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
