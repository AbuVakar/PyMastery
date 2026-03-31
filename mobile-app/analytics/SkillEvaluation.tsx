import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// AI skill evaluation types
export interface SkillEvaluation {
  evaluationId: string;
  userId: string;
  skill: string;
  evaluationDate: string;
  overallScore: number; // 0-100
  confidence: number; // 0-100
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  subSkills: SubSkillEvaluation[];
  strengths: SkillStrength[];
  weaknesses: SkillWeakness[];
  recommendations: AIRecommendation[];
  learningPath: PersonalizedLearningPath;
  nextEvaluation: string;
  evaluationMethod: 'code_analysis' | 'problem_solving' | 'project_review' | 'peer_assessment' | 'automated_test';
}

export interface SubSkillEvaluation {
  name: string;
  score: number; // 0-100
  confidence: number; // 0-100
  evidence: Evidence[];
  masteryLevel: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  improvementSuggestions: string[];
  relatedConcepts: string[];
}

export interface Evidence {
  type: 'code_submission' | 'exercise_completion' | 'project' | 'quiz' | 'peer_review';
  description: string;
  score: number;
  date: string;
  context: string;
  weight: number; // 0-1
}

export interface SkillStrength {
  area: string;
  description: string;
  examples: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  consistency: number; // 0-100
  applications: string[];
}

export interface SkillWeakness {
  area: string;
  description: string;
  severity: 'minor' | 'moderate' | 'significant' | 'critical';
  rootCause: string;
  impact: string;
  improvementPlan: ImprovementPlan;
}

export interface ImprovementPlan {
  steps: ImprovementStep[];
  estimatedTime: string;
  resources: LearningResource[];
  successCriteria: string[];
  milestones: Milestone[];
}

export interface ImprovementStep {
  step: number;
  action: string;
  description: string;
  resources: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
}

export interface LearningResource {
  type: 'tutorial' | 'video' | 'article' | 'exercise' | 'project' | 'course';
  title: string;
  url?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quality: number; // 0-100
  relevance: number; // 0-100
  prerequisites: string[];
  outcomes: string[];
}

export interface Milestone {
  title: string;
  description: string;
  criteria: string[];
  estimatedDate: string;
  completed: boolean;
  completionDate?: string;
}

export interface AIRecommendation {
  type: 'learning' | 'practice' | 'review' | 'challenge' | 'collaboration' | 'tool';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  confidence: number; // 0-100
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  resources: LearningResource[];
  successProbability: number; // 0-100
}

