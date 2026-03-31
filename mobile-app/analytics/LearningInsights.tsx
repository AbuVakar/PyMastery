import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';
import { useProgress } from './ProgressTracking';
import { usePerformanceAnalysis } from './PerformanceAnalysis';

// Learning insights types
export interface LearningInsights {
  userId: string;
  generatedAt: string;
  overallSummary: OverallSummary;
  learningPatterns: LearningPatterns;
  skillAnalysis: SkillAnalysis;
  progressAnalysis: ProgressAnalysis;
  recommendations: PersonalizedRecommendations;
  achievements: AchievementAnalysis;
  challenges: ChallengeAnalysis;
  learningPath: LearningPath;
  reportType: 'daily' | 'weekly' | 'monthly' | 'comprehensive';
}

export interface OverallSummary {
  totalLearningTime: number; // in hours
  lessonsCompleted: number;
  exercisesCompleted: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  skillsLearned: number;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningVelocity: number; // lessons per week
  retentionRate: number; // 0-100
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
  overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
}

export interface LearningPatterns {
  mostProductiveTime: string;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  sessionDuration: 'short' | 'medium' | 'long';
  consistency: 'daily' | 'weekly' | 'occasional' | 'irregular';
  motivationLevel: number; // 0-100
  focusAreas: string[];
  avoidanceAreas: string[];
  peakPerformanceDays: string[];
  burnoutRisk: 'low' | 'medium' | 'high';
}

export interface SkillAnalysis {
  topSkills: SkillRanking[];
  improvementSkills: SkillRanking[];
  stagnantSkills: SkillRanking[];
  skillGaps: SkillGap[];
  skillProgression: SkillProgression[];
  crossSkillConnections: SkillConnection[];
  skillMasteryPredictions: SkillMasteryPrediction[];
}

export interface SkillRanking {
  skill: string;
  level: number; // 1-10
  experience: number;
  progressRate: number; // 0-100
  confidence: number; // 0-100
  lastAssessed: string;
  category: 'technical' | 'soft' | 'domain' | 'meta';
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  learningResources: string[];
  prerequisites: string[];
}

export interface SkillProgression {
  skill: string;
  progression: SkillLevel[];
  velocity: number;
  acceleration: number;
  plateaus: Plateau[];
  breakthroughs: Breakthrough[];
}

export interface SkillLevel {
  level: number;
  achievedAt: string;
  timeSpent: number; // in hours
  assessments: number;
  averageScore: number;
}

export interface Plateau {
  startDate: string;
  endDate?: string;
  duration: number; // in days
  level: number;
  cause: string;
  resolution?: string;
}

export interface Breakthrough {
  date: string;
  previousLevel: number;
  newLevel: number;
  trigger: string;
  impact: 'minor' | 'moderate' | 'significant' | 'major';
}

export interface SkillConnection {
  primarySkill: string;
  connectedSkill: string;
  strength: number; // 0-100
  type: 'prerequisite' | 'complementary' | 'enhancement' | 'application';
  synergy: number; // 0-100
}

export interface SkillMasteryPrediction {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  estimatedDate: string;
  confidence: number; // 0-100
  factors: string[];
  requirements: string[];
}

export interface ProgressAnalysis {
  learningVelocity: LearningVelocity;
  retentionAnalysis: RetentionAnalysis;
  difficultyProgression: DifficultyProgression;
  timeEfficiency: TimeEfficiency;
  qualityMetrics: QualityMetrics;
  comparativeMetrics: ComparativeMetrics;
}

export interface LearningVelocity {
  current: number; // lessons per week
  average: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
  peak: number;
  factors: string[];
  projections: VelocityProjection[];
}

export interface VelocityProjection {
  period: string;
  projectedVelocity: number;
  confidence: number;
  assumptions: string[];
}

