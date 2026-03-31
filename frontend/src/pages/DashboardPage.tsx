import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, RefreshCw, Target, Trophy, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { EmptyActivities, EmptyAchievements, EmptyState, ErrorState } from '../components/ui/ErrorStates';
import { LoadingPage } from '../components/ui/LoadingStates';
import {
  getLearningAchievements,
  getLearningActivity,
  getLearningDashboardStats,
  getLearningDeadlines,
  LearningAchievement,
  LearningActivity,
  LearningDashboardStats,
  LearningDeadline
} from '../services/learningContent';
import { cn } from '../utils';

const DashboardPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LearningDashboardStats>({
    totalPoints: 0,
    completedCourses: 0,
    currentLevel: 1,
    studyStreak: 0,
    problemsSolved: 0
  });
  const [recentActivity, setRecentActivity] = useState<LearningActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<LearningDeadline[]>([]);
  const [achievements, setAchievements] = useState<LearningAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [statsData, activityData, deadlinesData, achievementsData] = await Promise.all([
        getLearningDashboardStats(),
        getLearningActivity(),
        getLearningDeadlines(),
        getLearningAchievements()
      ]);

      setStats(statsData);
      setRecentActivity(activityData);
      setUpcomingDeadlines(deadlinesData.slice(0, 3));
      setAchievements(achievementsData);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load dashboard data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getPriorityColor = (priority: LearningDeadline['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    }
  };

  const isEmptyProgressState =
    stats.totalPoints === 0 &&
    stats.completedCourses === 0 &&
    stats.studyStreak === 0 &&
    stats.problemsSolved === 0 &&
    recentActivity.length === 0 &&
    upcomingDeadlines.length === 0;

  if (isLoading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <ErrorState title="Dashboard Error" message={error} onRetry={loadDashboardData} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {authUser?.name || 'Student'}</h1>
              <p className="mt-1 text-gray-600 dark:text-slate-400">Your progress, tasks, and next steps in one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={isRefreshing} disabled={isRefreshing}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => navigate('/courses')}>
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {isEmptyProgressState && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              This dashboard shows real progress only. Complete lessons, solve problems, or enroll in a course to start populating it.
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Points', value: stats.totalPoints.toLocaleString(), icon: Trophy, color: 'text-yellow-500' },
            { label: 'Study Streak', value: `${stats.studyStreak} days`, icon: Target, color: 'text-green-500' },
            { label: 'Completed Courses', value: `${stats.completedCourses}`, icon: BookOpen, color: 'text-blue-500' },
            { label: 'Current Level', value: `Level ${stats.currentLevel}`, icon: User, color: 'text-purple-500' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${item.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                <Link to="/activity" className="text-sm text-blue-600 hover:text-blue-500">
                  View all
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <EmptyActivities onStart={() => navigate('/courses')} />
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700">
                      <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{activity.description}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">{formatDate(activity.timestamp)}</p>
                      </div>
                      {activity.points && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          +{activity.points}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
              <Link to="/deadlines" className="text-sm text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <EmptyState title="No upcoming deadlines" message="You are all caught up right now." icon={<Calendar className="mx-auto h-8 w-8 text-blue-500" />} />
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{deadline.title}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{deadline.course}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(deadline.priority)}`}>{deadline.priority}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">{formatDate(deadline.deadline)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Achievements</h2>
            <Link to="/achievements" className="text-sm text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>

          {achievements.length === 0 ? (
            <EmptyAchievements onExplore={() => navigate('/courses')} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-xl border p-4 ${
                    achievement.unlocked
                      ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
                      : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{achievement.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{achievement.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{achievement.points} pts</span>
                    <span className={achievement.unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}>
                      {achievement.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