export interface PersonalizedLearningPath {
  currentLevel: number;
  targetLevel: number;
  estimatedDuration: string;
  modules: LearningModule[];
  prerequisites: string[];
  adaptiveAdjustments: AdaptiveAdjustment[];
  progressTracking: ProgressTracking;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  content: LearningContent[];
  exercises: Exercise[];
  assessments: Assessment[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  outcomes: string[];
  isCompleted: boolean;
  completionDate?: string;
}

export interface LearningContent {
  type: 'text' | 'video' | 'interactive' | 'code_example';
  title: string;
  content: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'coding' | 'quiz' | 'debugging' | 'design';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  hints: string[];
  solutions: Solution[];
  concepts: string[];
  isCompleted: boolean;
  completionDate?: string;
  score?: number;
}

export interface Solution {
  approach: string;
  code?: string;
  explanation: string;
  complexity: string;
  alternatives: string[];
  bestPractices: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'coding' | 'project' | 'peer_review';
  questions: Question[];
  passingScore: number;
  timeLimit?: string;
  isCompleted: boolean;
  completionDate?: string;
  score?: number;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'coding' | 'essay' | 'practical';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  concepts: string[];
}

export interface AdaptiveAdjustment {
  trigger: string;
  adjustment: string;
  reason: string;
  impact: string;
  date: string;
  effectiveness: number; // 0-100
}

export interface ProgressTracking {
  overallProgress: number; // 0-100
  moduleProgress: ModuleProgress[];
  skillProgress: SkillProgress[];
  timeSpent: number; // in hours
  lastActivity: string;
  streakDays: number;
  achievements: Achievement[];
}

export interface ModuleProgress {
  moduleId: string;
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  completedExercises: number;
  totalExercises: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastAccessed: string;
}

export interface SkillProgress {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number; // 0-100
  recentActivity: string;
  improvementRate: number; // 0-100
  confidence: number; // 0-100
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedDate: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// AI skill evaluation context
interface SkillEvaluationContextType {
  evaluations: SkillEvaluation[];
  loading: boolean;
  error: string | null;
  evaluateSkill: (userId: string, skill: string, evaluationData: any) => Promise<SkillEvaluation>;
  getSkillEvaluation: (userId: string, skill: string) => SkillEvaluation | null;
  getSkillLevel: (userId: string, skill: string) => string;
  getPersonalizedLearningPath: (userId: string, skill: string) => PersonalizedLearningPath;
  generateRecommendations: (userId: string, skill: string) => AIRecommendation[];
  trackSkillProgress: (userId: string, skill: string, activity: any) => Promise<void>;
  predictSkillMastery: (userId: string, skill: string) => SkillMasteryPrediction;
  exportEvaluationData: (userId: string) => Promise<string>;
}

export interface SkillMasteryPrediction {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  predictedDate: string;
  confidence: number; // 0-100
  factors: PredictionFactor[];
  requirements: string[];
  blockers: string[];
  recommendations: string[];
}

export interface PredictionFactor {
  factor: string;
  impact: number; // -100 to 100
  weight: number; // 0-1
  description: string;
}

// AI skill evaluation engine
class AISkillEvaluationEngine {
  static async evaluateSkill(
    userId: string,
    skill: string,
    evaluationData: any
  ): Promise<SkillEvaluation> {
    const evaluationId = `eval_${Date.now()}`;
    const evaluationDate = new Date().toISOString();

    // Analyze user data for skill assessment
    const codeAnalysis = await this.analyzeCodePerformance(evaluationData.codeSubmissions || []);
    const problemSolvingAnalysis = await this.analyzeProblemSolving(evaluationData.problemSolving || []);
    const projectAnalysis = await this.analyzeProjects(evaluationData.projects || []);
    const quizAnalysis = await this.analyzeQuizzes(evaluationData.quizzes || []);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      codeAnalysis,
      problemSolvingAnalysis,
      projectAnalysis,
      quizAnalysis,
    });

    const confidence = this.calculateConfidence(evaluationData);
    const level = this.determineSkillLevel(overallScore, evaluationData.experience || 0);

    // Evaluate sub-skills
    const subSkills = await this.evaluateSubSkills(skill, evaluationData);

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(evaluationData, overallScore);
    const weaknesses = this.identifyWeaknesses(evaluationData, overallScore);

    // Generate AI recommendations
    const recommendations = await this.generateAIRecommendations(skill, level, weaknesses, evaluationData);

    // Create personalized learning path
    const learningPath = await this.createPersonalizedLearningPath(skill, level, subSkills, evaluationData);

    // Schedule next evaluation
    const nextEvaluation = this.scheduleNextEvaluation(level, evaluationDate);

    return {
      evaluationId,
      userId,
      skill,
      evaluationDate,
      overallScore,
      confidence,
      level,
      subSkills,
      strengths,
      weaknesses,
      recommendations,
      learningPath,
      nextEvaluation,
      evaluationMethod: 'code_analysis',
    };
  }

