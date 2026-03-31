// Enhanced User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  role_track: RoleTrack;
  avatar_url?: string;
  bio?: string;
  login_streak: number;
  last_login?: string;
  is_active: boolean;
  points: number;
  level: number;
  subscription?: 'free' | 'premium' | 'pro';
  created_at: string;
  updated_at: string;
  lastLogin?: string;
}

export enum UserRole {
  STUDENT = "student",
  INSTRUCTOR = "instructor",
  ADMIN = "admin",
  MODERATOR = "moderator",
  MENTOR = "mentor"
}

export enum RoleTrack {
  BACKEND = "backend",
  DATA = "data",
  ML = "ml",
  AUTOMATION = "automation",
  FULLSTACK = "fullstack",
  DEVOPS = "devops",
  MOBILE = "mobile",
  GENERAL = "general"
}

// Navigation Types
export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  description: string;
  badge?: string;
  requiresAuth?: boolean;
  roles?: UserRole[];
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  enrolled_count: number;
  rating: number;
  instructor: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export enum Difficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

// Problem Types
export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  tags: string[];
  test_cases: TestCase[];
  solution?: string;
  hints: string[];
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Dashboard Types
export interface DashboardStats {
  total_users: number;
  total_courses: number;
  total_problems: number;
  completion_rate: number;
  active_users_today: number;
  average_session_time: number;
}

export interface UserProgress {
  user_id: string;
  courses_completed: number;
  problems_solved: number;
  points_earned: number;
  current_streak: number;
  longest_streak: number;
  time_spent: number;
  last_activity: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role_track: RoleTrack;
  agree_terms: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Existing types from before
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  socialLogin: (provider: 'google' | 'github') => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface CurriculumModule {
  id: string;
  title: string;
  difficulty: Difficulty;
  estimatedTime: string;
  description?: string;
  completed?: boolean;
  progress?: number;
}

export interface TrapZone {
  commonMistakes: string[];
  trickyQuestions: string[];
  hints?: string[];
}

export interface PythonWild {
  realWorldUse: string;
  example: string;
  industryInsight: string;
}

export interface PlacementTrack {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  stages: PlacementStage[];
}

export interface PlacementStage {
  id: number;
  title: string;
  description: string;
  topics: string[];
  practiceTests?: number;
  avgScore?: number;
  completed?: boolean;
}

export interface AIMessage {
  type: 'user' | 'ai';
  text?: string;
  message?: string;
  hint?: string;
  codeExample?: string;
  steps?: string[];
  tips?: string[];
  tip?: string;
  followUp?: string;
  encouragement?: string;
  timestamp: Date;
}

export interface CodeAnalysis {
  issues: string[];
  suggestions: string[];
  complexity: 'Low' | 'Medium' | 'High';
  bestPractices: string | number;
}

export interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    completionRate: number;
    avgSessionTime: number;
    totalRevenue: number;
  };
  engagement: {
    dailyLogins: number[];
    courseProgress: number[];
    problemSolving: number[];
    codeSubmissions: number[];
  };
  learning: {
    trendingTopics: Array<{
      topic: string;
      count: number;
      difficulty: string;
    }>;
    commonMistakes: Array<{
      mistake: string;
      frequency: number;
      category: string;
    }>;
  };
}

export interface SupportTicket {
  id: number;
  user: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  created: string;
  category: string;
  description?: string;
}

// Search Types
export interface SearchFilters {
  difficulty?: Difficulty[];
  tags?: string[];
  duration?: {
    min: number;
    max: number;
  };
  rating?: number;
  category?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'problem' | 'user' | 'content';
  url: string;
  relevance_score: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
