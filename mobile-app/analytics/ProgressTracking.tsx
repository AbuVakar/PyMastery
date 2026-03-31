import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Progress tracking types
export interface LearningProgress {
  userId: string;
  courseId?: string;
  overallProgress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  completedExercises: number;
  totalExercises: number;
  averageScore: number;
  timeSpent: number; // in minutes
  streakDays: number;
  lastActivityDate: string;
  skillLevels: Record<string, SkillLevel>;
  achievements: Achievement[];
  milestones: Milestone[];
  weeklyProgress: WeeklyProgress[];
  monthlyProgress: MonthlyProgress[];
}

export interface SkillLevel {
  skill: string;
  level: number; // 1-10
  experience: number;
  nextLevelExperience: number;
  progressPercentage: number;
  assessments: SkillAssessment[];
}

export interface SkillAssessment {
  date: string;
  score: number;
  type: 'exercise' | 'quiz' | 'project' | 'code_review';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  feedback: string;
  improvements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'streak' | 'skill' | 'time' | 'social';
  earnedDate: string;
  progress: number; // 0-100
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'lessons' | 'exercises' | 'time' | 'score' | 'streak';
  achievedDate?: string;
  isCompleted: boolean;
  rewards: string[];
}

export interface WeeklyProgress {
  week: string;
  startDate: string;
  endDate: string;
  lessonsCompleted: number;
  exercisesCompleted: number;
  timeSpent: number;
  averageScore: number;
  skillGains: Record<string, number>;
}

export interface MonthlyProgress {
  month: string;
  year: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  timeSpent: number;
  averageScore: number;
  skillGains: Record<string, number>;
  streakDays: number;
  longestStreak: number;
}

// Progress tracking context
interface ProgressContextType {
  progress: LearningProgress | null;
  loading: boolean;
  error: string | null;
  updateProgress: (updates: Partial<LearningProgress>) => Promise<void>;
  trackLessonCompletion: (lessonId: string, score: number, timeSpent: number) => Promise<void>;
  trackExerciseCompletion: (exerciseId: string, score: number, timeSpent: number, skillGains: Record<string, number>) => Promise<void>;
  trackSkillAssessment: (skill: string, assessment: SkillAssessment) => Promise<void>;
  trackTimeSpent: (minutes: number, activity: string) => Promise<void>;
  trackStreakDay: () => Promise<void>;
  checkAchievements: () => Promise<Achievement[]>;
  checkMilestones: () => Promise<Milestone[]>;
  getProgressInsights: () => ProgressInsights;
  exportProgressData: () => Promise<string>;
}

export interface ProgressInsights {
  learningVelocity: number;
  retentionRate: number;
  difficultyProgression: Record<string, number>;
  strongSkills: string[];
  weakSkills: string[];
  recommendedFocus: string[];
  learningPattern: 'consistent' | 'burst' | 'declining' | 'irregular';
  nextMilestones: Milestone[];
  achievementProgress: Achievement[];
}

// Achievement definitions
const achievementDefinitions: Omit<Achievement, 'earnedDate' | 'progress' | 'isUnlocked'>[] = [
  {
    id: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    category: 'completion',
    rarity: 'common',
    rewards: ['10 XP'],
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    rewards: ['50 XP', 'Streak Badge'],
  },
  {
    id: 'skill_master',
    title: 'Skill Master',
    description: 'Reach level 5 in any skill',
    icon: '🏆',
    category: 'skill',
    rarity: 'epic',
    rewards: ['100 XP', 'Skill Certificate'],
  },
  {
    id: 'time_champion',
    title: 'Time Champion',
    description: 'Spend 100 hours learning',
    icon: '⏰',
    category: 'time',
    rarity: 'legendary',
    rewards: ['200 XP', 'Time Master Badge'],
  },
];

