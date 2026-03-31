import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Learning goals types
export interface LearningGoal {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  category: 'skill' | 'knowledge' | 'project' | 'career' | 'personal';
  type: 'short_term' | 'medium_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  targetDate: string;
  createdDate: string;
  completedDate?: string;
  progress: number; // 0-100
  milestones: GoalMilestone[];
  tasks: GoalTask[];
  metrics: GoalMetrics;
  motivation: GoalMotivation;
  resources: GoalResource[];
  adaptations: GoalAdaptation[];
  reflections: GoalReflection[];
  tags: string[];
}

export interface GoalMilestone {
  milestoneId: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  dependencies: string[]; // Other milestone IDs
  rewards: string[];
  criteria: string[];
  evidence?: string;
}

export interface GoalTask {
  taskId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  actualTime?: string;
  dueDate: string;
  completedDate?: string;
  dependencies: string[]; // Other task IDs
  subtasks: GoalSubtask[];
  resources: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  completedBy?: string; // For collaborative goals
}

export interface GoalSubtask {
  subtaskId: string;
  title: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

export interface GoalMetrics {
  progressMetrics: ProgressMetric[];
  timeMetrics: TimeMetric[];
  qualityMetrics: QualityMetric[];
  engagementMetrics: EngagementMetric[];
  performanceMetrics: PerformanceMetric[];
}

export interface ProgressMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: string;
}

export interface TimeMetric {
  name: string;
  timeSpent: number; // in minutes
  timeAllocated: number; // in minutes
  efficiency: number; // 0-100
  pace: 'ahead' | 'on_track' | 'behind';
  lastUpdated: string;
}

export interface QualityMetric {
  name: string;
  score: number; // 0-100
  targetScore: number;
  feedback: string;
  improvements: string[];
  lastUpdated: string;
}

export interface EngagementMetric {
  name: string;
  value: number;
  targetValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  lastUpdated: string;
}

export interface PerformanceMetric {
  name: string;
  score: number;
  benchmark: number;
  percentile: number;
  improvement: number; // percentage change
  lastUpdated: string;
}

export interface GoalMotivation {
  intrinsic: string[];
  extrinsic: string[];
  inspiration: string;
  vision: string;
  rewards: GoalReward[];
  challenges: GoalChallenge[];
  supportSystem: SupportSystem;
}

export interface GoalReward {
  type: 'milestone' | 'completion' | 'consistency' | 'achievement';
  description: string;
  value: string;
  earned: boolean;
  earnedDate?: string;
}

export interface GoalChallenge {
  type: 'internal' | 'external' | 'resource' | 'time';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  strategies: string[];
  status: 'active' | 'resolved' | 'monitoring';
}

export interface SupportSystem {
  mentors: string[];
  peers: string[];
  resources: string[];
  accountability: AccountabilityPartner[];
}

export interface AccountabilityPartner {
  name: string;
  role: string;
  contact: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  lastCheckIn: string;
}

export interface GoalResource {
  type: 'course' | 'book' | 'video' | 'tool' | 'mentor' | 'community';
  title: string;
  description: string;
  url?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  rating?: number; // 1-5
  notes?: string;
  addedDate: string;
}

export interface GoalAdaptation {
  adaptationId: string;
  date: string;
  reason: string;
  changes: AdaptationChange[];
  impact: string;
  effectiveness: number; // 0-100
  approved: boolean;
}

