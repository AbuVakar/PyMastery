import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Code,
  Globe,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/ErrorStates';
import { useAuth } from '../components/AuthProvider';
import { cn } from '../utils';
import PythonSnakeIcon from '../components/ui/PythonSnakeIcon';

interface Course {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  students: number;
  rating: number;
  icon: React.ReactNode;
  enrolled?: boolean;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  initials: string;
  color: string;
}

const homeStats = {
  totalStudents: 15420,
  completedCourses: 523,
  expertInstructors: 24,
  successRate: 94
};

const homeTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Aayush Puri',
    role: 'Software Developer at Meesho',
    content:
      'PyMastery helped me transition from marketing to tech with a clear path and practical projects. I landed my first dev role in 6 months.',
    rating: 5,
    initials: 'AP',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 2,
    name: 'Vipin Kumar',
    role: 'Data Scientist at Flipkart',
    content:
      'The AI mentor guidance and guided pacing made it much easier to focus on what companies actually test. Best investment I made.',
    rating: 5,
    initials: 'VK',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 3,
    name: 'Shivam Kashyap',
    role: 'Machine Learning Engineer ',
    content:
      'Consistent progress tracking and structured practice kept me on track. The interview prep section alone was worth it.',
    rating: 5,
    initials: 'SK',
    color: 'from-emerald-500 to-teal-600'
  }
];

const baseCourses: Course[] = [
  {
    id: 1,
    title: 'Python for Beginners',
    description: 'Start your programming journey with Python fundamentals and clean coding habits.',
    level: 'Beginner',
    duration: '8 weeks',
    students: 12500,
    rating: 4.8,
    icon: <Code className="h-8 w-8" />,
    enrolled: false
  },
  {
    id: 2,
    title: 'React Development',
    description: 'Build modern web applications with React, TypeScript and component architecture.',
    level: 'Intermediate',
    duration: '10 weeks',
    students: 8900,
    rating: 4.9,
    icon: <Zap className="h-8 w-8" />,
    enrolled: false
  },
  {
    id: 3,
    title: 'Data Science Fundamentals',
    description: 'Learn data analysis, visualization, and machine learning with Python.',
    level: 'Intermediate',
    duration: '12 weeks',
    students: 6700,
    rating: 4.7,
    icon: <BarChart3 className="h-8 w-8" />,
    enrolled: false
  },
  {
    id: 4,
    title: 'Web Development Bootcamp',
    description: 'Master full-stack development with practical, portfolio-ready projects.',
    level: 'Beginner',
    duration: '16 weeks',
    students: 15200,
    rating: 4.9,
    icon: <Globe className="h-8 w-8" />,
    enrolled: false
  }
];

const homeFeatures = [
  {
    icon: <Code className="h-6 w-6 text-blue-500" />,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Interactive Coding',
    description: 'Practice in guided environments and get instant feedback on every submission.'
  },
  {
    icon: <Sparkles className="h-6 w-6 text-violet-500" />,
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    title: 'AI-Powered Mentor',
    description: 'Get personalized guidance, concept explanations, and debugging help 24/7.'
  },
  {
    icon: <Users className="h-6 w-6 text-emerald-500" />,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    title: 'Mentor & Community',
    description: 'Stay accountable with group learning, peer reviews, and mentor feedback.'
  },
  {
    icon: <Trophy className="h-6 w-6 text-amber-500" />,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    title: 'Career Outcomes',
    description: 'Train for interviews, build a portfolio, and track your hiring readiness.'
  }
];

const roadmapSteps = [
  {
    phase: '01',
    title: 'Core Python & Logic',
    detail:
      'Syntax confidence, clean coding habits, and problem decomposition from day one.',
    color: 'border-blue-500/40 bg-blue-500/5'
  },
  {
    phase: '02',
    title: 'Projects & Specialization',
    detail:
      'Choose your track — web, data, or AI — and build milestone-based portfolio projects.',
    color: 'border-violet-500/40 bg-violet-500/5'
  },
  {
    phase: '03',
    title: 'Interview & Placement',
    detail:
      'DSA rounds, resume review, mock interviews, and hiring-readiness checkpoints.',
    color: 'border-emerald-500/40 bg-emerald-500/5'
  }
];

const pricingCards = [
  {
    title: 'Starter',
    price: 'Free',
    badge: null,
    description: 'Perfect for trying the platform and building learning consistency.',
    points: ['Structured Python basics', 'Progress tracking dashboard', 'Community access']
  },
  {
    title: 'Pro Learner',
    price: '₹999',
    badge: 'Most Popular',
    description: 'For learners who want AI guidance and deep project practice.',
    points: ['AI tutor support (24/7)', 'Project feedback sessions', 'Career roadmap access']
  },
  {
    title: 'Placement Plus',
    price: '₹2499',
    badge: 'Best Value',
    description: 'Fast-track outcomes with interview simulation and priority mentorship.',
    points: ['All Pro features included', 'Mock interview labs', 'Priority mentor sessions', 'Resume & portfolio review']
  }
];

