import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'course' | 'problem' | 'streak' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  badge: string;
  requirements: {
    type: 'count' | 'streak' | 'score' | 'time' | 'completion' | 'combo';
    target: number;
    description: string;
  };
  progress: {
    current: number;
    target: number;
    percentage: number;
    completed: boolean;
    completed_at?: string;
  };
  unlocked: boolean;
  hidden: boolean;
  created_at: string;
  completed_at?: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  points: number;
  level: number;
  streak: number;
  courses_completed: number;
  problems_solved: number;
  average_score: number;
  badges: number;
  last_active: string;
  role_track: string;
  rank_change: number;
  previous_rank?: number;
}

interface UserStats {
  total_points: number;
  current_level: number;
  next_level_points: number;
  level_progress: number;
  total_achievements: number;
  unlocked_achievements: number;
  current_streak: number;
  longest_streak: number;
  total_study_time: number;
  problems_solved: number;
  courses_completed: number;
  average_score: number;
  rank: number;
  badges: string[];
}

interface GamificationEvent {
  id: string;
  type: 'achievement_unlocked' | 'level_up' | 'streak_milestone' | 'rank_change' | 'badge_earned';
  title: string;
  description: string;
  points: number;
  icon: string;
  data: Record<string, unknown>;
  created_at: string;
  read: boolean;
}

interface AchievementCategorySummary {
  total: number;
  unlocked: number;
  points: number;
  achievements: Achievement[];
}