export interface RetentionAnalysis {
  shortTermRetention: number; // 0-100
  longTermRetention: number; // 0-100
  decayRate: number; // 0-100
  reviewEffectiveness: number; // 0-100
  forgettingCurve: ForgettingCurve[];
  optimalReviewInterval: number; // in days
}

export interface ForgettingCurve {
  day: number;
  retentionRate: number;
  intervention: string;
}

export interface DifficultyProgression {
  currentDifficulty: number; // 1-10
  progression: DifficultyPoint[];
  readiness: number; // 0-100
  recommendations: string[];
  nextDifficulty: number;
}

export interface DifficultyPoint {
  date: string;
  difficulty: number;
  successRate: number;
  timeSpent: number;
  confidence: number;
}

export interface TimeEfficiency {
  averageTimePerLesson: number; // in minutes
  averageTimePerExercise: number; // in minutes
  efficiencyTrend: 'improving' | 'stable' | 'declining';
  timeDistribution: TimeDistribution[];
  optimizationOpportunities: string[];
}

export interface TimeDistribution {
  activity: string;
  percentage: number;
  efficiency: number; // 0-100
  recommendations: string[];
}

export interface QualityMetrics {
  codeQuality: QualityTrend;
  problemSolvingQuality: QualityTrend;
  algorithmicThinking: QualityTrend;
  bestPractices: QualityTrend;
  overallQuality: number; // 0-100
  improvementAreas: string[];
}

export interface QualityTrend {
  current: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  trajectory: QualityPoint[];
}

export interface QualityPoint {
  date: string;
  score: number;
  context: string;
}

export interface ComparativeMetrics {
  userRank: number;
  totalUsers: number;
  percentile: number;
  betterThan: number; // percentage
  similarUsers: number;
  topPerformers: TopPerformer[];
  improvementRank: number;
  growthRate: number; // 0-100
}

export interface TopPerformer {
  userId: string;
  rank: number;
  metrics: {
    score: number;
    velocity: number;
    quality: number;
  };
  strategies: string[];
}

export interface PersonalizedRecommendations {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  skillSpecific: SkillRecommendation[];
  learningStyle: LearningStyleRecommendation[];
  motivational: MotivationalRecommendation[];
}

export interface Recommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'break' | 'challenge' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resources: Resource[];
  successProbability: number; // 0-100
}

export interface Resource {
  type: 'lesson' | 'exercise' | 'video' | 'article' | 'tutorial' | 'project';
  title: string;
  url?: string;
  duration: string;
  quality: number; // 0-100
  relevance: number; // 0-100
}

export interface SkillRecommendation {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  recommendations: Recommendation[];
  learningPath: string[];
  milestones: Milestone[];
  prerequisites: string[];
}

export interface Milestone {
  level: number;
  description: string;
  criteria: string[];
  estimatedTime: string;
  resources: Resource[];
}

export interface LearningStyleRecommendation {
  style: string;
  adaptations: string[];
  preferredContent: string[];
  effectiveness: number; // 0-100
  examples: string[];
}