export interface AdaptationChange {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

export interface GoalReflection {
  reflectionId: string;
  date: string;
  type: 'weekly' | 'monthly' | 'milestone' | 'completion';
  content: string;
  insights: string[];
  challenges: string[];
  achievements: string[];
  nextSteps: string[];
  mood: 'frustrated' | 'neutral' | 'motivated' | 'excited' | 'proud';
  rating: number; // 1-5
}

// Goals tracking context
interface GoalsContextType {
  goals: LearningGoal[];
  loading: boolean;
  error: string | null;
  createGoal: (goal: Omit<LearningGoal, 'goalId' | 'createdDate'>) => Promise<LearningGoal>;
  updateGoal: (goalId: string, updates: Partial<LearningGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  getGoal: (goalId: string) => LearningGoal | null;
  getGoalsByCategory: (category: LearningGoal['category']) => LearningGoal[];
  getGoalsByStatus: (status: LearningGoal['status']) => LearningGoal[];
  getActiveGoals: () => LearningGoal[];
  getCompletedGoals: () => LearningGoal[];
  getOverdueGoals: () => LearningGoal[];
  updateGoalProgress: (goalId: string, progress: number) => Promise<void>;
  completeMilestone: (goalId: string, milestoneId: string, evidence?: string) => Promise<void>;
  completeTask: (goalId: string, taskId: string, actualTime?: string) => Promise<void>;
  addReflection: (goalId: string, reflection: Omit<GoalReflection, 'reflectionId'>) => Promise<void>;
  getGoalAnalytics: (goalId: string) => GoalAnalytics;
  getGoalsOverview: () => GoalsOverview;
  exportGoals: (format: 'json' | 'csv') => Promise<string>;
  scheduleGoalReminders: (goalId: string, frequency: 'daily' | 'weekly' | 'custom') => Promise<void>;
}

export interface GoalAnalytics {
  progressTrend: ProgressTrend;
  timeAnalysis: TimeAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  predictionAnalysis: PredictionAnalysis;
  comparativeAnalysis: ComparativeAnalysis;
  recommendations: GoalRecommendation[];
}

export interface ProgressTrend {
  current: number;
  trend: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  velocity: number; // progress per day
  acceleration: number; // change in velocity
  projectedCompletion: string;
  confidence: number; // 0-100
}

export interface TimeAnalysis {
  totalTimeSpent: number; // in minutes
  timePerMilestone: number; // in minutes
  efficiency: number; // 0-100
  pace: 'ahead' | 'on_track' | 'behind';
  timeDistribution: TimeDistribution[];
  optimization: TimeOptimization[];
}

export interface TimeDistribution {
  activity: string;
  timeSpent: number;
  percentage: number;
  efficiency: number;
}

export interface TimeOptimization {
  area: string;
  currentEfficiency: number;
  potentialImprovement: number;
  recommendations: string[];
}

export interface PerformanceAnalysis {
  qualityScore: number; // 0-100
  consistencyScore: number; // 0-100
  engagementScore: number; // 0-100
  overallPerformance: number; // 0-100
  strengths: string[];
  improvements: string[];
}

export interface PredictionAnalysis {
  completionProbability: number; // 0-100
  estimatedCompletionDate: string;
  riskFactors: RiskFactor[];
  successFactors: SuccessFactor[];
  scenarios: CompletionScenario[];
}

export interface RiskFactor {
  factor: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
}

export interface SuccessFactor {
  factor: string;
  contribution: number; // 0-100
  enhancement: string[];
}

export interface CompletionScenario {
  scenario: 'best_case' | 'likely' | 'worst_case';
  probability: number; // 0-100
  completionDate: string;
  quality: 'high' | 'medium' | 'low';
  requirements: string[];
}

export interface ComparativeAnalysis {
  peerComparison: PeerComparison;
  historicalComparison: HistoricalComparison;
  benchmarkComparison: BenchmarkComparison;
}

export interface PeerComparison {
  userPercentile: number;
  averageProgress: number;
  userRank: number;
  totalUsers: number;
  performance: 'above_average' | 'average' | 'below_average';
}

export interface HistoricalComparison {
  previousPeriods: HistoricalPeriod[];
  trends: Trend[];
  patterns: Pattern[];
}

export interface HistoricalPeriod {
  period: string;
  progress: number;
  timeSpent: number;
  quality: number;
  engagement: number;
}

export interface Trend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  significance: 'low' | 'medium' | 'high';
}

export interface Pattern {
  pattern: string;
  frequency: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface BenchmarkComparison {
  benchmarks: Benchmark[];
  performance: 'exceeding' | 'meeting' | 'below';
  gaps: string[];
  achievements: string[];
}

export interface Benchmark {
  metric: string;
  benchmark: number;
  userValue: number;
  performance: number; // percentage of benchmark
}

export interface GoalRecommendation {
  type: 'optimization' | 'motivation' | 'resource' | 'strategy' | 'adjustment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  successProbability: number; // 0-100
}

export interface GoalsOverview {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overdueGoals: number;
  overallProgress: number;
  categoryBreakdown: CategoryBreakdown[];
  statusBreakdown: StatusBreakdown[];
  priorityBreakdown: PriorityBreakdown[];
  timelineAnalysis: TimelineAnalysis;
  upcomingDeadlines: UpcomingDeadline[];
  recentAchievements: RecentAchievement[];
}

export interface CategoryBreakdown {
  category: LearningGoal['category'];
  count: number;
  progress: number;
  completionRate: number;
}

export interface StatusBreakdown {
  status: LearningGoal['status'];
  count: number;
  percentage: number;
}

export interface PriorityBreakdown {
  priority: LearningGoal['priority'];
  count: number;
  averageProgress: number;
}

export interface TimelineAnalysis {
  shortTermGoals: number;
  mediumTermGoals: number;
  longTermGoals: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
}

export interface UpcomingDeadline {
  goalId: string;
  goalTitle: string;
  deadline: string;
  daysUntil: number;
  progress: number;
  priority: LearningGoal['priority'];
  status: LearningGoal['status'];
}

export interface RecentAchievement {
  goalId: string;
  goalTitle: string;
  achievement: string;
  date: string;
  type: 'milestone' | 'completion' | 'progress';
}

// Goals tracking engine
class GoalsTrackingEngine {
  static async createGoal(goalData: Omit<LearningGoal, 'goalId' | 'createdDate'>): Promise<LearningGoal> {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();

    const goal: LearningGoal = {
      ...goalData,
      goalId,
      createdDate,
      progress: 0,
      milestones: goalData.milestones || [],
      tasks: goalData.tasks || [],
      metrics: this.initializeMetrics(),
      motivation: goalData.motivation || this.initializeMotivation(),
      resources: goalData.resources || [],
      adaptations: goalData.adaptations || [],
      reflections: goalData.reflections || [],
      tags: goalData.tags || [],
    };

    return goal;
  }

