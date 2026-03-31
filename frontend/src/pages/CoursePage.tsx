import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, CheckCircle2, Clock3, Layers3, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyCourses, ErrorState, LoadingPage } from '../components/ui';
import { useToast } from '../components/Toast';
import { getCourseCatalog, getCourseDetail, LearningCourseDetail, LearningCourseSummary } from '../services/learningContent';
import { fixedApiService } from '../services/fixedApi';
import { cn } from '../utils';

const CoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [course, setCourse] = useState<LearningCourseDetail | null>(null);
  const [courses, setCourses] = useState<LearningCourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        if (id) {
          const nextCourse = await getCourseDetail(id);
          if (isMounted) {
            setCourse(nextCourse);
            setCourses([]);
          }
          return;
        }

        const nextCourses = await getCourseCatalog();
        if (isMounted) {
          setCourses(nextCourses);
          setCourse(null);
        }
      } catch (caughtError: unknown) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load course content right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, [id, reloadToken]);

  const getLevelClasses = (level: LearningCourseSummary['level']) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'Advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getStatusLabel = (status: LearningCourseSummary['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'enrolled':
        return 'In Progress';
      default:
        return 'Available';
    }
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return 'Flexible schedule';
    }

    try {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return value;
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (enrollingCourseId) {
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      await fixedApiService.courses.enroll(courseId);
      addToast({
        type: 'success',
        title: 'Enrollment Confirmed',
        message: 'You are now enrolled in this course.'
      });
      setReloadToken((value) => value + 1);
    } catch (caughtError: unknown) {
      addToast({
        type: 'error',
        title: 'Enrollment Failed',
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Enrollment could not be completed right now.'
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (isLoading) {
    return <LoadingPage message={id ? 'Loading course details...' : 'Loading courses...'} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <ErrorState title="Course Load Failed" message={error} onRetry={() => setReloadToken((value) => value + 1)} showBack />
        </div>
      </div>
    );
  }

  if (!id) {
    const showDemoBanner = courses.some((entry) => entry.dataSource === 'demo');

    return (
      <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
            <div className="absolute inset-y-0 right-0 w-1/2 opacity-20">
              <div className="absolute top-0 right-8 h-48 w-48 rounded-full bg-blue-500 blur-3xl" />
              <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-cyan-400 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
                Guided learning paths
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-black md:text-5xl">Course Library</h1>
                <p className="text-lg leading-relaxed text-slate-300">
                  Browse structured tracks, pick your next milestone, and move straight into quizzes or practice without losing context.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Tracks available', value: courses.length || 0 },
                  { label: 'Live deadlines', value: courses.filter((entry) => entry.nextDeadline).length },
                  { label: 'In progress', value: courses.filter((entry) => entry.status === 'enrolled').length }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => navigate('/quiz')}>
                  Open Quiz
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/problems')}>
                  Practice Problems
                </Button>
              </div>
            </div>
          </div>

          {showDemoBanner && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
              {courses.find((entry) => entry.dataSource === 'demo')?.dataMessage || 'Showing Sample Data for courses because live course data is unavailable right now.'}
            </div>
          )}

          {courses.length === 0 ? (
            <EmptyCourses onBrowse={() => navigate('/dashboard')} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {courses.map((entry) => (
                <Card key={entry.id} className="flex h-full flex-col gap-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{entry.category}</p>
                        <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{entry.title}</h2>
                      </div>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', getLevelClasses(entry.level))}>{entry.level}</span>
                    </div>
                    <p className="text-sm leading-6 text-gray-600 dark:text-slate-400">{entry.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-800/80">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                          <Layers3 className="h-4 w-4" />
                          Lessons
                        </div>
                        <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{entry.lessonCount}</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-800/80">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                          <Clock3 className="h-4 w-4" />
                          Duration
                        </div>
                        <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{entry.duration}</div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">{getStatusLabel(entry.status)}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{entry.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700">
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${entry.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4" />
                        Next checkpoint
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(entry.nextDeadline)}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <Button className="flex-1" onClick={() => navigate(`/courses/${entry.id}`)}>
                      Open Course
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {entry.status === 'available' ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => void handleEnroll(entry.id)}
                        isLoading={enrollingCourseId === entry.id}
                        disabled={enrollingCourseId !== null}
                      >
                        Enroll
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" onClick={() => navigate('/problems')}>
                        Practice
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <ErrorState title="Course Not Found" message="The course you requested is unavailable right now." showBack onHome={() => navigate('/courses')} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link to="/courses" className="inline-flex items-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course Library
        </Link>

        {course.dataSource === 'demo' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
            {course.dataMessage || 'Showing Sample Data for this course because live course data is unavailable right now.'}
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-10">
            <div className="h-full w-full translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider', getLevelClasses(course.level))}>
                {course.level}
              </span>
              <span className="text-sm text-slate-300">
                {course.duration} | {course.instructor}
              </span>
            </div>
            <h1 className="text-4xl font-black md:text-5xl">{course.title}</h1>
            <p className="text-lg leading-relaxed text-slate-300">{course.description}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Modules', value: course.modules.length },
                { label: 'Lessons', value: course.lessonCount },
                { label: 'Progress', value: `${course.progress}%` }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {course.status === 'available' ? (
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => void handleEnroll(course.id)}
                  isLoading={enrollingCourseId === course.id}
                  disabled={enrollingCourseId !== null}
                >
                  Enroll Now
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => navigate('/problems')}>
                  Continue Learning
                </Button>
              )}
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/quiz')}>
                Check Understanding
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Curriculum</h2>
            <div className="space-y-4">
              {course.modules.map((module, index) => (
                <Card key={module.id} className="transition-colors hover:border-blue-500/40">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          module.completed ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        {module.completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{module.lessons} lessons</p>
                        <p className="text-sm leading-6 text-gray-600 dark:text-slate-400">{module.summary}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/ai-chat')}>
                      Ask AI
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Course Info</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Language</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.language}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Access</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.access}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Certificate</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.certificate}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Next checkpoint</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(course.nextDeadline)}</span>
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">What you will build</h3>
              <div className="space-y-3">
                {course.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-400">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10">
              <div className="mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <BookOpen className="h-5 w-5" />
                <h3 className="font-semibold">Need help?</h3>
              </div>
              <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
                Jump into the AI chat for concept explanations or practice in the problem set to reinforce what you just learned.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300" onClick={() => navigate('/ai-chat')}>
                  Open AI Chat
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
