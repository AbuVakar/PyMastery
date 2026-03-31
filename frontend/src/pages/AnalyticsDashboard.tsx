import React, { useState } from 'react';

type AnalyticsData = {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completionRate: number;
  averageProgress: number;
  timeSpent: number;
  weeklyActivity: number[];
  skillDistribution: { [key: string]: number };
  topPerformers: Array<{ name: string; score: number; courses: number }>;
  recentActivity: Array<{ user: string; action: string; time: string }>;
}

type AnalyticsPeriod = 'week' | 'month' | 'year';

const AnalyticsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('month');
  const analyticsData: AnalyticsData = {
    totalUsers: 1250,
    activeUsers: 890,
    totalCourses: 45,
    completionRate: 78.5,
    averageProgress: 65.3,
    timeSpent: 2450,
    weeklyActivity: [65, 78, 82, 91, 88, 95, 89],
    skillDistribution: {
      'JavaScript': 450,
      'React': 380,
      'Python': 320,
      'Node.js': 280,
      'CSS': 250,
      'TypeScript': 220,
      'MongoDB': 180,
      'Docker': 150
    },
    topPerformers: [
      { name: 'Alice Johnson', score: 95.8, courses: 12 },
      { name: 'Bob Smith', score: 92.3, courses: 10 },
      { name: 'Carol Williams', score: 89.7, courses: 8 },
      { name: 'David Brown', score: 87.2, courses: 9 },
      { name: 'Emma Davis', score: 85.9, courses: 7 }
    ],
    recentActivity: [
      { user: 'John Doe', action: 'Completed React Fundamentals', time: '2 hours ago' },
      { user: 'Jane Smith', action: 'Started Node.js Course', time: '3 hours ago' },
      { user: 'Mike Johnson', action: 'Submitted Capstone Project', time: '5 hours ago' },
      { user: 'Sarah Williams', action: 'Achieved 100% in CSS Module', time: '6 hours ago' },
      { user: 'Tom Brown', action: 'Joined Study Group', time: '8 hours ago' }
    ]
  };

  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  const metrics = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Analytics', icon: '👥' },
    { id: 'courses', label: 'Course Performance', icon: '📚' },
    { id: 'skills', label: 'Skill Distribution', icon: '🎯' },
    { id: 'engagement', label: 'Engagement', icon: '🔥' }
  ];

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Track learning progress and platform performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value as AnalyticsPeriod)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 dark:bg-slate-700 dark:text-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Metric Navigation */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                selectedMetric === metric.id
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-700'
              }`}
            >
              <span className="mr-2">{metric.icon}</span>
              {metric.label}
            </button>
          ))}
        </div>

        {/* Overview Metrics */}
        {selectedMetric === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-xl flex items-center justify-center text-2xl">
                  👥
                </div>
                <span className="text-sm text-green-600 font-medium">+12.5%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{analyticsData.totalUsers.toLocaleString()}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Users</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center text-2xl">
                  🟢
                </div>
                <span className="text-sm text-green-600 font-medium">+8.3%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{analyticsData.activeUsers.toLocaleString()}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Active Users</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center text-2xl">
                  📚
                </div>
                <span className="text-sm text-green-600 font-medium">+15.2%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{analyticsData.totalCourses}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Courses</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center text-2xl">
                  📈
                </div>
                <span className="text-sm text-green-600 font-medium">+5.7%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{analyticsData.completionRate}%</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Completion Rate</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Activity Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity</h3>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <div key={day} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-8">{day}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-6 relative">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-400 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${analyticsData.weeklyActivity[index]}%` }}
                    >
                      <span className="text-xs text-white font-medium">{analyticsData.weeklyActivity[index]}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skill Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.skillDistribution).map(([skill, count]) => (
                <div key={skill} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-24">{skill}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-4 relative">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-4 rounded-full"
                      style={{ width: `${(count / 450) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {analyticsData.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{performer.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{performer.courses} courses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getPercentageColor(performer.score)}`}>{performer.score}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm">
                    📝
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Average Progress</span>
                <span className="font-bold text-gray-900 dark:text-white">{analyticsData.averageProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`${getProgressBarColor(analyticsData.averageProgress)} h-3 rounded-full`}
                  style={{ width: `${analyticsData.averageProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Spent Learning</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Total Hours</span>
                <span className="font-bold text-gray-900 dark:text-white">{analyticsData.timeSpent.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Math.floor(analyticsData.timeSpent / analyticsData.totalUsers)} hours per user average
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Rate</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Active Users</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full"
                  style={{ width: `${(analyticsData.activeUsers / analyticsData.totalUsers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
