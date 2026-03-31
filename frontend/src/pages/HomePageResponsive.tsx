/**
 * HomePageResponsive Component
 * Mobile-first responsive home page
 */

import React, { useEffect, useState } from 'react';
import { BookOpen, Trophy, Target, Code, Zap, Users, Star, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ResponsiveGrid from '../components/ResponsiveGrid';

interface HomePageUser {
  id?: string;
  name?: string;
  email?: string;
}

const readStoredUser = (): HomePageUser | null => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as HomePageUser;
  } catch (error) {
    console.error('Failed to parse stored homepage user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const HomePageResponsive: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState<HomePageUser | null>(() => readStoredUser());
  const stats = {
    totalStudents: 15000,
    completedCourses: 50000,
    expertInstructors: 200,
    successRate: 95
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const features = [
    {
      icon: <Code className="h-8 w-8 mobile:h-10 mobile:w-10 text-blue-600" />,
      title: 'Interactive Coding',
      description: 'Practice coding with our advanced IDE and get instant feedback',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      icon: <Zap className="h-8 w-8 mobile:h-10 mobile:w-10 text-yellow-600" />,
      title: 'AI-Powered Learning',
      description: 'Get personalized learning paths with our AI tutor',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    {
      icon: <Users className="h-8 w-8 mobile:h-10 mobile:w-10 text-green-600" />,
      title: 'Collaborative Learning',
      description: 'Learn with peers through study groups and forums',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      icon: <Trophy className="h-8 w-8 mobile:h-10 mobile:w-10 text-purple-600" />,
      title: 'Gamified Experience',
      description: 'Earn badges and compete with others on leaderboards',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    {
      icon: <Target className="h-8 w-8 mobile:h-10 mobile:w-10 text-red-600" />,
      title: 'Skill Tracking',
      description: 'Track your progress and identify areas for improvement',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    {
      icon: <Star className="h-8 w-8 mobile:h-10 mobile:w-10 text-indigo-600" />,
      title: 'Expert Instructors',
      description: 'Learn from industry experts and experienced developers',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
  ];

  const courses = [
    {
      title: 'Python Fundamentals',
      description: 'Start your programming journey with Python',
      level: 'Beginner',
      duration: '8 weeks',
      students: 12500,
      rating: 4.8,
      gradient: 'from-blue-600 to-cyan-500'
    },
    {
      title: 'Web Development Bootcamp',
      description: 'Build modern web applications from scratch',
      level: 'Intermediate',
      duration: '12 weeks',
      students: 8900,
      rating: 4.9,
      gradient: 'from-violet-600 to-fuchsia-500'
    },
    {
      title: 'Data Science with Python',
      description: 'Master data analysis and machine learning',
      level: 'Advanced',
      duration: '16 weeks',
      students: 6700,
      rating: 4.7,
      gradient: 'from-emerald-600 to-teal-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 mobile:h-16 mobile:w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-secondary-600 text-white overflow-hidden">
        <div className="container-responsive">
          <div className="flex-responsive items-center py-12 mobile:py-16 tablet:py-20 desktop:py-24">
            <div className="flex-1">
              <h1 className="heading-responsive text-white mb-6">
                Master Programming with 
                <span className="block text-yellow-300">Interactive Learning</span>
              </h1>
              <p className="text-responsive mb-8 text-gray-100 max-w-2xl">
                Join thousands of learners mastering programming skills through our interactive platform. 
                Learn by doing, get instant feedback, and advance your career.
              </p>
              <div className="flex flex-col mobile:flex-row gap-4 mobile:gap-6">
                <Button
                  size="lg"
                  variant="primary"
                  icon={<Play className="w-5 h-5" />}
                  onClick={() => navigate(user ? '/dashboard' : '/signup')}
                >
                  Start Learning
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  icon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </div>
            </div>
            <div className="hidden tablet:block flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-2xl backdrop-blur">
                  <div className="space-y-4">
                    <div className="h-4 w-24 rounded-full bg-white/30"></div>
                    <div className="rounded-2xl bg-slate-950/20 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Python Fundamentals</div>
                          <div className="mt-1 text-xs text-white/70">Lesson 12 of 20</div>
                        </div>
                        <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-100">
                          68% complete
                        </div>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/15">
                        <div className="h-2 w-2/3 rounded-full bg-emerald-300"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs text-white/60">Practice streak</div>
                        <div className="mt-2 text-2xl font-bold">12 days</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs text-white/60">Problems solved</div>
                        <div className="mt-2 text-2xl font-bold">128</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl opacity-20 animate-bounce-gentle"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse-slow"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 mobile:py-16 tablet:py-20">
        <div className="container-responsive">
          <ResponsiveGrid cols={{ mobile: 2, tablet: 4, desktop: 4 }}>
            <div className="text-center">
              <div className="text-3xl mobile:text-4xl font-bold text-primary-600 mb-2">
                {stats.totalStudents.toLocaleString()}+
              </div>
              <div className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400">
                Active Students
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl mobile:text-4xl font-bold text-secondary-600 mb-2">
                {stats.completedCourses.toLocaleString()}+
              </div>
              <div className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400">
                Completed Courses
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl mobile:text-4xl font-bold text-green-600 mb-2">
                {stats.expertInstructors}+
              </div>
              <div className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400">
                Expert Instructors
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl mobile:text-4xl font-bold text-yellow-600 mb-2">
                {stats.successRate}%
              </div>
              <div className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400">
                Success Rate
              </div>
            </div>
          </ResponsiveGrid>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 mobile:py-16 tablet:py-20 bg-white dark:bg-gray-800">
        <div className="container-responsive">
          <div className="text-center mb-12 mobile:mb-16">
            <h2 className="heading-responsive mb-4">
              Why Choose PyMastery?
            </h2>
            <p className="text-responsive text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with proven teaching methods 
              to deliver the best learning experience.
            </p>
          </div>
          
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="elevated"
                hover
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-3 mobile:p-4 rounded-full bg-gray-100 dark:bg-gray-700">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl mobile:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-mobile-base text-base text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </Card>
            ))}
          </ResponsiveGrid>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-12 mobile:py-16 tablet:py-20">
        <div className="container-responsive">
          <div className="text-center mb-12 mobile:mb-16">
            <h2 className="heading-responsive mb-4">
              Popular Courses
            </h2>
            <p className="text-responsive text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Start your learning journey with our most popular courses
            </p>
          </div>
          
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
            {courses.map((course, index) => (
              <Card
                key={index}
                variant="elevated"
                hover
                clickable
                onClick={() => navigate('/courses')}
              >
                <div className={cn('mb-4 aspect-video overflow-hidden rounded-lg bg-gradient-to-br p-5 text-white', course.gradient)}>
                  <div className="flex h-full flex-col justify-between">
                    <div className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                      Featured track
                    </div>
                    <div>
                      <div className="text-sm text-white/70">PyMastery path</div>
                      <div className="mt-1 text-xl font-semibold">{course.title}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      course.level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    )}>
                      {course.level}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 mobile:w-5 mobile:h-5 fill-current" />
                      <span className="text-mobile-sm text-sm ml-1">{course.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-lg mobile:text-xl font-semibold text-gray-900 dark:text-white mobile-truncate-2">
                    {course.title}
                  </h3>
                  <p className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400 mobile-truncate-3">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-mobile-sm text-sm text-gray-500 dark:text-gray-400">
                    <span>{course.duration}</span>
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
          
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate('/courses')}
            >
              View All Courses
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 mobile:py-16 tablet:py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="heading-responsive mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-responsive mb-8 text-gray-100 max-w-2xl mx-auto">
              Join thousands of learners already mastering programming skills with PyMastery. 
              Start today and transform your career.
            </p>
            <Button
              size="lg"
              variant="primary"
              icon={<Play className="w-5 h-5" />}
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePageResponsive;