  static initializeMetrics(): GoalMetrics {
    return {
      progressMetrics: [],
      timeMetrics: [],
      qualityMetrics: [],
      engagementMetrics: [],
      performanceMetrics: [],
    };
  }

  static initializeMotivation(): GoalMotivation {
    return {
      intrinsic: [],
      extrinsic: [],
      inspiration: '',
      vision: '',
      rewards: [],
      challenges: [],
      supportSystem: {
        mentors: [],
        peers: [],
        resources: [],
        accountability: [],
      },
    };
  }

  static updateGoalProgress(goal: LearningGoal, newProgress: number): LearningGoal {
    const updatedGoal = { ...goal };
    updatedGoal.progress = Math.min(100, Math.max(0, newProgress));

    // Update status based on progress
    if (updatedGoal.progress === 100 && updatedGoal.status !== 'completed') {
      updatedGoal.status = 'completed';
      updatedGoal.completedDate = new Date().toISOString();
    } else if (updatedGoal.progress > 0 && updatedGoal.status === 'not_started') {
      updatedGoal.status = 'in_progress';
    }

    // Update milestone progress
    updatedGoal.milestones = updatedGoal.milestones.map(milestone => ({
      ...milestone,
      progress: Math.min(100, (updatedGoal.progress / 100) * 100),
    }));

    return updatedGoal;
  }

  static completeMilestone(goal: LearningGoal, milestoneId: string, evidence?: string): LearningGoal {
    const updatedGoal = { ...goal };
    const milestoneIndex = updatedGoal.milestones.findIndex(m => m.milestoneId === milestoneId);
    
    if (milestoneIndex !== -1) {
      updatedGoal.milestones[milestoneIndex] = {
        ...updatedGoal.milestones[milestoneIndex],
        status: 'completed',
        completedDate: new Date().toISOString(),
        progress: 100,
        evidence: evidence || '',
      };

      // Recalculate overall progress
      const completedMilestones = updatedGoal.milestones.filter(m => m.status === 'completed').length;
      const totalMilestones = updatedGoal.milestones.length;
      updatedGoal.progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    }

    return updatedGoal;
  }

  static completeTask(goal: LearningGoal, taskId: string, actualTime?: string): LearningGoal {
    const updatedGoal = { ...goal };
    const taskIndex = updatedGoal.tasks.findIndex(t => t.taskId === taskId);
    
    if (taskIndex !== -1) {
      updatedGoal.tasks[taskIndex] = {
        ...updatedGoal.tasks[taskIndex],
        status: 'completed',
        completedDate: new Date().toISOString(),
        actualTime: actualTime || updatedGoal.tasks[taskIndex].estimatedTime,
      };

      // Update progress based on completed tasks
      const completedTasks = updatedGoal.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = updatedGoal.tasks.length;
      const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Blend task progress with existing progress
      updatedGoal.progress = Math.min(100, (updatedGoal.progress + taskProgress) / 2);
    }

    return updatedGoal;
  }

  static addReflection(goal: LearningGoal, reflection: Omit<GoalReflection, 'reflectionId'>): LearningGoal {
    const updatedGoal = { ...goal };
    const reflectionId = `reflection_${Date.now()}`;
    
    updatedGoal.reflections = [
      ...updatedGoal.reflections,
      {
        ...reflection,
        reflectionId,
      },
    ];

    return updatedGoal;
  }

  static getGoalAnalytics(goal: LearningGoal): GoalAnalytics {
    const progressTrend = this.calculateProgressTrend(goal);
    const timeAnalysis = this.calculateTimeAnalysis(goal);
    const performanceAnalysis = this.calculatePerformanceAnalysis(goal);
    const predictionAnalysis = this.calculatePredictionAnalysis(goal);
    const comparativeAnalysis = this.calculateComparativeAnalysis(goal);
    const recommendations = this.generateGoalRecommendations(goal);

    return {
      progressTrend,
      timeAnalysis,
      performanceAnalysis,
      predictionAnalysis,
      comparativeAnalysis,
      recommendations,
    };
  }