  static async analyzeCodePerformance(codeSubmissions: any[]): Promise<any> {
    if (!codeSubmissions || codeSubmissions.length === 0) {
      return { score: 0, evidence: [], insights: [] };
    }

    const scores = codeSubmissions.map(sub => sub.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Analyze code quality metrics
    const codeQualityMetrics = codeSubmissions.map(sub => ({
      readability: sub.codeQuality?.readability || 0,
      efficiency: sub.metrics?.efficiency || 0,
      bestPractices: sub.codeQuality?.bestPractices || 0,
    }));

    const avgReadability = codeQualityMetrics.reduce((sum, metric) => sum + metric.readability, 0) / codeQualityMetrics.length;
    const avgEfficiency = codeQualityMetrics.reduce((sum, metric) => sum + metric.efficiency, 0) / codeQualityMetrics.length;
    const avgBestPractices = codeQualityMetrics.reduce((sum, metric) => sum + metric.bestPractices, 0) / codeQualityMetrics.length;

    const evidence = codeSubmissions.map(sub => ({
      type: 'code_submission' as const,
      description: `Code submission with score ${sub.score || 0}`,
      score: sub.score || 0,
      date: sub.timestamp || new Date().toISOString(),
      context: sub.problemId || 'Unknown',
      weight: 0.3,
    }));

    const insights = [
      `Average code quality score: ${averageScore.toFixed(1)}`,
      `Readability: ${avgReadability.toFixed(1)}%`,
      `Efficiency: ${avgEfficiency.toFixed(1)}%`,
      `Best practices adherence: ${avgBestPractices.toFixed(1)}%`,
    ];

    return {
      score: averageScore,
      evidence,
      insights,
      metrics: {
        readability: avgReadability,
        efficiency: avgEfficiency,
        bestPractices: avgBestPractices,
      },
    };
  }

  static async analyzeProblemSolving(problemSolving: any[]): Promise<any> {
    if (!problemSolving || problemSolving.length === 0) {
      return { score: 0, evidence: [], insights: [] };
    }

    const scores = problemSolving.map(ps => ps.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Analyze problem-solving patterns
    const difficultyDistribution = problemSolving.reduce((acc, ps) => {
      const difficulty = ps.difficulty || 'beginner';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    const timeToSolve = problemSolving.map(ps => ps.timeSpent || 0);
    const avgTimeToSolve = timeToSolve.reduce((sum, time) => sum + time, 0) / timeToSolve.length;

    const evidence = problemSolving.map(ps => ({
      type: 'exercise_completion' as const,
      description: `Problem solved with score ${ps.score || 0}`,
      score: ps.score || 0,
      date: ps.timestamp || new Date().toISOString(),
      context: ps.problemId || 'Unknown',
      weight: 0.4,
    }));

    const insights = [
      `Average problem-solving score: ${averageScore.toFixed(1)}`,
      `Average time to solve: ${avgTimeToSolve.toFixed(1)} minutes`,
      `Difficulty distribution: ${JSON.stringify(difficultyDistribution)}`,
    ];

    return {
      score: averageScore,
      evidence,
      insights,
      metrics: {
        difficultyDistribution,
        avgTimeToSolve,
      },
    };
  }

  static async analyzeProjects(projects: any[]): Promise<any> {
    if (!projects || projects.length === 0) {
      return { score: 0, evidence: [], insights: [] };
    }

    const scores = projects.map(project => project.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const evidence = projects.map(project => ({
      type: 'project' as const,
      description: `Project completed with score ${project.score || 0}`,
      score: project.score || 0,
      date: project.completionDate || new Date().toISOString(),
      context: project.title || 'Unknown',
      weight: 0.5,
    }));

    const insights = [
      `Average project score: ${averageScore.toFixed(1)}`,
      `Projects completed: ${projects.length}`,
    ];

    return {
      score: averageScore,
      evidence,
      insights,
      metrics: {
        projectCount: projects.length,
      },
    };
  }

  static async analyzeQuizzes(quizzes: any[]): Promise<any> {
    if (!quizzes || quizzes.length === 0) {
      return { score: 0, evidence: [], insights: [] };
    }

    const scores = quizzes.map(quiz => quiz.score || 0);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const evidence = quizzes.map(quiz => ({
      type: 'quiz' as const,
      description: `Quiz completed with score ${quiz.score || 0}`,
      score: quiz.score || 0,
      date: quiz.completionDate || new Date().toISOString(),
      context: quiz.title || 'Unknown',
      weight: 0.2,
    }));

    const insights = [
      `Average quiz score: ${averageScore.toFixed(1)}`,
      `Quizzes completed: ${quizzes.length}`,
    ];

    return {
      score: averageScore,
      evidence,
      insights,
      metrics: {
        quizCount: quizzes.length,
      },
    };
  }

  static calculateOverallScore(analyses: {
    codeAnalysis: any;
    problemSolvingAnalysis: any;
    projectAnalysis: any;
    quizAnalysis: any;
  }): number {
    const weights = {
      codeAnalysis: 0.4,
      problemSolvingAnalysis: 0.3,
      projectAnalysis: 0.2,
      quizAnalysis: 0.1,
    };

    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(analyses).forEach(([key, analysis]) => {
      if (analysis.score > 0) {
        weightedScore += analysis.score * weights[key as keyof typeof weights];
        totalWeight += weights[key as keyof typeof weights];
      }
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  static calculateConfidence(evaluationData: any): number {
    let confidence = 50; // Base confidence
    let dataPoints = 0;

    // Count data points
    if (evaluationData.codeSubmissions?.length > 0) {
      dataPoints += evaluationData.codeSubmissions.length;
      confidence += 10;
    }
    if (evaluationData.problemSolving?.length > 0) {
      dataPoints += evaluationData.problemSolving.length;
      confidence += 10;
    }
    if (evaluationData.projects?.length > 0) {
      dataPoints += evaluationData.projects.length;
      confidence += 15;
    }
    if (evaluationData.quizzes?.length > 0) {
      dataPoints += evaluationData.quizzes.length;
      confidence += 5;
    }

    // Adjust confidence based on data recency
    const recentData = this.getRecentDataCount(evaluationData);
    confidence += Math.min(recentData * 2, 20);

    return Math.min(100, Math.max(0, confidence));
  }

  static getRecentDataCount(evaluationData: any): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentCount = 0;

    ['codeSubmissions', 'problemSolving', 'projects', 'quizzes'].forEach(key => {
      const data = evaluationData[key] || [];
      recentCount += data.filter((item: any) => new Date(item.timestamp || item.date) > thirtyDaysAgo).length;
    });

    return recentCount;
  }

  static determineSkillLevel(score: number, experience: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master' {
    if (score >= 95 && experience >= 1000) return 'master';
    if (score >= 85 && experience >= 500) return 'expert';
    if (score >= 70 && experience >= 200) return 'advanced';
    if (score >= 55 && experience >= 50) return 'intermediate';
    return 'beginner';
  }

  static async evaluateSubSkills(skill: string, evaluationData: any): Promise<SubSkillEvaluation[]> {
    const subSkills = this.getSubSkillsForSkill(skill);
    
    return subSkills.map(subSkill => {
      const score = this.calculateSubSkillScore(subSkill, evaluationData);
      const confidence = Math.random() * 20 + 70; // Mock confidence
      const evidence = this.getSubSkillEvidence(subSkill, evaluationData);
      const masteryLevel = this.determineMasteryLevel(score);
      const improvementSuggestions = this.getImprovementSuggestions(subSkill, score);
      const relatedConcepts = this.getRelatedConcepts(subSkill);

      return {
        name: subSkill,
        score,
        confidence,
        evidence,
        masteryLevel,
        improvementSuggestions,
        relatedConcepts,
      };
    });
  }

  static getSubSkillsForSkill(skill: string): string[] {
    const subSkillMap: Record<string, string[]> = {
      'programming': [
        'syntax',
        'data_types',
        'control_flow',
        'functions',
        'error_handling',
        'debugging',
      ],
      'algorithms': [
        'sorting',
        'searching',
        'recursion',
        'dynamic_programming',
        'graph_algorithms',
        'complexity_analysis',
      ],
      'data_structures': [
        'arrays',
        'linked_lists',
        'stacks',
        'queues',
        'trees',
        'hash_tables',
      ],
    };

    return subSkillMap[skill] || [];
  }

  static calculateSubSkillScore(subSkill: string, evaluationData: any): number {
    // Simplified sub-scoring logic
    const baseScore = Math.random() * 30 + 50; // Random base score 50-80
    
    // Adjust based on related performance
    const relatedPerformance = this.getRelatedPerformance(subSkill, evaluationData);
    const adjustment = relatedPerformance * 0.3;
    
    return Math.min(100, Math.max(0, baseScore + adjustment));
  }

  static getRelatedPerformance(subSkill: string, evaluationData: any): number {
    // Mock implementation - would analyze actual performance data
    return Math.random() * 40 + 30; // Random performance 30-70
  }

  static getSubSkillEvidence(subSkill: string, evaluationData: any): Evidence[] {
    // Mock evidence generation
    return [
      {
        type: 'code_submission',
        description: `Demonstrated ${subSkill} in coding exercise`,
        score: 75,
        date: new Date().toISOString(),
        context: 'Exercise completion',
        weight: 0.5,
      },
    ];
  }

  static determineMasteryLevel(score: number): 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert' {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'proficient';
    if (score >= 40) return 'developing';
    return 'novice';
  }

  static getImprovementSuggestions(subSkill: string, score: number): string[] {
    if (score >= 80) return ['Focus on advanced applications', 'Teach others to reinforce knowledge'];
    if (score >= 60) return ['Practice with more complex problems', 'Study edge cases'];
    if (score >= 40) return ['Review fundamentals', 'Practice basic exercises'];
    return ['Start with introductory materials', 'Seek guidance from mentors'];
  }

  static getRelatedConcepts(subSkill: string): string[] {
    const conceptMap: Record<string, string[]> = {
      'syntax': ['language fundamentals', 'code structure'],
      'data_types': ['variables', 'memory management'],
      'control_flow': ['conditionals', 'loops'],
      'functions': ['parameters', 'return values', 'scope'],
      'error_handling': ['exceptions', 'debugging'],
      'debugging': ['testing', 'error analysis'],
    };

    return conceptMap[subSkill] || [];
  }

  static identifyStrengths(evaluationData: any, overallScore: number): SkillStrength[] {
    const strengths: SkillStrength[] = [];

    if (overallScore >= 80) {
      strengths.push({
        area: 'Overall Performance',
        description: 'Consistently high performance across all areas',
        examples: ['High scores on exercises', 'Quality code submissions'],
        impact: 'high',
        consistency: 85,
        applications: ['Complex problem solving', 'Code optimization'],
      });
    }

    // Analyze specific strengths from data
    const codeAnalysis = evaluationData.codeSubmissions || [];
    if (codeAnalysis.length > 0) {
      const avgQuality = codeAnalysis.reduce((sum: number, sub: any) => sum + (sub.codeQuality?.overallScore || 0), 0) / codeAnalysis.length;
      
      if (avgQuality >= 80) {
        strengths.push({
          area: 'Code Quality',
          description: 'Excellent code quality and best practices',
          examples: ['Clean, readable code', 'Proper error handling'],
          impact: 'high',
          consistency: avgQuality,
          applications: ['Software development', 'Code maintenance'],
        });
      }
    }

    return strengths;
  }

  static identifyWeaknesses(evaluationData: any, overallScore: number): SkillWeakness[] {
    const weaknesses: SkillWeakness[] = [];

    if (overallScore < 60) {
      weaknesses.push({
        area: 'Overall Performance',
        description: 'Performance below expected level',
        severity: 'significant',
        rootCause: 'Limited practice or understanding gaps',
        impact: 'Affects learning progression',
        improvementPlan: {
          steps: [
            {
              step: 1,
              action: 'Review fundamentals',
              description: 'Go back to basic concepts',
              resources: ['Introductory tutorials', 'Practice exercises'],
              estimatedTime: '2-3 hours',
              difficulty: 'easy',
              prerequisites: [],
            },
          ],
          estimatedTime: '1-2 weeks',
          resources: [],
          successCriteria: ['Score improvement of 20%'],
          milestones: [],
        },
      });
    }

    return weaknesses;
  }

  static async generateAIRecommendations(
    skill: string,
    level: string,
    weaknesses: SkillWeakness[],
    evaluationData: any
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Generate recommendations based on weaknesses
    weaknesses.forEach(weakness => {
      weakness.improvementPlan.steps.forEach(step => {
        recommendations.push({
          type: 'learning',
          priority: weakness.severity === 'critical' ? 'urgent' : 'medium',
          title: step.action,
          description: step.description,
          rationale: weakness.description,
          expectedOutcome: 'Improved performance in ' + weakness.area,
          confidence: 75,
          difficulty: step.difficulty,
          estimatedTime: step.estimatedTime,
          resources: [],
          successProbability: 80,
        });
      });
    });

    // Add general recommendations based on level
    if (level === 'beginner') {
      recommendations.push({
        type: 'learning',
        priority: 'high',
        title: 'Master Fundamentals',
        description: 'Focus on understanding core concepts',
        rationale: 'Strong foundation is essential for advanced topics',
        expectedOutcome: 'Better understanding of advanced concepts',
        confidence: 85,
        difficulty: 'beginner',
        estimatedTime: '10-15 hours',
        resources: [],
        successProbability: 90,
      });
    }

    return recommendations;
  }

  static async createPersonalizedLearningPath(
    skill: string,
    level: string,
    subSkills: SubSkillEvaluation[],
    evaluationData: any
  ): Promise<PersonalizedLearningPath> {
    const currentLevel = this.getLevelNumber(level);
    const targetLevel = Math.min(currentLevel + 2, 5); // Target 2 levels higher
    const estimatedDuration = this.estimateDuration(currentLevel, targetLevel);

    const modules = await this.createLearningModules(skill, currentLevel, targetLevel, subSkills);
    const prerequisites = this.getPrerequisites(skill, level);
    const adaptiveAdjustments = [];
    const progressTracking = {
      overallProgress: 0,
      moduleProgress: [],
      skillProgress: [],
      timeSpent: 0,
      lastActivity: new Date().toISOString(),
      streakDays: 0,
      achievements: [],
    };

    return {
      currentLevel,
      targetLevel,
      estimatedDuration,
      modules,
      prerequisites,
      adaptiveAdjustments,
      progressTracking,
    };
  }

  static getLevelNumber(level: string): number {
    const levelMap: Record<string, number> = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4,
      'master': 5,
    };
    return levelMap[level] || 1;
  }

  static estimateDuration(currentLevel: number, targetLevel: number): string {
    const levelsToProgress = targetLevel - currentLevel;
    const hoursPerLevel = 40; // Average 40 hours per level
    const totalHours = levelsToProgress * hoursPerLevel;
    const weeks = Math.ceil(totalHours / 10); // Assuming 10 hours per week
    
    return `${weeks} weeks`;
  }

  static async createLearningModules(
    skill: string,
    currentLevel: number,
    targetLevel: number,
    subSkills: SubSkillEvaluation[]
  ): Promise<LearningModule[]> {
    const modules: LearningModule[] = [];

    for (let level = currentLevel; level <= targetLevel; level++) {
      const module: LearningModule = {
        id: `${skill}_level_${level}`,
        title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} - Level ${level}`,
        description: `Master ${skill} concepts at level ${level}`,
        objectives: this.getLevelObjectives(skill, level),
        content: await this.createModuleContent(skill, level),
        exercises: await this.createModuleExercises(skill, level),
        assessments: await this.createModuleAssessments(skill, level),
        estimatedTime: '40 hours',
        difficulty: this.getDifficultyFromLevel(level),
        prerequisites: level > currentLevel ? [`${skill}_level_${level - 1}`] : [],
        outcomes: this.getLevelOutcomes(skill, level),
        isCompleted: false,
      };
      modules.push(module);
    }

    return modules;
  }

  static getLevelObjectives(skill: string, level: number): string[] {
    return [
      `Understand ${skill} fundamentals at level ${level}`,
      `Apply ${skill} concepts in practical exercises`,
      `Solve level ${level} problems efficiently`,
    ];
  }

  static async createModuleContent(skill: string, level: number): Promise<LearningContent[]> {
    return [
      {
        type: 'text',
        title: 'Introduction',
        content: `Learn ${skill} concepts at level ${level}`,
        duration: '30 minutes',
        difficulty: this.getDifficultyFromLevel(level),
        concepts: [skill],
      },
      {
        type: 'video',
        title: 'Video Tutorial',
        content: 'Visual explanation of concepts',
        duration: '45 minutes',
        difficulty: this.getDifficultyFromLevel(level),
        concepts: [skill],
      },
    ];
  }

  static async createModuleExercises(skill: string, level: number): Promise<Exercise[]> {
    return [
      {
        id: `${skill}_exercise_${level}_1`,
        title: 'Practice Exercise 1',
        description: `Apply ${skill} concepts`,
        type: 'coding',
        difficulty: this.getDifficultyFromLevel(level),
        estimatedTime: '30 minutes',
        hints: ['Review the concepts', 'Break down the problem'],
        solutions: [],
        concepts: [skill],
        isCompleted: false,
      },
    ];
  }

  static async createModuleAssessments(skill: string, level: number): Promise<Assessment[]> {
    return [
      {
        id: `${skill}_assessment_${level}`,
        title: 'Level Assessment',
        description: `Test your ${skill} knowledge`,
        type: 'coding',
        questions: [],
        passingScore: 70,
        timeLimit: '2 hours',
        isCompleted: false,
      },
    ];
  }

  static getDifficultyFromLevel(level: number): 'beginner' | 'intermediate' | 'advanced' {
    if (level <= 2) return 'beginner';
    if (level <= 4) return 'intermediate';
    return 'advanced';
  }

  static getLevelOutcomes(skill: string, level: number): string[] {
    return [
      `Proficient in ${skill} at level ${level}`,
      `Can solve level ${level} problems`,
      `Ready for level ${level + 1} concepts`,
    ];
  }

  static getPrerequisites(skill: string, level: string): string[] {
    const prerequisites: Record<string, Record<string, string[]>> = {
      'programming': {
        'beginner': [],
        'intermediate': ['programming_beginner'],
        'advanced': ['programming_intermediate'],
        'expert': ['programming_advanced'],
        'master': ['programming_expert'],
      },
    };

    return prerequisites[skill]?.[level] || [];
  }

  static scheduleNextEvaluation(level: string, currentDate: string): string {
    const evaluationIntervals: Record<string, number> = {
      'beginner': 30, // 30 days
      'intermediate': 45, // 45 days
      'advanced': 60, // 60 days
      'expert': 90, // 90 days
      'master': 120, // 120 days
    };

    const interval = evaluationIntervals[level] || 30;
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + interval);
    
    return nextDate.toISOString();
  }

  static async predictSkillMastery(userId: string, skill: string): Promise<SkillMasteryPrediction> {
    // Mock implementation - would use actual ML models
    const currentLevel = 2; // Mock current level
    const targetLevel = 4; // Mock target level
    const predictedDate = new Date();
    predictedDate.setMonth(predictedDate.getMonth() + 6); // 6 months from now

    return {
      skill,
      currentLevel,
      targetLevel,
      predictedDate: predictedDate.toISOString(),
      confidence: 75,
      factors: [
        {
          factor: 'Current Progress',
          impact: 30,
          weight: 0.4,
          description: 'Strong current performance indicates good trajectory',
        },
        {
          factor: 'Learning Consistency',
          impact: 25,
          weight: 0.3,
          description: 'Regular learning sessions support steady progress',
        },
        {
          factor: 'Skill Complexity',
          impact: -15,
          weight: 0.2,
          description: 'Complex skill requires more time to master',
        },
      ],
      requirements: ['Consistent practice', 'Advanced problem solving', 'Project completion'],
      blockers: ['Time constraints', 'Complexity barriers'],
      recommendations: ['Increase practice frequency', 'Seek mentorship', 'Work on complex projects'],
    };
  }
}

// Skill evaluation provider
export const SkillEvaluationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [evaluations, setEvaluations] = useState<SkillEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved evaluations
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        setLoading(true);
        const savedEvaluations = await AsyncStorage.getItem('@skill_evaluations');
        
        if (savedEvaluations) {
          setEvaluations(JSON.parse(savedEvaluations));
        }
      } catch (err) {
        setError('Failed to load skill evaluations');
        console.error('Evaluations loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, []);

  const evaluateSkill = useCallback(async (
    userId: string,
    skill: string,
    evaluationData: any
  ): Promise<SkillEvaluation> => {
    try {
      setLoading(true);
      setError(null);

      const evaluation = await AISkillEvaluationEngine.evaluateSkill(userId, skill, evaluationData);

      // Save evaluation
      const updatedEvaluations = [...evaluations.filter(e => !(e.userId === userId && e.skill === skill)), evaluation];
      setEvaluations(updatedEvaluations);
      await AsyncStorage.setItem('@skill_evaluations', JSON.stringify(updatedEvaluations));

      return evaluation;
    } catch (err) {
      setError('Failed to evaluate skill');
      console.error('Skill evaluation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [evaluations]);

  const getSkillEvaluation = useCallback((userId: string, skill: string): SkillEvaluation | null => {
    return evaluations.find(e => e.userId === userId && e.skill === skill) || null;
  }, [evaluations]);

  const getSkillLevel = useCallback((userId: string, skill: string): string => {
    const evaluation = getSkillEvaluation(userId, skill);
    return evaluation?.level || 'beginner';
  }, [getSkillEvaluation]);

  const getPersonalizedLearningPath = useCallback((userId: string, skill: string): PersonalizedLearningPath => {
    const evaluation = getSkillEvaluation(userId, skill);
    return evaluation?.learningPath || {
      currentLevel: 1,
      targetLevel: 2,
      estimatedDuration: '2 weeks',
      modules: [],
      prerequisites: [],
      adaptiveAdjustments: [],
      progressTracking: {
        overallProgress: 0,
        moduleProgress: [],
        skillProgress: [],
        timeSpent: 0,
        lastActivity: new Date().toISOString(),
        streakDays: 0,
        achievements: [],
      },
    };
  }, [getSkillEvaluation]);

  const generateRecommendations = useCallback((userId: string, skill: string): AIRecommendation[] => {
    const evaluation = getSkillEvaluation(userId, skill);
    return evaluation?.recommendations || [];
  }, [getSkillEvaluation]);

  const trackSkillProgress = useCallback(async (userId: string, skill: string, activity: any): Promise<void> => {
    // Implementation for tracking skill progress
    console.log(`Tracking progress for ${skill} - ${userId}`, activity);
  }, []);

  const predictSkillMastery = useCallback(async (userId: string, skill: string): Promise<SkillMasteryPrediction> => {
    return await AISkillEvaluationEngine.predictSkillMastery(userId, skill);
  }, []);

  const exportEvaluationData = useCallback(async (userId: string): Promise<string> => {
    const userEvaluations = evaluations.filter(e => e.userId === userId);
    
    const exportData = {
      evaluations: userEvaluations,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [evaluations]);

  return (
    <SkillEvaluationContext.Provider
      value={{
        evaluations,
        loading,
        error,
        evaluateSkill,
        getSkillEvaluation,
        getSkillLevel,
        getPersonalizedLearningPath,
        generateRecommendations,
        trackSkillProgress,
        predictSkillMastery,
        exportEvaluationData,
      }}
    >
      {children}
    </SkillEvaluationContext.Provider>
  );
};

export const useSkillEvaluation = (): SkillEvaluationContextType => {
  const context = useContext(SkillEvaluationContext);
  if (!context) {
    throw new Error('useSkillEvaluation must be used within a SkillEvaluationProvider');
  }
  return context;
};

export default {
  SkillEvaluationProvider,
  useSkillEvaluation,
  AISkillEvaluationEngine,
};