// Milestone definitions
const milestoneDefinitions: Omit<Milestone, 'currentValue' | 'achievedDate' | 'isCompleted'>[] = [
  {
    id: 'lessons_10',
    title: '10 Lessons Completed',
    description: 'Complete 10 lessons',
    targetValue: 10,
    unit: 'lessons',
    category: 'lessons',
    rewards: ['25 XP'],
  },
  {
    id: 'exercises_50',
    title: '50 Exercises Completed',
    description: 'Complete 50 exercises',
    targetValue: 50,
    unit: 'exercises',
    category: 'exercises',
    rewards: ['100 XP'],
  },
  {
    id: 'time_100h',
    title: '100 Hours of Learning',
    description: 'Spend 100 hours learning',
    targetValue: 6000, // 100 hours in minutes
    unit: 'minutes',
    category: 'time',
    rewards: ['200 XP'],
  },
  {
    id: 'score_90',
    title: '90% Average Score',
    description: 'Maintain 90% average score',
    targetValue: 90,
    unit: 'percent',
    category: 'score',
    rewards: ['150 XP'],
  },
  {
    id: 'streak_30',
    title: '30-Day Streak',
    description: 'Maintain a 30-day streak',
    targetValue: 30,
    unit: 'days',
    category: 'streak',
    rewards: ['500 XP', 'Streak Legend Badge'],
  },
];