const skillTracks = [
  { label: 'Django / Flask', outcome: 'Web Developer', color: 'bg-blue-500/10 border-blue-400/30 text-blue-300' },
  { label: 'NumPy / Pandas', outcome: 'Data Science', color: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' },
  { label: 'DSA / Problem Solving', outcome: 'Placement Ready', color: 'bg-amber-500/10 border-amber-400/30 text-amber-300' },
  { label: 'ML / AI Basics', outcome: 'AI/ML Engineer', color: 'bg-violet-500/10 border-violet-400/30 text-violet-300' }
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } })
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>(baseCourses);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const section = document.getElementById(id);
    if (section) window.setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [location.hash, location.pathname]);

  const handleCourseEnroll = (courseId: number) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c)));
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950">

      {/* ─────────────────────────────────────────
          HERO
      ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-10 text-white sm:pt-14">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)',
              backgroundSize: '56px 56px'
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-14 lg:flex-row lg:items-center">

            {/* Left — copy */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="w-full max-w-2xl lg:w-[54%]"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                <PythonSnakeIcon className="h-3.5 w-3.5" />
                AI-Guided Python Career Platform
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                Master Python with a roadmap that turns{' '}
                <span className="bg-gradient-to-r from-cyan-200 via-blue-200 to-violet-200 bg-clip-text text-transparent">
                  effort into career outcomes.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-slate-300">
                Structured tracks, AI mentor guidance, and real projects — built around what companies actually test. No random tutorials, just measurable progress.
              </p>

              {/* Trust chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Live coding practice', 'Interview-focused roadmap', 'Project portfolio growth', 'AI mentor 24/7'].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      <CheckCircle className="h-3 w-3 text-cyan-300" />
                      {chip}
                    </span>
                  )
                )}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                    className="rounded-full bg-white px-8 text-slate-900 hover:bg-slate-50"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate('/signup')}
                      className="rounded-full bg-white px-8 text-slate-900 hover:bg-slate-50"
                    >
                      Start Learning Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/#projects')}
                      className="rounded-full border-slate-600 text-slate-200 hover:border-slate-400 hover:text-white"
                    >
                      View Learning Tracks
                    </Button>
                  </>
                )}
              </div>

              {/* Social proof micro-strip */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['SJ', 'MC', 'ER', 'AK'].map((init, i) => (
                    <div
                      key={init}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 text-[10px] font-bold text-white',
                        ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'][i]
                      )}
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-white">15,000+</span> learners already on the platform
                </p>
              </div>
            </motion.div>

            {/* Right — visual card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="w-full lg:ml-auto lg:w-[44%]"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/60 to-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur-xl sm:p-7">
                {/* Animated glow */}
                <motion.div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-900 text-cyan-300">
                    <PythonSnakeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                      Python Skill Engine
                    </p>
                    <p className="text-base font-bold text-white">Your path to landing a role</p>
                  </div>
                </div>

                <div className="grid gap-3" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
                  {skillTracks.map((track) => (
                    <div
                      key={track.label}
                      className={cn(
                        'group rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5',
                        track.color
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Learning Stack
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-100">{track.label}</p>
                      <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold">
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>{track.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3.5">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Trophy className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Placement</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-white">{homeStats.successRate}% success-focused paths</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3.5">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Code className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Execution</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-slate-200">
                      Projects, DSA drills & interview checkpoints weekly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          STATS BAND (between hero & features)
      ───────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid gap-8" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
            {[
              { value: `${homeStats.totalStudents.toLocaleString()}+`, label: 'Active Learners' },
              { value: `${homeStats.completedCourses.toLocaleString()}+`, label: 'Course Completions' },
              { value: `${homeStats.expertInstructors}+`, label: 'Expert Mentors' },
              { value: `${homeStats.successRate}%`, label: 'Placement Success Rate' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          WHY PyMastery — FEATURES
      ───────────────────────────────────────── */}
      <section id="learn" className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Why PyMastery
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to become career-ready
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-400">
              We combine AI guidance, structured practice, and real accountability — so learners make consistent, measurable progress.
            </p>
          </div>

          <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
            {homeFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={cn('mb-4 inline-flex rounded-xl p-2.5', feature.bg)}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          COURSES / PROJECTS
      ───────────────────────────────────────── */}
      <section id="projects" className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Learning Tracks
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Start building. Start growing.
              </h2>
              <p className="mt-3 max-w-xl text-base text-slate-500 dark:text-slate-400">
                Pick a structured track and move into portfolio-ready projects at your pace.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 rounded-full border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => navigate(isAuthenticated ? '/courses' : '/signup')}
            >
              View all courses
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {courses.length === 0 ? (
            <EmptyState
              title="No Courses Available"
              message="Courses are being loaded. Please check back soon."
              icon={<BookOpen className="h-10 w-10 text-blue-500" />}
            />
          ) : (
            <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                    {course.icon}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          course.level === 'Beginner'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : course.level === 'Intermediate'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        )}
                      >
                        {course.level}
                      </span>
                      <span className="text-xs text-slate-400">{course.duration}</span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className={cn(
                              'h-3.5 w-3.5',
                              idx < Math.floor(course.rating)
                                ? 'fill-current text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                            )}
                          />
                        ))}
                        <span className="ml-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {course.rating}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{course.students.toLocaleString()} learners</span>
                    </div>

                    <Button
                      className={cn(
                        'mt-4 w-full rounded-xl text-sm',
                        course.enrolled
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                      )}
                      onClick={() => handleCourseEnroll(course.id)}
                      disabled={course.enrolled}
                    >
                      {course.enrolled ? '✓ Enrolled' : 'Enroll Now'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────
          ROADMAP
      ───────────────────────────────────────── */}
      <section id="roadmap" className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Career Roadmap
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              A clear sequence from beginner to hired
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-400">
              Know exactly what to focus on, when to build, and how to prepare for hiring — without guessing.
            </p>
          </div>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div className="absolute left-0 right-0 top-[3.5rem] hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block dark:via-slate-800" />

            {roadmapSteps.map((step, i) => (
              <motion.div
                key={step.phase}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className={cn(
                  'relative rounded-2xl border p-7',
                  step.color
                )}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-white dark:text-slate-200">
                  {step.phase}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          ABOUT
      ───────────────────────────────────────── */}
      <section id="about" className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                About PyMastery
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Built for outcome-focused learning
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-500 dark:text-slate-400">
                PyMastery combines AI tutoring, guided practice, and project execution so learners can move from confusion to confidence — with a clear path forward.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-500 dark:text-slate-400">
                No random YouTube rabbit holes, no vague syllabi. Just a structured, accountable programme that maps directly to what recruiters look for.
              </p>
              <Button
                className="mt-8 rounded-full bg-slate-900 px-7 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: `${homeStats.totalStudents.toLocaleString()}+`, label: 'Active Students', color: 'text-blue-600 dark:text-blue-400' },
                { value: `${homeStats.completedCourses.toLocaleString()}+`, label: 'Courses Completed', color: 'text-emerald-600 dark:text-emerald-400' },
                { value: `${homeStats.expertInstructors}+`, label: 'Expert Mentors', color: 'text-violet-600 dark:text-violet-400' },
                { value: `${homeStats.successRate}%`, label: 'Placement Success', color: 'text-amber-600 dark:text-amber-400' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
                >
                  <p className={cn('text-3xl font-extrabold', item.color)}>{item.value}</p>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          PRICING
      ───────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Simple plans, serious outcomes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 dark:text-slate-400">
              Start free and upgrade when you want deeper support and career acceleration.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pricingCards.map((plan, i) => {
              const isPro = plan.title === 'Pro Learner';
              return (
                <motion.div
                  key={plan.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-7',
                    isPro
                      ? 'border-slate-900 bg-slate-900 shadow-xl shadow-slate-900/20 dark:border-white dark:bg-white'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                  )}
                >
                  {plan.badge && (
                    <span
                      className={cn(
                        'absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-xs font-bold',
                        isPro
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      )}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <p className={cn('text-xs font-semibold uppercase tracking-widest', isPro ? 'text-blue-300 dark:text-blue-500' : 'text-slate-500 dark:text-slate-400')}>
                    {plan.title}
                  </p>
                  <p className={cn('mt-3 text-4xl font-extrabold', isPro ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white')}>
                    {plan.price}
                    {plan.price !== 'Free' && <span className="text-base font-medium opacity-60">/mo</span>}
                  </p>
                  <p className={cn('mt-3 text-sm', isPro ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400')}>
                    {plan.description}
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            isPro ? 'text-cyan-300 dark:text-blue-500' : 'text-blue-500'
                          )}
                        />
                        <span className={isPro ? 'text-slate-300 dark:text-slate-700' : 'text-slate-600 dark:text-slate-300'}>
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      'mt-8 w-full rounded-xl',
                      isPro
                        ? 'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    )}
                    onClick={() => navigate(isAuthenticated ? '/payment' : '/signup')}
                  >
                    {plan.price === 'Free' ? 'Get Started Free' : 'Choose Plan'}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────────── */}
      <section id="resources" className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Learner Stories
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Real results from real learners
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {homeTestimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shrink-0',
                      t.color
                    )}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>

                <div className="mb-3 flex gap-0.5">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current text-amber-400" />
                  ))}
                </div>

                <p className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  "{t.content}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 text-white">
        <div className="relative mx-auto max-w-3xl overflow-hidden px-4 text-center sm:px-6">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Start your journey today
            </div>

            <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Turn Python skills into
              <br />
              <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
                career momentum.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-base text-slate-300">
              Build consistently with guided paths, AI support, and project outcomes that recruiters can actually evaluate.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                className="rounded-full bg-white px-8 text-slate-900 hover:bg-slate-100"
              >
                {isAuthenticated ? 'Continue Learning' : 'Create Free Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="rounded-full border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white"
                >
                  Already have an account? Log in
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