export interface MotivationalRecommendation {
  type: 'achievement' | 'progress' | 'social' | 'mastery' | 'purpose';
  message: string;
  trigger: string;
  impact: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface AchievementAnalysis {
  recentAchievements: Achievement[];
  achievementVelocity: number; // per month
  categoryPerformance: CategoryPerformance[];
  nextAchievements: NextAchievement[];
  achievementStreaks: AchievementStreak[];
  rarityDistribution: RarityDistribution[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  impact: 'low' | 'medium' | 'high';
}

export interface CategoryPerformance {
  category: string;
  achievements: number;
  totalPossible: number;
  completionRate: number; // 0-100
  averageDifficulty: number;
  nextMilestone: string;
}

export interface NextAchievement {
  achievement: string;
  progress: number; // 0-100
  estimatedTime: string;
  requirements: string[];
  blockers: string[];
}

export interface AchievementStreak {
  type: string;
  startDate: string;
  endDate?: string;
  duration: number; // in days
  count: number;
}

export interface RarityDistribution {
  rarity: string;
  count: number;
  percentage: number;
  nextReward: string;
}

export interface ChallengeAnalysis {
  currentChallenges: Challenge[];
  overcomingStrategies: OvercomingStrategy[];
  challengeHistory: ChallengeHistory[];
  resilienceScore: number; // 0-100
  growthOpportunities: GrowthOpportunity[];
}

export interface Challenge {
  id: string;
  type: 'concept' | 'technical' | 'motivation' | 'time' | 'resource';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  status: 'active' | 'overcoming' | 'overcome' | 'abandoned';
  impact: string;
  strategies: string[];
}

export interface OvercomingStrategy {
  challenge: string;
  strategy: string;
  effectiveness: number; // 0-100
  timeToResolve: number; // in days
  userFeedback: string;
}

export interface ChallengeHistory {
  date: string;
  challenge: string;
  outcome: 'success' | 'partial' | 'failure';
  lessons: string[];
  skills: string[];
}

export interface GrowthOpportunity {
  area: string;
  potential: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  timeInvestment: string;
  expectedReturn: string;
  prerequisites: string[];
}

export interface LearningPath {
  currentPath: string;
  progress: number; // 0-100
  nextMilestone: PathMilestone;
  alternativePaths: AlternativePath[];
  estimatedCompletion: string;
  pathEfficiency: number; // 0-100
  customization: PathCustomization[];
}

export interface PathMilestone {
  title: string;
  description: string;
  completed: boolean;
  completionDate?: string;
  skills: string[];
  estimatedTime: string;
}

export interface AlternativePath {
  name: string;
  description: string;
  suitability: number; // 0-100
  pros: string[];
  cons: string[];
  requirements: string[];
}

export interface PathCustomization {
  aspect: string;
  customization: string;
  reason: string;
  impact: string;
  userPreference: number; // 0-100
}

// Learning insights context
interface LearningInsightsContextType {
  insights: LearningInsights | null;
  loading: boolean;
  error: string | null;
  generateInsights: (userId: string, reportType: 'daily' | 'weekly' | 'monthly' | 'comprehensive') => Promise<LearningInsights>;
  getInsightsSummary: () => InsightsSummary;
  getRecommendations: (type: 'immediate' | 'shortTerm' | 'longTerm') => Recommendation[];
  getSkillAnalysis: () => SkillAnalysis;
  getProgressAnalysis: () => ProgressAnalysis;
  exportInsights: (format: 'json' | 'pdf' | 'csv') => Promise<string>;
  scheduleReport: (frequency: 'daily' | 'weekly' | 'monthly') => Promise<void>;
}

export interface InsightsSummary {
  keyMetrics: KeyMetric[];
  highlights: string[];
  concerns: string[];
  trends: Trend[];
  nextSteps: string[];
}

export interface KeyMetric {
  name: string;
  value: number | string;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface Trend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  prediction: string;
}

// Learning insights generator
class LearningInsightsGenerator {
  static async generateInsights(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'comprehensive',
    progressData: any,
    performanceData: any
  ): Promise<LearningInsights> {
    const overallSummary = this.generateOverallSummary(progressData, performanceData);
    const learningPatterns = this.analyzeLearningPatterns(progressData, performanceData);
    const skillAnalysis = this.analyzeSkills(progressData, performanceData);
    const progressAnalysis = this.analyzeProgress(progressData, performanceData);
    const recommendations = this.generateRecommendations(overallSummary, skillAnalysis, progressAnalysis);
    const achievements = this.analyzeAchievements(progressData);
    const challenges = this.analyzeChallenges(progressData, performanceData);
    const learningPath = this.analyzeLearningPath(progressData, skillAnalysis);

    return {
      userId,
      generatedAt: new Date().toISOString(),
      overallSummary,
      learningPatterns,
      skillAnalysis,
      progressAnalysis,
      recommendations,
      achievements,
      challenges,
      learningPath,
      reportType,
    };
  }

  static generateOverallSummary(progress: any, performance: any): OverallSummary {
    const totalLearningTime = (progress?.timeSpent || 0) / 60; // Convert to hours
    const lessonsCompleted = progress?.completedLessons || 0;
    const exercisesCompleted = progress?.completedExercises || 0;
    const averageScore = progress?.averageScore || 0;
    const currentStreak = progress?.streakDays || 0;
    const longestStreak = Math.max(currentStreak, 30); // Example
    const skillsLearned = Object.keys(progress?.skillLevels || {}).length;
    const masteryLevel = this.determineMasteryLevel(averageScore, skillsLearned);
    const learningVelocity = this.calculateLearningVelocity(progress);
    const retentionRate = this.calculateRetentionRate(performance);
    const engagementLevel = this.determineEngagementLevel(progress);
    const overallGrade = this.calculateOverallGrade(averageScore, completionRate: 0.8);

    return {
      totalLearningTime,
      lessonsCompleted,
      exercisesCompleted,
      averageScore,
      currentStreak,
      longestStreak,
      skillsLearned,
      masteryLevel,
      learningVelocity,
      retentionRate,
      engagementLevel,
      overallGrade,
    };
  }

  static determineMasteryLevel(score: number, skillsCount: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (score >= 90 && skillsCount >= 10) return 'expert';
    if (score >= 75 && skillsCount >= 5) return 'advanced';
    if (score >= 60 && skillsCount >= 3) return 'intermediate';
    return 'beginner';
  }

  static calculateLearningVelocity(progress: any): number {
    const weeklyProgress = progress?.weeklyProgress || [];
    if (weeklyProgress.length < 2) return 0;
    
    const recentWeeks = weeklyProgress.slice(-4);
    const totalLessons = recentWeeks.reduce((sum: number, week: any) => sum + week.lessonsCompleted, 0);
    return totalLessons / recentWeeks.length;
  }

  static calculateRetentionRate(performance: any): number {
    const performances = performance || [];
    if (performances.length < 2) return 85; // Default
    
    const recentScores = performances.slice(-10).map((p: any) => p.score);
    const averageScore = recentScores.reduce((sum: number, score: number) => sum + score, 0) / recentScores.length;
    return Math.min(100, averageScore);
  }

  static determineEngagementLevel(progress: any): 'low' | 'medium' | 'high' | 'very_high' {
    const streakDays = progress?.streakDays || 0;
    const weeklyAverage = this.calculateLearningVelocity(progress);
    
    if (streakDays >= 30 && weeklyAverage >= 5) return 'very_high';
    if (streakDays >= 14 && weeklyAverage >= 3) return 'high';
    if (streakDays >= 7 && weeklyAverage >= 2) return 'medium';
    return 'low';
  }

  static calculateOverallGrade(score: number, completionRate: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    const weightedScore = (score * 0.7) + (completionRate * 100 * 0.3);
    
    if (weightedScore >= 97) return 'A+';
    if (weightedScore >= 93) return 'A';
    if (weightedScore >= 89) return 'B+';
    if (weightedScore >= 85) return 'B';
    if (weightedScore >= 81) return 'C+';
    if (weightedScore >= 77) return 'C';
    if (weightedScore >= 73) return 'D';
    return 'F';
  }

  static analyzeLearningPatterns(progress: any, performance: any): LearningPatterns {
    // Analyze most productive time (simplified)
    const mostProductiveTime = 'Evening'; // Would be calculated from actual data
    const preferredDifficulty = 'intermediate';
    const learningStyle = 'visual';
    const sessionDuration = 'medium';
    const consistency = 'daily';
    const motivationLevel = 75;
    const focusAreas = ['Algorithms', 'Data Structures'];
    const avoidanceAreas = ['Advanced Mathematics'];
    const peakPerformanceDays = ['Monday', 'Wednesday', 'Friday'];
    const burnoutRisk = 'low';

    return {
      mostProductiveTime,
      preferredDifficulty,
      learningStyle,
      sessionDuration,
      consistency,
      motivationLevel,
      focusAreas,
      avoidanceAreas,
      peakPerformanceDays,
      burnoutRisk,
    };
  }

  static analyzeSkills(progress: any, performance: any): SkillAnalysis {
    const skillLevels = progress?.skillLevels || {};
    
    const topSkills: SkillRanking[] = Object.entries(skillLevels)
      .map(([skill, data]: [string, any]) => ({
        skill,
        level: data.level,
        experience: data.experience,
        progressRate: data.progressPercentage,
        confidence: 75,
        lastAssessed: new Date().toISOString(),
        category: 'technical',
      }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

    const improvementSkills = topSkills.filter(skill => skill.progressRate > 70);
    const stagnantSkills = topSkills.filter(skill => skill.progressRate < 30);

    return {
      topSkills,
      improvementSkills,
      stagnantSkills,
      skillGaps: [],
      skillProgression: [],
      crossSkillConnections: [],
      skillMasteryPredictions: [],
    };
  }

  static analyzeProgress(progress: any, performance: any): ProgressAnalysis {
    const learningVelocity: LearningVelocity = {
      current: this.calculateLearningVelocity(progress),
      average: 3.5,
      trend: 'stable',
      peak: 7,
      factors: ['Consistent practice', 'Good time management'],
      projections: [],
    };

    const retentionAnalysis: RetentionAnalysis = {
      shortTermRetention: 85,
      longTermRetention: 75,
      decayRate: 15,
      reviewEffectiveness: 80,
      forgettingCurve: [],
      optimalReviewInterval: 7,
    };

    const difficultyProgression: DifficultyProgression = {
      currentDifficulty: 5,
      progression: [],
      readiness: 80,
      recommendations: ['Try intermediate problems', 'Focus on algorithms'],
      nextDifficulty: 6,
    };

    const timeEfficiency: TimeEfficiency = {
      averageTimePerLesson: 25,
      averageTimePerExercise: 15,
      efficiencyTrend: 'improving',
      timeDistribution: [],
      optimizationOpportunities: ['Reduce distractions', 'Use Pomodoro technique'],
    };

    const qualityMetrics: QualityMetrics = {
      codeQuality: {
        current: 75,
        trend: 'improving',
        trajectory: [],
      },
      problemSolvingQuality: {
        current: 80,
        trend: 'stable',
        trajectory: [],
      },
      algorithmicThinking: {
        current: 70,
        trend: 'improving',
        trajectory: [],
      },
      bestPractices: {
        current: 85,
        trend: 'stable',
        trajectory: [],
      },
      overallQuality: 77.5,
      improvementAreas: ['Algorithm optimization', 'Code documentation'],
    };

    const comparativeMetrics: ComparativeMetrics = {
      userRank: 150,
      totalUsers: 1000,
      percentile: 85,
      betterThan: 85,
      similarUsers: 200,
      topPerformers: [],
      improvementRank: 75,
      growthRate: 12,
    };

    return {
      learningVelocity,
      retentionAnalysis,
      difficultyProgression,
      timeEfficiency,
      qualityMetrics,
      comparativeMetrics,
    };
  }

  static generateRecommendations(
    summary: OverallSummary,
    skillAnalysis: SkillAnalysis,
    progressAnalysis: ProgressAnalysis
  ): PersonalizedRecommendations {
    const immediate: Recommendation[] = [
      {
        id: 'review_basics',
        type: 'review',
        priority: 'high',
        title: 'Review Basic Algorithms',
        description: 'Strengthen your foundation in fundamental algorithms',
        rationale: 'Your retention rate could improve with regular review',
        expectedOutcome: '15% improvement in problem-solving speed',
        estimatedTime: '30 minutes',
        difficulty: 'beginner',
        resources: [],
        successProbability: 85,
      },
    ];

    const shortTerm: Recommendation[] = [
      {
        id: 'practice_intermediate',
        type: 'practice',
        priority: 'medium',
        title: 'Practice Intermediate Problems',
        description: 'Challenge yourself with medium-difficulty problems',
        rationale: 'You\'re ready for the next level of difficulty',
        expectedOutcome: 'Improved algorithmic thinking',
        estimatedTime: '2-3 hours',
        difficulty: 'intermediate',
        resources: [],
        successProbability: 75,
      },
    ];

    const longTerm: Recommendation[] = [
      {
        id: 'learn_advanced',
        type: 'content',
        priority: 'low',
        title: 'Learn Advanced Data Structures',
        description: 'Master trees, graphs, and dynamic programming',
        rationale: 'Essential for expert-level problem solving',
        expectedOutcome: 'Expert-level problem solving skills',
        estimatedTime: '20-30 hours',
        difficulty: 'advanced',
        resources: [],
        successProbability: 70,
      },
    ];

    return {
      immediate,
      shortTerm,
      longTerm,
      skillSpecific: [],
      learningStyle: [],
      motivational: [],
    };
  }

  static analyzeAchievements(progress: any): AchievementAnalysis {
    const achievements = progress?.achievements || [];
    
    return {
      recentAchievements: achievements.slice(-5),
      achievementVelocity: 2.5,
      categoryPerformance: [],
      nextAchievements: [],
      achievementStreaks: [],
      rarityDistribution: [],
    };
  }

  static analyzeChallenges(progress: any, performance: any): ChallengeAnalysis {
    return {
      currentChallenges: [],
      overcomingStrategies: [],
      challengeHistory: [],
      resilienceScore: 80,
      growthOpportunities: [],
    };
  }

  static analyzeLearningPath(progress: any, skillAnalysis: SkillAnalysis): LearningPath {
    return {
      currentPath: 'Full Stack Developer',
      progress: 65,
      nextMilestone: {
        title: 'Master Backend Development',
        description: 'Complete the backend development module',
        completed: false,
        skills: ['API Design', 'Database Management'],
        estimatedTime: '40 hours',
      },
      alternativePaths: [],
      estimatedCompletion: '3 months',
      pathEfficiency: 85,
      customization: [],
    };
  }
}

// Learning insights provider
export const LearningInsightsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { progress } = useProgress();
  const { performances } = usePerformanceAnalysis();

  const generateInsights = useCallback(async (
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'comprehensive'
  ): Promise<LearningInsights> => {
    try {
      setLoading(true);
      setError(null);

      const newInsights = await LearningInsightsGenerator.generateInsights(
        userId,
        reportType,
        progress,
        performances
      );

      setInsights(newInsights);
      
      // Save insights
      await AsyncStorage.setItem(`@insights_${userId}_${reportType}`, JSON.stringify(newInsights));

      return newInsights;
    } catch (err) {
      setError('Failed to generate insights');
      console.error('Insights generation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [progress, performances]);

  const getInsightsSummary = useCallback((): InsightsSummary => {
    if (!insights) {
      return {
        keyMetrics: [],
        highlights: [],
        concerns: [],
        trends: [],
        nextSteps: [],
      };
    }

    const keyMetrics: KeyMetric[] = [
      {
        name: 'Learning Velocity',
        value: insights.progressAnalysis.learningVelocity.current,
        change: 5,
        trend: 'up',
        significance: 'high',
      },
      {
        name: 'Average Score',
        value: insights.overallSummary.averageScore,
        change: 2,
        trend: 'stable',
        significance: 'medium',
      },
      {
        name: 'Retention Rate',
        value: insights.progressAnalysis.retentionAnalysis.shortTermRetention,
        change: -3,
        trend: 'down',
        significance: 'medium',
      },
    ];

    const highlights = [
      'Strong performance in algorithmic thinking',
      'Consistent learning streak maintained',
      'Good progress in skill development',
    ];

    const concerns = [
      'Retention rate could be improved',
      'Consider reviewing challenging concepts',
    ];

    const trends: Trend[] = [
      {
        metric: 'Code Quality',
        direction: 'improving',
        rate: 8,
        prediction: 'Continue improving with practice',
      },
    ];

    const nextSteps = [
      'Focus on retention strategies',
      'Practice intermediate problems',
      'Review fundamental concepts',
    ];

    return {
      keyMetrics,
      highlights,
      concerns,
      trends,
      nextSteps,
    };
  }, [insights]);

  const getRecommendations = useCallback((type: 'immediate' | 'shortTerm' | 'longTerm'): Recommendation[] => {
    if (!insights) return [];
    return insights.recommendations[type];
  }, [insights]);

  const getSkillAnalysis = useCallback((): SkillAnalysis => {
    if (!insights) {
      return {
        topSkills: [],
        improvementSkills: [],
        stagnantSkills: [],
        skillGaps: [],
        skillProgression: [],
        crossSkillConnections: [],
        skillMasteryPredictions: [],
      };
    }
    return insights.skillAnalysis;
  }, [insights]);

  const getProgressAnalysis = useCallback((): ProgressAnalysis => {
    if (!insights) {
      return {
        learningVelocity: {
          current: 0,
          average: 0,
          trend: 'stable',
          peak: 0,
          factors: [],
          projections: [],
        },
        retentionAnalysis: {
          shortTermRetention: 0,
          longTermRetention: 0,
          decayRate: 0,
          reviewEffectiveness: 0,
          forgettingCurve: [],
          optimalReviewInterval: 0,
        },
        difficultyProgression: {
          currentDifficulty: 0,
          progression: [],
          readiness: 0,
          recommendations: [],
          nextDifficulty: 0,
        },
        timeEfficiency: {
          averageTimePerLesson: 0,
          averageTimePerExercise: 0,
          efficiencyTrend: 'stable',
          timeDistribution: [],
          optimizationOpportunities: [],
        },
        qualityMetrics: {
          codeQuality: {
            current: 0,
            trend: 'stable',
            trajectory: [],
          },
          problemSolvingQuality: {
            current: 0,
            trend: 'stable',
            trajectory: [],
          },
          algorithmicThinking: {
            current: 0,
            trend: 'stable',
            trajectory: [],
          },
          bestPractices: {
            current: 0,
            trend: 'stable',
            trajectory: [],
          },
          overallQuality: 0,
          improvementAreas: [],
        },
        comparativeMetrics: {
          userRank: 0,
          totalUsers: 0,
          percentile: 0,
          betterThan: 0,
          similarUsers: 0,
          topPerformers: [],
          improvementRank: 0,
          growthRate: 0,
        },
      };
    }
    return insights.progressAnalysis;
  }, [insights]);

  const exportInsights = useCallback(async (format: 'json' | 'pdf' | 'csv'): Promise<string> => {
    if (!insights) return '';

    const exportData = {
      insights,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [insights]);

  const scheduleReport = useCallback(async (frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> => {
    // Implementation for scheduling automated reports
    console.log(`Scheduling ${frequency} reports`);
  }, []);

  return (
    <LearningInsightsContext.Provider
      value={{
        insights,
        loading,
        error,
        generateInsights,
        getInsightsSummary,
        getRecommendations,
        getSkillAnalysis,
        getProgressAnalysis,
        exportInsights,
        scheduleReport,
      }}
    >
      {children}
    </LearningInsightsContext.Provider>
  );
};

export const useLearningInsights = (): LearningInsightsContextType => {
  const context = useContext(LearningInsightsContext);
  if (!context) {
    throw new Error('useLearningInsights must be used within a LearningInsightsProvider');
  }
  return context;
};

export default {
  LearningInsightsProvider,
  useLearningInsights,
  LearningInsightsGenerator,
};
