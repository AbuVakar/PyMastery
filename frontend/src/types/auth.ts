import { buildApiUrl } from '../utils/apiBase';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin' | 'mentor';
    avatar?: string;
    subscription?: 'free' | 'premium' | 'pro';
    createdAt: string;
  };
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export const fetchUserWithToken = async (token: string): Promise<Record<string, unknown>> => {
  try {
    const response = await fetch(buildApiUrl('/users/me'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(buildApiUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(buildApiUrl('/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginWithOAuth = async (provider: 'google' | 'github'): Promise<AuthResponse> => {
  try {
    const response = await fetch(buildApiUrl(`/auth/${provider}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`${provider} login failed`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('OAuth error:', error);
    throw error;
  }
};