// Progress tracking provider
export const ProgressProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize progress
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load existing progress
        const savedProgress = await AsyncStorage.getItem(`@progress_${userId}`);
        
        if (savedProgress) {
          const parsedProgress = JSON.parse(savedProgress);
          setProgress(parsedProgress);
        } else {
          // Create new progress object
          const newProgress: LearningProgress = {
            userId,
            overallProgress: 0,
            completedLessons: 0,
            totalLessons: 0,
            completedExercises: 0,
            totalExercises: 0,
            averageScore: 0,
            timeSpent: 0,
            streakDays: 0,
            lastActivityDate: new Date().toISOString(),
            skillLevels: {},
            achievements: [],
            milestones: [],
            weeklyProgress: [],
            monthlyProgress: [],
          };
          setProgress(newProgress);
          await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(newProgress));
        }
      } catch (err) {
        setError('Failed to load progress data');
        console.error('Progress initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeProgress();
  }, [userId]);

  const updateProgress = useCallback(async (updates: Partial<LearningProgress>) => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress, ...updates };
      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));
    } catch (err) {
      setError('Failed to update progress');
      console.error('Progress update error:', err);
    }
  }, [progress, userId]);

  const trackLessonCompletion = useCallback(async (lessonId: string, score: number, timeSpent: number) => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress };
      updatedProgress.completedLessons += 1;
      updatedProgress.timeSpent += timeSpent;
      updatedProgress.lastActivityDate = new Date().toISOString();

      // Update average score
      const totalScore = updatedProgress.averageScore * (updatedProgress.completedLessons - 1) + score;
      updatedProgress.averageScore = totalScore / updatedProgress.completedLessons;

      // Update overall progress
      if (updatedProgress.totalLessons > 0) {
        updatedProgress.overallProgress = (updatedProgress.completedLessons / updatedProgress.totalLessons) * 100;
      }

      // Update weekly and monthly progress
      await updateWeeklyProgress(updatedProgress, 'lesson', score, timeSpent);
      await updateMonthlyProgress(updatedProgress, 'lesson', score, timeSpent);

      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));

      // Check for new achievements and milestones
      await checkAchievements();
      await checkMilestones();
    } catch (err) {
      setError('Failed to track lesson completion');
      console.error('Lesson tracking error:', err);
    }
  }, [progress, userId]);

  const trackExerciseCompletion = useCallback(async (
    exerciseId: string,
    score: number,
    timeSpent: number,
    skillGains: Record<string, number>
  ) => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress };
      updatedProgress.completedExercises += 1;
      updatedProgress.timeSpent += timeSpent;
      updatedProgress.lastActivityDate = new Date().toISOString();

      // Update average score
      const totalScore = updatedProgress.averageScore * (updatedProgress.completedExercises - 1) + score;
      updatedProgress.averageScore = totalScore / updatedProgress.completedExercises;

      // Update skill levels
      Object.entries(skillGains).forEach(([skill, gain]) => {
        if (!updatedProgress.skillLevels[skill]) {
          updatedProgress.skillLevels[skill] = {
            skill,
            level: 1,
            experience: 0,
            nextLevelExperience: 100,
            progressPercentage: 0,
            assessments: [],
          };
        }

        const skillLevel = updatedProgress.skillLevels[skill];
        skillLevel.experience += gain;

        // Check for level up
        while (skillLevel.experience >= skillLevel.nextLevelExperience) {
          skillLevel.experience -= skillLevel.nextLevelExperience;
          skillLevel.level += 1;
          skillLevel.nextLevelExperience = skillLevel.level * 100;
        }

        skillLevel.progressPercentage = (skillLevel.experience / skillLevel.nextLevelExperience) * 100;
      });

      // Update overall progress
      if (updatedProgress.totalExercises > 0) {
        updatedProgress.overallProgress = (updatedProgress.completedExercises / updatedProgress.totalExercises) * 100;
      }

      // Update weekly and monthly progress
      await updateWeeklyProgress(updatedProgress, 'exercise', score, timeSpent);
      await updateMonthlyProgress(updatedProgress, 'exercise', score, timeSpent);

      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));

      // Check for new achievements and milestones
      await checkAchievements();
      await checkMilestones();
    } catch (err) {
      setError('Failed to track exercise completion');
      console.error('Exercise tracking error:', err);
    }
  }, [progress, userId]);

  const trackSkillAssessment = useCallback(async (skill: string, assessment: SkillAssessment) => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress };
      
      if (!updatedProgress.skillLevels[skill]) {
        updatedProgress.skillLevels[skill] = {
          skill,
          level: 1,
          experience: 0,
          nextLevelExperience: 100,
          progressPercentage: 0,
          assessments: [],
        };
      }

      updatedProgress.skillLevels[skill].assessments.push(assessment);
      
      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));
    } catch (err) {
      setError('Failed to track skill assessment');
      console.error('Skill assessment tracking error:', err);
    }
  }, [progress, userId]);

  const trackTimeSpent = useCallback(async (minutes: number, activity: string) => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress };
      updatedProgress.timeSpent += minutes;
      updatedProgress.lastActivityDate = new Date().toISOString();

      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));
    } catch (err) {
      setError('Failed to track time spent');
      console.error('Time tracking error:', err);
    }
  }, [progress, userId]);

  const trackStreakDay = useCallback(async () => {
    if (!progress) return;

    try {
      const updatedProgress = { ...progress };
      const today = new Date().toDateString();
      const lastActivity = new Date(progress.lastActivityDate).toDateString();

      // Check if last activity was yesterday (maintaining streak)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActivity === yesterday.toDateString()) {
        updatedProgress.streakDays += 1;
      } else if (lastActivity !== today) {
        // Streak broken, start new one
        updatedProgress.streakDays = 1;
      }

      updatedProgress.lastActivityDate = new Date().toISOString();

      setProgress(updatedProgress);
      await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(updatedProgress));

      // Check for streak achievements
      await checkAchievements();
    } catch (err) {
      setError('Failed to track streak day');
      console.error('Streak tracking error:', err);
    }
  }, [progress, userId]);

  const updateWeeklyProgress = async (progressData: LearningProgress, activity: string, score: number, timeSpent: number) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;

    let weeklyProgress = progressData.weeklyProgress.find(wp => wp.week === weekKey);
    
    if (!weeklyProgress) {
      weeklyProgress = {
        week: weekKey,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        lessonsCompleted: 0,
        exercisesCompleted: 0,
        timeSpent: 0,
        averageScore: 0,
        skillGains: {},
      };
      progressData.weeklyProgress.push(weeklyProgress);
    }

    if (activity === 'lesson') {
      weeklyProgress.lessonsCompleted += 1;
    } else if (activity === 'exercise') {
      weeklyProgress.exercisesCompleted += 1;
    }

    weeklyProgress.timeSpent += timeSpent;
    
    // Update average score
    const totalActivities = weeklyProgress.lessonsCompleted + weeklyProgress.exercisesCompleted;
    const currentTotalScore = weeklyProgress.averageScore * (totalActivities - 1) + score;
    weeklyProgress.averageScore = currentTotalScore / totalActivities;
  };

  const updateMonthlyProgress = async (progressData: LearningProgress, activity: string, score: number, timeSpent: number) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthKey = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;

    let monthlyProgress = progressData.monthlyProgress.find(mp => mp.month === monthKey);
    
    if (!monthlyProgress) {
      monthlyProgress = {
        month: monthKey,
        year: monthStart.getFullYear(),
        lessonsCompleted: 0,
        exercisesCompleted: 0,
        timeSpent: 0,
        averageScore: 0,
        skillGains: {},
        streakDays: 0,
        longestStreak: 0,
      };
      progressData.monthlyProgress.push(monthlyProgress);
    }

    if (activity === 'lesson') {
      monthlyProgress.lessonsCompleted += 1;
    } else if (activity === 'exercise') {
      monthlyProgress.exercisesCompleted += 1;
    }

    monthlyProgress.timeSpent += timeSpent;
    
    // Update average score
    const totalActivities = monthlyProgress.lessonsCompleted + monthlyProgress.exercisesCompleted;
    const currentTotalScore = monthlyProgress.averageScore * (totalActivities - 1) + score;
    monthlyProgress.averageScore = currentTotalScore / totalActivities;

    // Update streak info
    monthlyProgress.streakDays = progressData.streakDays;
    monthlyProgress.longestStreak = Math.max(monthlyProgress.longestStreak, progressData.streakDays);
  };

  const checkAchievements = useCallback(async (): Promise<Achievement[]> => {
    if (!progress) return [];

    try {
      const newAchievements: Achievement[] = [];

      achievementDefinitions.forEach(achievementDef => {
        const existingAchievement = progress.achievements.find(a => a.id === achievementDef.id);
        
        if (existingAchievement && existingAchievement.isUnlocked) return;

        let progress = 0;
        let isUnlocked = false;

        switch (achievementDef.id) {
          case 'first_lesson':
            progress = progress.completedLessons > 0 ? 100 : 0;
            isUnlocked = progress.completedLessons > 0;
            break;
          case 'week_streak':
            progress = Math.min((progress.streakDays / 7) * 100, 100);
            isUnlocked = progress.streakDays >= 7;
            break;
          case 'skill_master':
            const maxSkillLevel = Math.max(...Object.values(progress.skillLevels).map(s => s.level));
            progress = (maxSkillLevel / 5) * 100;
            isUnlocked = maxSkillLevel >= 5;
            break;
          case 'time_champion':
            progress = Math.min((progress.timeSpent / 6000) * 100, 100); // 100 hours = 6000 minutes
            isUnlocked = progress.timeSpent >= 6000;
            break;
        }

        const achievement: Achievement = {
          ...achievementDef,
          progress,
          isUnlocked,
          earnedDate: isUnlocked ? new Date().toISOString() : '',
        };

        if (!existingAchievement) {
          progress.achievements.push(achievement);
          if (isUnlocked) {
            newAchievements.push(achievement);
          }
        } else {
          const index = progress.achievements.findIndex(a => a.id === achievementDef.id);
          progress.achievements[index] = achievement;
          if (isUnlocked && !existingAchievement.isUnlocked) {
            newAchievements.push(achievement);
          }
        }
      });

      if (newAchievements.length > 0) {
        await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(progress));
      }

      return newAchievements;
    } catch (err) {
      console.error('Achievement check error:', err);
      return [];
    }
  }, [progress, userId]);

  const checkMilestones = useCallback(async (): Promise<Milestone[]> => {
    if (!progress) return [];

    try {
      const newMilestones: Milestone[] = [];

      milestoneDefinitions.forEach(milestoneDef => {
        const existingMilestone = progress.milestones.find(m => m.id === milestoneDef.id);
        
        if (existingMilestone && existingMilestone.isCompleted) return;

        let currentValue = 0;
        let isCompleted = false;

        switch (milestoneDef.id) {
          case 'lessons_10':
            currentValue = progress.completedLessons;
            isCompleted = currentValue >= 10;
            break;
          case 'exercises_50':
            currentValue = progress.completedExercises;
            isCompleted = currentValue >= 50;
            break;
          case 'time_100h':
            currentValue = progress.timeSpent;
            isCompleted = currentValue >= 6000;
            break;
          case 'score_90':
            currentValue = progress.averageScore;
            isCompleted = currentValue >= 90;
            break;
          case 'streak_30':
            currentValue = progress.streakDays;
            isCompleted = currentValue >= 30;
            break;
        }

        const milestone: Milestone = {
          ...milestoneDef,
          currentValue,
          isCompleted,
          achievedDate: isCompleted ? new Date().toISOString() : undefined,
        };

        if (!existingMilestone) {
          progress.milestones.push(milestone);
          if (isCompleted) {
            newMilestones.push(milestone);
          }
        } else {
          const index = progress.milestones.findIndex(m => m.id === milestoneDef.id);
          progress.milestones[index] = milestone;
          if (isCompleted && !existingMilestone.isCompleted) {
            newMilestones.push(milestone);
          }
        }
      });

      if (newMilestones.length > 0) {
        await AsyncStorage.setItem(`@progress_${userId}`, JSON.stringify(progress));
      }

      return newMilestones;
    } catch (err) {
      console.error('Milestone check error:', err);
      return [];
    }
  }, [progress, userId]);

  const getProgressInsights = useCallback((): ProgressInsights => {
    if (!progress) {
      return {
        learningVelocity: 0,
        retentionRate: 0,
        difficultyProgression: {},
        strongSkills: [],
        weakSkills: [],
        recommendedFocus: [],
        learningPattern: 'irregular',
        nextMilestones: [],
        achievementProgress: [],
      };
    }

    // Calculate learning velocity (lessons per week)
    const recentWeeks = progress.weeklyProgress.slice(-4);
    const learningVelocity = recentWeeks.length > 0 
      ? recentWeeks.reduce((sum, week) => sum + week.lessonsCompleted, 0) / recentWeeks.length
      : 0;

    // Calculate retention rate (based on recent assessment scores)
    const recentAssessments = Object.values(progress.skillLevels)
      .flatMap(skill => skill.assessments.slice(-5));
    const retentionRate = recentAssessments.length > 0
      ? recentAssessments.reduce((sum, assessment) => sum + assessment.score, 0) / recentAssessments.length
      : 0;

    // Analyze skill levels
    const skillEntries = Object.entries(progress.skillLevels);
    const strongSkills = skillEntries
      .filter(([, skill]) => skill.level >= 5)
      .map(([skillName]) => skillName);
    const weakSkills = skillEntries
      .filter(([, skill]) => skill.level <= 2)
      .map(([skillName]) => skillName);

    // Determine learning pattern
    const recentActivity = progress.weeklyProgress.slice(-8);
    let learningPattern: 'consistent' | 'burst' | 'declining' | 'irregular' = 'irregular';
    
    if (recentActivity.length >= 4) {
      const activities = recentActivity.map(week => week.lessonsCompleted + week.exercisesCompleted);
      const variance = activities.reduce((sum, activity) => sum + Math.pow(activity - learningVelocity, 2), 0) / activities.length;
      
      if (variance < 1) {
        learningPattern = 'consistent';
      } else if (activities[0] < activities[activities.length - 1]) {
        learningPattern = 'burst';
      } else if (activities[0] > activities[activities.length - 1]) {
        learningPattern = 'declining';
      }
    }

    // Get next milestones
    const nextMilestones = progress.milestones
      .filter(milestone => !milestone.isCompleted && milestone.currentValue / milestone.targetValue > 0.5)
      .sort((a, b) => (b.currentValue / b.targetValue) - (a.currentValue / a.targetValue))
      .slice(0, 3);

    // Get achievement progress
    const achievementProgress = progress.achievements
      .filter(achievement => !achievement.isUnlocked && achievement.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    return {
      learningVelocity,
      retentionRate,
      difficultyProgression: {},
      strongSkills,
      weakSkills,
      recommendedFocus: weakSkills,
      learningPattern,
      nextMilestones,
      achievementProgress,
    };
  }, [progress]);

  const exportProgressData = useCallback(async (): Promise<string> => {
    if (!progress) return '';

    const exportData = {
      progress,
      insights: getProgressInsights(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [progress, getProgressInsights]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        loading,
        error,
        updateProgress,
        trackLessonCompletion,
        trackExerciseCompletion,
        trackSkillAssessment,
        trackTimeSpent,
        trackStreakDay,
        checkAchievements,
        checkMilestones,
        getProgressInsights,
        exportProgressData,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export default {
  ProgressProvider,
  useProgress,
  achievementDefinitions,
  milestoneDefinitions,
};
