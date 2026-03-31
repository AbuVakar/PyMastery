import React from 'react';
import { Award, BookOpen, Flame, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';
import { cn, getInitials } from '../utils';

const WorldClassDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Courses in Progress', value: '4', icon: <BookOpen className="h-6 w-6" />, color: 'bg-blue-500' },
    { label: 'Problems Solved', value: '128', icon: <Award className="h-6 w-6" />, color: 'bg-green-500' },
    { label: 'Current Streak', value: '12 Days', icon: <Flame className="h-6 w-6" />, color: 'bg-orange-500' },
    { label: 'XP Earned', value: '12,450', icon: <Sparkles className="h-6 w-6" />, color: 'bg-purple-500' }
  ];

  const recentCourses = [
    { id: '1', title: 'Advanced Python Patterns', progress: 75, lastAccessed: '2 hours ago' },
    { id: '2', title: 'FastAPI Microservices', progress: 40, lastAccessed: '1 day ago' },
    { id: '3', title: 'Data Structures with Python', progress: 90, lastAccessed: '3 days ago' }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name || 'Explorer'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">You&apos;re making great progress. Keep it up.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/courses')}>
            Browse Courses
          </Button>
          <Button onClick={() => navigate('/problems')}>Continue Learning</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', stat.color)}>{stat.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Courses</h2>
          <div className="grid gap-4">
            {recentCourses.map((course) => (
              <Card key={course.id} hover className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl font-bold text-blue-600 dark:bg-blue-900/30">
                    {getInitials(course.title)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{course.title}</h3>
                    <p className="text-xs text-gray-500">Last accessed {course.lastAccessed}</p>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-sm font-bold text-blue-600">{course.progress}%</div>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
          <Card className="border-none bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <h3 className="font-bold">Next Recommended Step</h3>
            </div>
            <p className="mb-6 text-sm text-indigo-100">
              Based on your progress in "Advanced Python Patterns", we recommend exploring
              <strong> "Metaclass Programming"</strong> next to master Python&apos;s dynamic nature.
            </p>
            <Button
              variant="ghost"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate('/courses')}
            >
              Start Lesson
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorldClassDashboard;