  static calculateProgressTrend(goal: LearningGoal): ProgressTrend {
    const current = goal.progress;
    const trend = this.determineProgressTrend(goal);
    const velocity = this.calculateVelocity(goal);
    const acceleration = this.calculateAcceleration(goal);
    const projectedCompletion = this.projectCompletionDate(goal, velocity);
    const confidence = this.calculateConfidence(goal);

    return {
      current,
      trend,
      velocity,
      acceleration,
      projectedCompletion,
      confidence,
    };
  }

  static determineProgressTrend(goal: LearningGoal): 'accelerating' | 'steady' | 'decelerating' | 'stalled' {
    // Simplified trend determination
    const recentReflections = goal.reflections.slice(-5);
    if (recentReflections.length < 2) return 'steady';

    const recentProgress = recentReflections.map(r => {
      // Extract progress from reflection content (simplified)
      const progressMatch = r.content.match(/progress.*?(\d+)%/i);
      return progressMatch ? parseInt(progressMatch[1]) : 0;
    });

    if (recentProgress.length < 2) return 'steady';

    const trend = recentProgress[recentProgress.length - 1] - recentProgress[0];
    
    if (trend > 10) return 'accelerating';
    if (trend < -10) return 'decelerating';
    if (Math.abs(trend) < 5) return 'stalled';
    return 'steady';
  }