interface AchievementRaritySummary {
  total: number;
  unlocked: number;
  percentage: number;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Fetching badges...');
      const mockBadges: Achievement[] = [];
      setAchievements(mockBadges);
    } catch (err) {
      setError('Failed to fetch achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Fetching user stats...');
      const mockStats: UserStats = {
        total_points: 0,
        current_level: 1,
        next_level_points: 100,
        level_progress: 0,
        total_achievements: 0,
        unlocked_achievements: 0,
        current_streak: 0,
        longest_streak: 0,
        total_study_time: 0,
        problems_solved: 0,
        courses_completed: 0,
        average_score: 0,
        rank: 0,
        badges: []
      };
      setUserStats(mockStats);
    } catch (err) {
      setError('Failed to fetch user stats');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (type: 'overall' | 'points' | 'streak' | 'courses' | 'problems' = 'overall', timeRange: 'day' | 'week' | 'month' | 'year' | 'all' = 'all') => {
    try {
      setLoading(true);
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Fetching leaderboard:', { type, timeRange });
      const mockLeaderboard: LeaderboardEntry[] = [];
      setLeaderboard(mockLeaderboard);
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch gamification events
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Fetching events...');
      const mockEvents: GamificationEvent[] = [];
      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    }
  }, [user]);

  // Mark event as read
  const markEventAsRead = useCallback(async (eventId: string) => {
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Marking event as read:', eventId);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, read: true } : event
      ));
    } catch (err) {
      console.error('Error marking event as read:', err);
    }
  }, []);

  // Get achievement progress
  const getAchievementProgress = useCallback(async (achievementId: string) => {
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Getting achievement progress:', achievementId);
      return {
        current: 0,
        target: 100,
        percentage: 0,
        completed: false
      };
    } catch (err) {
      console.error('Error fetching achievement progress:', err);
      return null;
    }
  }, []);

  // Get user ranking
  const getUserRanking = useCallback(async () => {
    if (!user) return null;
    
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Getting user ranking...');
      return {
        rank: 0,
        total_users: 0,
        percentile: 0
      };
    } catch (err) {
      console.error('Error fetching user ranking:', err);
      return null;
    }
  }, [user]);

  // Get top performers
  const getTopPerformers = useCallback(async (
    category: 'points' | 'streak' | 'courses' | 'problems',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> => {
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Getting top performers:', { category, limit });
      return [];
    } catch (err) {
      console.error('Error fetching top performers:', err);
      return [];
    }
  }, []);

  // Get achievement categories
  const getAchievementCategories = useCallback(() => {
    const categories: Partial<Record<Achievement['category'], AchievementCategorySummary>> = {};

    achievements.forEach((achievement) => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = {
          total: 0,
          unlocked: 0,
          points: 0,
          achievements: [],
        };
      }

      const category = categories[achievement.category];
      if (!category) {
        return;
      }

      category.total++;
      category.points += achievement.points;
      category.achievements.push(achievement);

      if (achievement.unlocked) {
        category.unlocked++;
      }
    });
    
    return categories;
  }, [achievements]);

  // Get achievement rarity distribution
  const getAchievementRarityDistribution = useCallback(() => {
    const distribution: Partial<Record<Achievement['rarity'], AchievementRaritySummary>> = {};

    achievements.forEach((achievement) => {
      if (!distribution[achievement.rarity]) {
        distribution[achievement.rarity] = {
          total: 0,
          unlocked: 0,
          percentage: 0,
        };
      }

      const rarity = distribution[achievement.rarity];
      if (!rarity) {
        return;
      }

      rarity.total++;

      if (achievement.unlocked) {
        rarity.unlocked++;
      }

      rarity.percentage = (rarity.unlocked / rarity.total) * 100;
    });
    
    return distribution;
  }, [achievements]);

  // Calculate level progress
  const calculateLevelProgress = useCallback((points: number) => {
    // Level calculation: 100 points per level, increasing by 10% each level
    const level = Math.floor(points / 100) + 1;
    const basePointsForLevel = (level - 1) * 100;
    const pointsForNextLevel = level * 100;
    const progress = ((points - basePointsForLevel) / (pointsForNextLevel - basePointsForLevel)) * 100;
    
    return {
      current_level: level,
      next_level_points: pointsForNextLevel,
      level_progress: progress
    };
  }, []);

  // Get streak milestones
  const getStreakMilestones = useCallback(() => {
    const milestones = [
      { days: 3, title: '3-Day Streak', description: 'Keep it going!', icon: '🔥' },
      { days: 7, title: 'Week Warrior', description: 'A full week!', icon: '💪' },
      { days: 14, title: 'Two Weeks', description: 'Amazing consistency!', icon: '🌟' },
      { days: 30, title: 'Month Master', description: '30 days of learning!', icon: '🏆' },
      { days: 60, title: 'Two Months', description: 'Incredible dedication!', icon: '🎯' },
      { days: 100, title: 'Century Club', description: '100 days strong!', icon: '💎' },
      { days: 365, title: 'Year Legend', description: 'A full year!', icon: '👑' }
    ];
    
    return milestones.map(milestone => ({
      ...milestone,
      achieved: userStats ? userStats.longest_streak >= milestone.days : false,
      current: userStats ? userStats.current_streak >= milestone.days : false
    }));
  }, [userStats]);

  // Get next achievements
  const getNextAchievements = useCallback((limit: number = 5) => {
    return achievements
      .filter(achievement => !achievement.unlocked && !achievement.hidden)
      .sort((a, b) => b.progress.percentage - a.progress.percentage)
      .slice(0, limit);
  }, [achievements]);

  // Get recent achievements
  const getRecentAchievements = useCallback((limit: number = 10) => {
    return achievements
      .filter((achievement) => achievement.unlocked && Boolean(achievement.completed_at))
      .sort((a, b) => {
        const completedTimeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const completedTimeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return completedTimeB - completedTimeA;
      })
      .slice(0, limit);
  }, [achievements]);

  // Get hidden achievements
  const getHiddenAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.hidden);
  }, [achievements]);

  // Check for new achievements
  const checkForNewAchievements = useCallback(async () => {
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Checking for new achievements...');
      const mockResponse = {
        new_achievements: [] as Achievement[],
        total_achievements: 0
      };
      if (mockResponse.new_achievements.length > 0) {
        // Show notification for new achievements
        mockResponse.new_achievements.forEach((achievement: Achievement) => {
          // Trigger achievement unlock animation/notification
          console.log('New achievement unlocked:', achievement.title);
        });
      }
      return mockResponse;
    } catch (err) {
      console.error('Error checking for new achievements:', err);
      return null;
    }
  }, []);

  // Get leaderboard statistics
  const getLeaderboardStats = useCallback(async () => {
    try {
      // TODO: Implement when gamification endpoints are available in fixedApi
      console.log('Getting leaderboard stats...');
      return {
        total_users: 0,
        average_points: 0,
        top_score: 0
      };
    } catch (err) {
      console.error('Error fetching leaderboard stats:', err);
      return null;
    }
  }, []);

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchUserStats();
      fetchEvents();
    }
  }, [user, fetchAchievements, fetchUserStats, fetchEvents]);

  return {
    // Data
    achievements,
    userStats,
    leaderboard,
    events,
    loading,
    error,
    
    // Actions
    fetchAchievements,
    fetchUserStats,
    fetchLeaderboard,
    fetchEvents,
    markEventAsRead,
    getAchievementProgress,
    getUserRanking,
    getTopPerformers,
    checkForNewAchievements,
    getLeaderboardStats,
    
    // Utilities
    getAchievementCategories,
    getAchievementRarityDistribution,
    calculateLevelProgress,
    getStreakMilestones,
    getNextAchievements,
    getRecentAchievements,
    getHiddenAchievements,
  };
};

export default useGamification;
