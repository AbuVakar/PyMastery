import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storage.get('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = storage.get('token');
      if (storedToken) {
        try {
          const userData = await apiService.get('/auth/me');
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          storage.remove('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/login', { email, password });
      setUser(response.user);
      setToken(response.token);
      storage.set('token', response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/register', { name, email, password });
      setUser(response.user);
      setToken(response.token);
      storage.set('token', response.token);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    storage.remove('token');
  };

  const loginWithOAuth = async (provider) => {
    try {
      setLoading(true);
      const response = await apiService.post(`/auth/oauth/${provider}`);
      setUser(response.user);
      setToken(response.token);
      storage.set('token', response.token);
    } catch (error) {
      console.error('OAuth login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setTokenAndUser = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    storage.set('token', userToken);
  };

  const updateRole = async (role) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      
      if (response.ok) {
        setUser(prev => ({ ...prev, role_track: role }));
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      console.error('Role update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    loginWithOAuth,
    register,
    logout,
    updateRole,
    setTokenAndUser,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