  static calculateVelocity(goal: LearningGoal): number {
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(goal.createdDate).getTime()) / (1000 * 60 * 60 * 24)));
    return goal.progress / daysSinceCreation;
  }

  static calculateAcceleration(goal: LearningGoal): number {
    // Simplified acceleration calculation
    return 0; // Would require historical velocity data
  }

  static projectCompletionDate(goal: LearningGoal, velocity: number): string {
    if (velocity <= 0) return 'Unable to project';
    
    const remainingProgress = 100 - goal.progress;
    const daysToComplete = Math.ceil(remainingProgress / velocity);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);
    
    return completionDate.toISOString();
  }

  static calculateConfidence(goal: LearningGoal): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on progress
    confidence += goal.progress * 0.3;

    // Increase confidence based on completed milestones
    const completedMilestones = goal.milestones.filter(m => m.status === 'completed').length;
    confidence += completedMilestones * 5;

    // Increase confidence based on recent activity
    const recentReflections = goal.reflections.filter(r => 
      new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    confidence += recentReflections.length * 3;

    return Math.min(100, Math.max(0, confidence));
  }

  static calculateTimeAnalysis(goal: LearningGoal): TimeAnalysis {
    const totalTimeSpent = this.calculateTotalTimeSpent(goal);
    const timePerMilestone = goal.milestones.length > 0 ? totalTimeSpent / goal.milestones.length : 0;
    const efficiency = this.calculateEfficiency(goal);
    const pace = this.determinePace(goal);
    const timeDistribution = this.calculateTimeDistribution(goal);
    const optimization = this.identifyTimeOptimizations(goal);

    return {
      totalTimeSpent,
      timePerMilestone,
      efficiency,
      pace,
      timeDistribution,
      optimization,
    };
  }

  static calculateTotalTimeSpent(goal: LearningGoal): number {
    return goal.tasks
      .filter(task => task.actualTime)
      .reduce((total, task) => {
        const time = parseInt(task.actualTime || '0');
        return total + time;
      }, 0);
  }

  static calculateEfficiency(goal: LearningGoal): number {
    const plannedTime = goal.tasks.reduce((total, task) => {
      const time = parseInt(task.estimatedTime || '0');
      return total + time;
    }, 0);

    const actualTime = this.calculateTotalTimeSpent(goal);
    
    if (plannedTime === 0) return 100;
    return Math.min(100, (plannedTime / actualTime) * 100);
  }

  static determinePace(goal: LearningGoal): 'ahead' | 'on_track' | 'behind' {
    const efficiency = this.calculateEfficiency(goal);
    if (efficiency > 110) return 'ahead';
    if (efficiency >= 90) return 'on_track';
    return 'behind';
  }

  static calculateTimeDistribution(goal: LearningGoal): TimeDistribution[] {
    // Simplified time distribution
    return [
      {
        activity: 'Learning',
        timeSpent: this.calculateTotalTimeSpent(goal) * 0.6,
        percentage: 60,
        efficiency: 85,
      },
      {
        activity: 'Practice',
        timeSpent: this.calculateTotalTimeSpent(goal) * 0.3,
        percentage: 30,
        efficiency: 90,
      },
      {
        activity: 'Review',
        timeSpent: this.calculateTotalTimeSpent(goal) * 0.1,
        percentage: 10,
        efficiency: 80,
      },
    ];
  }

  static identifyTimeOptimizations(goal: LearningGoal): TimeOptimization[] {
    return [
      {
        area: 'Task Planning',
        currentEfficiency: 75,
        potentialImprovement: 20,
        recommendations: ['Break down large tasks', 'Use time blocking'],
      },
      {
        area: 'Learning Methods',
        currentEfficiency: 80,
        potentialImprovement: 15,
        recommendations: ['Try active recall', 'Use spaced repetition'],
      },
    ];
  }

  static calculatePerformanceAnalysis(goal: LearningGoal): PerformanceAnalysis {
    const qualityScore = this.calculateQualityScore(goal);
    const consistencyScore = this.calculateConsistencyScore(goal);
    const engagementScore = this.calculateEngagementScore(goal);
    const overallPerformance = (qualityScore + consistencyScore + engagementScore) / 3;
    const strengths = this.identifyStrengths(goal);
    const improvements = this.identifyImprovements(goal);

    return {
      qualityScore,
      consistencyScore,
      engagementScore,
      overallPerformance,
      strengths,
      improvements,
    };
  }

  static calculateQualityScore(goal: LearningGoal): number {
    // Simplified quality calculation based on task completion and reflections
    const completedTasks = goal.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = goal.tasks.length;
    const taskQuality = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50;

    const reflectionQuality = goal.reflections.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, goal.reflections.length) * 20;

    return Math.min(100, (taskQuality + reflectionQuality) / 2);
  }

  static calculateConsistencyScore(goal: LearningGoal): number {
    const reflections = goal.reflections;
    if (reflections.length < 2) return 50;

    // Calculate consistency based on regular reflection patterns
    const dates = reflections.map(r => new Date(r.date).getTime()).sort();
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Lower variance = higher consistency
    const consistency = Math.max(0, 100 - (variance / (1000 * 60 * 60 * 24 * 7))); // Normalize to weeks
    return Math.min(100, consistency);
  }

  static calculateEngagementScore(goal: LearningGoal): number {
    const recentReflections = goal.reflections.filter(r => 
      new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const reflectionFrequency = recentReflections.length;
    const avgMood = recentReflections.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, recentReflections.length);
    
    return Math.min(100, (reflectionFrequency * 10) + (avgMood * 15));
  }

  static identifyStrengths(goal: LearningGoal): string[] {
    const strengths = [];
    
    if (goal.progress > 70) strengths.push('Strong progress momentum');
    if (goal.reflections.length > 5) strengths.push('Consistent self-reflection');
    if (this.calculateEfficiency(goal) > 90) strengths.push('Excellent time management');
    
    return strengths;
  }

  static identifyImprovements(goal: LearningGoal): string[] {
    const improvements = [];
    
    if (goal.progress < 30) improvements.push('Focus on consistent progress');
    if (goal.reflections.length < 2) improvements.push('Increase reflection frequency');
    if (this.calculateEfficiency(goal) < 80) improvements.push('Improve time efficiency');
    
    return improvements;
  }

  static calculatePredictionAnalysis(goal: LearningGoal): PredictionAnalysis {
    const completionProbability = this.calculateCompletionProbability(goal);
    const estimatedCompletionDate = this.estimateCompletionDate(goal);
    const riskFactors = this.identifyRiskFactors(goal);
    const successFactors = this.identifySuccessFactors(goal);
    const scenarios = this.generateCompletionScenarios(goal);

    return {
      completionProbability,
      estimatedCompletionDate,
      riskFactors,
      successFactors,
      scenarios,
    };
  }

  static calculateCompletionProbability(goal: LearningGoal): number {
    let probability = 50; // Base probability

    // Adjust based on current progress
    probability += goal.progress * 0.3;

    // Adjust based on time remaining
    const daysUntilDeadline = Math.floor((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline > 0) {
      const requiredVelocity = (100 - goal.progress) / daysUntilDeadline;
      const currentVelocity = this.calculateVelocity(goal);
      if (currentVelocity >= requiredVelocity) {
        probability += 20;
      } else {
        probability -= 20;
      }
    }

    // Adjust based on completed milestones
    const completedMilestones = goal.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = goal.milestones.length;
    if (totalMilestones > 0) {
      probability += (completedMilestones / totalMilestones) * 20;
    }

    return Math.min(100, Math.max(0, probability));
  }

  static estimateCompletionDate(goal: LearningGoal): string {
    const velocity = this.calculateVelocity(goal);
    if (velocity <= 0) return goal.targetDate; // Return target date if no progress
    
    return this.projectCompletionDate(goal, velocity);
  }

  static identifyRiskFactors(goal: LearningGoal): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    const daysUntilDeadline = Math.floor((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 7 && goal.progress < 80) {
      riskFactors.push({
        factor: 'Time Constraint',
        probability: 80,
        impact: 'high',
        mitigation: ['Increase daily effort', 'Extend deadline if possible'],
      });
    }

    if (goal.progress < 20) {
      riskFactors.push({
        factor: 'Low Progress',
        probability: 70,
        impact: 'medium',
        mitigation: ['Reassess strategy', 'Break down into smaller tasks'],
      });
    }

    return riskFactors;
  }

  static identifySuccessFactors(goal: LearningGoal): SuccessFactor[] {
    const successFactors: SuccessFactor[] = [];

    if (goal.progress > 50) {
      successFactors.push({
        factor: 'Strong Momentum',
        contribution: 30,
        enhancement: ['Maintain current pace', 'Build on success'],
      });
    }

    if (goal.motivation.intrinsic.length > 0) {
      successFactors.push({
        factor: 'Intrinsic Motivation',
        contribution: 25,
        enhancement: ['Connect to personal values', 'Celebrate small wins'],
      });
    }

    return successFactors;
  }

  static generateCompletionScenarios(goal: LearningGoal): CompletionScenario[] {
    const baseDate = new Date(goal.targetDate);
    
    return [
      {
        scenario: 'best_case',
        probability: 20,
        completionDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        quality: 'high',
        requirements: ['Maintain high productivity', 'No major obstacles'],
      },
      {
        scenario: 'likely',
        probability: 60,
        completionDate: goal.targetDate,
        quality: 'medium',
        requirements: ['Consistent effort', 'Manage challenges effectively'],
      },
      {
        scenario: 'worst_case',
        probability: 20,
        completionDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        quality: 'low',
        requirements: ['Overcome significant obstacles', 'Extended timeline'],
      },
    ];
  }

  static calculateComparativeAnalysis(goal: LearningGoal): ComparativeAnalysis {
    const peerComparison = this.calculatePeerComparison(goal);
    const historicalComparison = this.calculateHistoricalComparison(goal);
    const benchmarkComparison = this.calculateBenchmarkComparison(goal);

    return {
      peerComparison,
      historicalComparison,
      benchmarkComparison,
    };
  }

  static calculatePeerComparison(goal: LearningGoal): PeerComparison {
    // Mock peer comparison data
    return {
      userPercentile: 75,
      averageProgress: 65,
      userRank: 25,
      totalUsers: 100,
      performance: 'above_average',
    };
  }

  static calculateHistoricalComparison(goal: LearningGoal): HistoricalComparison {
    const periods = goal.reflections.map((reflection, index) => ({
      period: `Period ${index + 1}`,
      progress: goal.progress * (index + 1) / Math.max(1, goal.reflections.length),
      timeSpent: 0, // Would calculate from actual data
      quality: reflection.rating * 20,
      engagement: reflection.rating * 20,
    }));

    return {
      previousPeriods: periods,
      trends: [],
      patterns: [],
    };
  }

  static calculateBenchmarkComparison(goal: LearningGoal): BenchmarkComparison {
    const benchmarks = [
      { metric: 'Progress', benchmark: 70, userValue: goal.progress },
      { metric: 'Efficiency', benchmark: 80, userValue: this.calculateEfficiency(goal) },
      { metric: 'Quality', benchmark: 75, userValue: this.calculateQualityScore(goal) },
    ];

    const performance = benchmarks.reduce((sum, b) => sum + (b.userValue / b.benchmark * 100), 0) / benchmarks.length;

    return {
      benchmarks,
      performance: performance > 100 ? 'exceeding' : performance > 90 ? 'meeting' : 'below',
      gaps: benchmarks.filter(b => b.userValue < b.benchmark).map(b => b.metric),
      achievements: benchmarks.filter(b => b.userValue >= b.benchmark).map(b => b.metric),
    };
  }

  static generateGoalRecommendations(goal: LearningGoal): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    if (goal.progress < 30) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        title: 'Accelerate Progress',
        description: 'Your progress is slower than expected',
        rationale: 'Current velocity may not meet deadline',
        expectedImpact: '20% faster progress',
        difficulty: 'medium',
        estimatedTime: '2 hours',
        successProbability: 75,
      });
    }

    if (this.calculateEfficiency(goal) < 80) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Improve Time Efficiency',
        description: 'Optimize your time management',
        rationale: 'Current efficiency could be improved',
        expectedImpact: '15% time savings',
        difficulty: 'easy',
        estimatedTime: '1 hour',
        successProbability: 85,
      });
    }

    return recommendations;
  }

  static getGoalsOverview(goals: LearningGoal[]): GoalsOverview {
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'in_progress').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const overdueGoals = goals.filter(g => new Date(g.targetDate) < new Date() && g.status !== 'completed').length;
    const overallProgress = goals.reduce((sum, g) => sum + g.progress, 0) / Math.max(1, totalGoals);

    const categoryBreakdown = this.calculateCategoryBreakdown(goals);
    const statusBreakdown = this.calculateStatusBreakdown(goals);
    const priorityBreakdown = this.calculatePriorityBreakdown(goals);
    const timelineAnalysis = this.calculateTimelineAnalysis(goals);
    const upcomingDeadlines = this.getUpcomingDeadlines(goals);
    const recentAchievements = this.getRecentAchievements(goals);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      overdueGoals,
      overallProgress,
      categoryBreakdown,
      statusBreakdown,
      priorityBreakdown,
      timelineAnalysis,
      upcomingDeadlines,
      recentAchievements,
    };
  }

  static calculateCategoryBreakdown(goals: LearningGoal[]): CategoryBreakdown[] {
    const categories: LearningGoal['category'][] = ['skill', 'knowledge', 'project', 'career', 'personal'];
    
    return categories.map(category => {
      const categoryGoals = goals.filter(g => g.category === category);
      const count = categoryGoals.length;
      const progress = count > 0 ? categoryGoals.reduce((sum, g) => sum + g.progress, 0) / count : 0;
      const completionRate = count > 0 ? (categoryGoals.filter(g => g.status === 'completed').length / count) * 100 : 0;

      return { category, count, progress, completionRate };
    });
  }

  static calculateStatusBreakdown(goals: LearningGoal[]): StatusBreakdown[] {
    const statuses: LearningGoal['status'][] = ['not_started', 'in_progress', 'paused', 'completed', 'abandoned'];
    
    return statuses.map(status => {
      const count = goals.filter(g => g.status === status).length;
      const percentage = goals.length > 0 ? (count / goals.length) * 100 : 0;

      return { status, count, percentage };
    });
  }

  static calculatePriorityBreakdown(goals: LearningGoal[]): PriorityBreakdown[] {
    const priorities: LearningGoal['priority'][] = ['low', 'medium', 'high', 'urgent'];
    
    return priorities.map(priority => {
      const priorityGoals = goals.filter(g => g.priority === priority);
      const count = priorityGoals.length;
      const averageProgress = count > 0 ? priorityGoals.reduce((sum, g) => sum + g.progress, 0) / count : 0;

      return { priority, count, averageProgress };
    });
  }

  static calculateTimelineAnalysis(goals: LearningGoal[]): TimelineAnalysis {
    const shortTermGoals = goals.filter(g => g.type === 'short_term').length;
    const mediumTermGoals = goals.filter(g => g.type === 'medium_term').length;
    const longTermGoals = goals.filter(g => g.type === 'long_term').length;

    const completedGoals = goals.filter(g => g.status === 'completed');
    const averageCompletionTime = completedGoals.length > 0 
      ? completedGoals.reduce((sum, g) => {
          const days = Math.floor((new Date(g.completedDate || g.targetDate).getTime() - new Date(g.createdDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedGoals.length
      : 0;

    const onTimeCompletionRate = completedGoals.length > 0
      ? (completedGoals.filter(g => new Date(g.completedDate || g.targetDate) <= new Date(g.targetDate)).length / completedGoals.length) * 100
      : 0;

    return {
      shortTermGoals,
      mediumTermGoals,
      longTermGoals,
      averageCompletionTime,
      onTimeCompletionRate,
    };
  }

  static getUpcomingDeadlines(goals: LearningGoal[]): UpcomingDeadline[] {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return goals
      .filter(g => g.status !== 'completed' && new Date(g.targetDate) <= thirtyDaysFromNow)
      .map(goal => ({
        goalId: goal.goalId,
        goalTitle: goal.title,
        deadline: goal.targetDate,
        daysUntil: Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        progress: goal.progress,
        priority: goal.priority,
        status: goal.status,
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  static getRecentAchievements(goals: LearningGoal[]): RecentAchievement[] {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return goals
      .filter(g => g.status === 'completed' && new Date(g.completedDate || g.targetDate) > thirtyDaysAgo)
      .map(goal => ({
        goalId: goal.goalId,
        goalTitle: goal.title,
        achievement: 'Goal completed',
        date: goal.completedDate || goal.targetDate,
        type: 'completion' as const,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }
}

// Goals tracking provider
export const GoalsTrackingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved goals
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true);
        const savedGoals = await AsyncStorage.getItem('@learning_goals');
        
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
      } catch (err) {
        setError('Failed to load learning goals');
        console.error('Goals loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const createGoal = useCallback(async (goalData: Omit<LearningGoal, 'goalId' | 'createdDate'>): Promise<LearningGoal> => {
    try {
      const newGoal = await GoalsTrackingEngine.createGoal(goalData);
      
      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      await AsyncStorage.setItem('@learning_goals', JSON.stringify(updatedGoals));

      return newGoal;
    } catch (err) {
      setError('Failed to create goal');
      console.error('Goal creation error:', err);
      throw err;
    }
  }, [goals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<LearningGoal>): Promise<void> => {
    try {
      const goalIndex = goals.findIndex(g => g.goalId === goalId);
      if (goalIndex === -1) throw new Error('Goal not found');

      const updatedGoals = [...goals];
      updatedGoals[goalIndex] = { ...updatedGoals[goalIndex], ...updates };
      
      setGoals(updatedGoals);
      await AsyncStorage.setItem('@learning_goals', JSON.stringify(updatedGoals));
    } catch (err) {
      setError('Failed to update goal');
      console.error('Goal update error:', err);
      throw err;
    }
  }, [goals]);

  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    try {
      const updatedGoals = goals.filter(g => g.goalId !== goalId);
      setGoals(updatedGoals);
      await AsyncStorage.setItem('@learning_goals', JSON.stringify(updatedGoals));
    } catch (err) {
      setError('Failed to delete goal');
      console.error('Goal deletion error:', err);
      throw err;
    }
  }, [goals]);

  const getGoal = useCallback((goalId: string): LearningGoal | null => {
    return goals.find(g => g.goalId === goalId) || null;
  }, [goals]);

  const getGoalsByCategory = useCallback((category: LearningGoal['category']): LearningGoal[] => {
    return goals.filter(g => g.category === category);
  }, [goals]);

  const getGoalsByStatus = useCallback((status: LearningGoal['status']): LearningGoal[] => {
    return goals.filter(g => g.status === status);
  }, [goals]);

  const getActiveGoals = useCallback((): LearningGoal[] => {
    return goals.filter(g => g.status === 'in_progress');
  }, [goals]);

  const getCompletedGoals = useCallback((): LearningGoal[] => {
    return goals.filter(g => g.status === 'completed');
  }, [goals]);

  const getOverdueGoals = useCallback((): LearningGoal[] => {
    const now = new Date();
    return goals.filter(g => new Date(g.targetDate) < now && g.status !== 'completed');
  }, [goals]);

  const updateGoalProgress = useCallback(async (goalId: string, progress: number): Promise<void> => {
    const goal = getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    const updatedGoal = GoalsTrackingEngine.updateGoalProgress(goal, progress);
    await updateGoal(goalId, updatedGoal);
  }, [getGoal, updateGoal]);

  const completeMilestone = useCallback(async (goalId: string, milestoneId: string, evidence?: string): Promise<void> => {
    const goal = getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    const updatedGoal = GoalsTrackingEngine.completeMilestone(goal, milestoneId, evidence);
    await updateGoal(goalId, updatedGoal);
  }, [getGoal, updateGoal]);

  const completeTask = useCallback(async (goalId: string, taskId: string, actualTime?: string): Promise<void> => {
    const goal = getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    const updatedGoal = GoalsTrackingEngine.completeTask(goal, taskId, actualTime);
    await updateGoal(goalId, updatedGoal);
  }, [getGoal, updateGoal]);

  const addReflection = useCallback(async (goalId: string, reflection: Omit<GoalReflection, 'reflectionId'>): Promise<void> => {
    const goal = getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    const updatedGoal = GoalsTrackingEngine.addReflection(goal, reflection);
    await updateGoal(goalId, updatedGoal);
  }, [getGoal, updateGoal]);

  const getGoalAnalytics = useCallback((goalId: string): GoalAnalytics => {
    const goal = getGoal(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }
    return GoalsTrackingEngine.getGoalAnalytics(goal);
  }, [getGoal]);

  const getGoalsOverview = useCallback((): GoalsOverview => {
    return GoalsTrackingEngine.getGoalsOverview(goals);
  }, [goals]);

  const exportGoals = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
    const exportData = {
      goals,
      overview: getGoalsOverview(),
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [goals, getGoalsOverview]);

  const scheduleGoalReminders = useCallback(async (goalId: string, frequency: 'daily' | 'weekly' | 'custom'): Promise<void> => {
    // Implementation for scheduling goal reminders
    console.log(`Scheduling ${frequency} reminders for goal ${goalId}`);
  }, []);

  return (
    <GoalsContext.Provider
      value={{
        goals,
        loading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        getGoal,
        getGoalsByCategory,
        getGoalsByStatus,
        getActiveGoals,
        getCompletedGoals,
        getOverdueGoals,
        updateGoalProgress,
        completeMilestone,
        completeTask,
        addReflection,
        getGoalAnalytics,
        getGoalsOverview,
        exportGoals,
        scheduleGoalReminders,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoalsTracking = (): GoalsContextType => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsTracking must be used within a GoalsTrackingProvider');
  }
  return context;
};

export default {
  GoalsTrackingProvider,
  useGoalsTracking,
  GoalsTrackingEngine,
};
