import { fixedApiService, tokenUtils } from './fixedApi';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseStatus = 'available' | 'enrolled' | 'completed';
export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ProblemStatus = 'Solved' | 'Attempted' | 'Todo';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type DeadlinePriority = 'low' | 'medium' | 'high';
export type LearningDataSource = 'live' | 'demo';

export interface LearningCourseModule {
  id: string;
  title: string;
  lessons: number;
  completed: boolean;
  summary: string;
}

export interface LearningCourseSummary {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: CourseLevel;
  lessonCount: number;
  progress: number;
  category: string;
  status: CourseStatus;
  nextDeadline?: string;
  dataSource?: LearningDataSource;
  dataMessage?: string;
}

export interface LearningCourseDetail extends LearningCourseSummary {
  language: string;
  access: string;
  certificate: string;
  outcomes: string[];
  modules: LearningCourseModule[];
}

export interface LearningProblem {
  id: string;
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  category: string;
  status: ProblemStatus;
  xp: number;
  constraints: string[];
  starterCode: string;
  dataSource?: LearningDataSource;
  dataMessage?: string;
}

export interface LearningActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

export interface LearningDeadline {
  id: string;
  title: string;
  course: string;
  deadline: string;
  priority: DeadlinePriority;
}

export interface LearningAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SeedQuizQuestion extends QuizQuestion {
  categoryId: string;
  difficulty: QuizDifficulty;
}

interface DashboardStatsLike {
  points?: number;
  total_points?: number;
  completed_courses?: number;
  courses_completed?: number;
  study_streak?: number;
  streak?: number;
  problems_solved?: number;
  level?: number;
}

export interface LearningDashboardStats {
  totalPoints: number;
  completedCourses: number;
  currentLevel: number;
  studyStreak: number;
  problemsSolved: number;
}

type ContentRecord = Record<string, unknown>;

const isContentRecord = (value: unknown): value is ContentRecord =>
  typeof value === 'object' && value !== null;

export const quizCategoryOptions = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'react', name: 'React' },
  { id: 'database', name: 'Database' },
  { id: 'algorithms', name: 'Algorithms' },
  { id: 'web-development', name: 'Web Development' }
] as const;

const seedCourseDetails: LearningCourseDetail[] = [
  {
    id: '1',
    title: 'Python for Beginners',
    description: 'Build strong Python fundamentals with practical syntax, debugging, and project workflows.',
    instructor: 'PyMastery Team',
    duration: '8 weeks',
    level: 'Beginner',
    lessonCount: 18,
    progress: 18,
    category: 'Fundamentals',
    status: 'available',
    nextDeadline: '2026-04-02T12:00:00.000Z',
    language: 'Python 3.12+',
    access: 'Lifetime',
    certificate: 'Included',
    outcomes: [
      'Read and write core Python syntax confidently',
      'Work with files, functions, and collections',
      'Debug beginner-friendly coding problems',
      'Ship a final mini project with clean structure'
    ],
    modules: [
      { id: 'python-setup', title: 'Python setup and workflow', lessons: 4, completed: true, summary: 'Install tooling, run scripts, and learn the interactive workflow.' },
      { id: 'python-core', title: 'Variables, control flow, and functions', lessons: 5, completed: false, summary: 'Practice the syntax that powers everyday Python development.' },
      { id: 'python-data', title: 'Collections and iteration', lessons: 5, completed: false, summary: 'Use lists, dictionaries, sets, and loops to solve real exercises.' },
      { id: 'python-project', title: 'Mini project and debugging', lessons: 4, completed: false, summary: 'Pull concepts together in a guided project and debugging lab.' }
    ]
  },
  {
    id: '2',
    title: 'React Development',
    description: 'Learn modern React patterns with TypeScript, routing, state, and real component architecture.',
    instructor: 'Frontend Guild',
    duration: '10 weeks',
    level: 'Intermediate',
    lessonCount: 24,
    progress: 64,
    category: 'Frontend',
    status: 'enrolled',
    nextDeadline: '2026-04-05T12:00:00.000Z',
    language: 'TypeScript + React',
    access: 'Lifetime',
    certificate: 'Included',
    outcomes: [
      'Build routed SPA flows with reusable layout components',
      'Model UI state cleanly with React hooks',
      'Create forms, async states, and data loading patterns',
      'Ship a polished frontend portfolio project'
    ],
    modules: [
      { id: 'react-foundations', title: 'React foundations and JSX', lessons: 6, completed: true, summary: 'Refresh component thinking, props, and JSX composition.' },
      { id: 'react-state', title: 'State, events, and forms', lessons: 6, completed: true, summary: 'Manage interactive UIs with controlled state and user input.' },
      { id: 'react-routing', title: 'Routing and shared layouts', lessons: 5, completed: false, summary: 'Design route-aware screens and application shells.' },
      { id: 'react-data', title: 'Async data and production polish', lessons: 7, completed: false, summary: 'Handle loading, errors, and polish patterns for real apps.' }
    ]
  },
  {
    id: '3',
    title: 'Data Science Fundamentals',
    description: 'Explore analysis, visualization, and machine learning basics with Python and notebooks.',
    instructor: 'Data Lab',
    duration: '12 weeks',
    level: 'Intermediate',
    lessonCount: 22,
    progress: 31,
    category: 'Data Science',
    status: 'available',
    nextDeadline: '2026-04-08T12:00:00.000Z',
    language: 'Python, NumPy, pandas',
    access: 'Lifetime',
    certificate: 'Included',
    outcomes: [
      'Clean and explore real datasets',
      'Create visualizations that communicate insight clearly',
      'Build simple predictive workflows',
      'Explain tradeoffs in model selection and evaluation'
    ],
    modules: [
      { id: 'ds-python', title: 'Python for data work', lessons: 5, completed: true, summary: 'Use notebooks, arrays, and dataframes effectively.' },
      { id: 'ds-analysis', title: 'Analysis and exploration', lessons: 6, completed: false, summary: 'Ask better questions from messy data and summarize patterns.' },
      { id: 'ds-viz', title: 'Visualization and storytelling', lessons: 5, completed: false, summary: 'Design charts that support insight instead of noise.' },
      { id: 'ds-ml', title: 'Intro machine learning', lessons: 6, completed: false, summary: 'Train, evaluate, and explain beginner-friendly models.' }
    ]
  },
  {
    id: '4',
    title: 'Web Development Bootcamp',
    description: 'Go from HTML and CSS to full-stack app thinking with a guided project-based track.',
    instructor: 'Web Builders Team',
    duration: '16 weeks',
    level: 'Beginner',
    lessonCount: 30,
    progress: 82,
    category: 'Full Stack',
    status: 'enrolled',
    nextDeadline: '2026-04-10T12:00:00.000Z',
    language: 'HTML, CSS, JavaScript',
    access: 'Lifetime',
    certificate: 'Included',
    outcomes: [
      'Build responsive pages with intentional layout and spacing',
      'Use JavaScript for interaction and validation',
      'Understand backend integration fundamentals',
      'Ship a polished capstone website'
    ],
    modules: [
      { id: 'web-html', title: 'HTML structure and semantics', lessons: 6, completed: true, summary: 'Build accessible content structure and clear page hierarchy.' },
      { id: 'web-css', title: 'CSS layouts and responsive design', lessons: 8, completed: true, summary: 'Use grids, flexbox, spacing systems, and responsive breakpoints.' },
      { id: 'web-js', title: 'JavaScript interaction', lessons: 8, completed: false, summary: 'Make interfaces interactive with state, events, and DOM updates.' },
      { id: 'web-capstone', title: 'Capstone build and launch', lessons: 8, completed: false, summary: 'Pull together frontend and integration basics in a real project.' }
    ]
  }
];

const seedProblems: LearningProblem[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Return the indices of two numbers that add up to a target.',
    difficulty: 'Easy',
    category: 'Algorithms',
    status: 'Solved',
    xp: 50,
    constraints: ['Input array length is at least 2.', 'Return indices in any order.', 'Aim for better than O(n^2) when possible.'],
    starterCode: 'def solution(nums, target):\n    # Return the indices of two numbers that add up to target\n    pass'
  },
  {
    id: '2',
    title: 'LRU Cache',
    description: 'Design a cache with O(1) reads and writes using hash maps and linked lists.',
    difficulty: 'Hard',
    category: 'Data Structures',
    status: 'Attempted',
    xp: 200,
    constraints: ['Support get and put in O(1).', 'Evict the least recently used entry when full.', 'Keep the implementation readable and testable.'],
    starterCode: 'class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        # Initialize your data structures here\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass'
  },
  {
    id: '3',
    title: 'Python Decorators',
    description: 'Refactor repeated logging logic into a reusable decorator.',
    difficulty: 'Medium',
    category: 'Fundamentals',
    status: 'Todo',
    xp: 100,
    constraints: ['Use decorator syntax.', 'Preserve the wrapped function arguments.', 'Print a message before and after execution.'],
    starterCode: 'def log_calls(func):\n    # Print before and after the wrapped function runs\n    pass\n\n@log_calls\ndef greet(name):\n    print(f"Hello, {name}")'
  },
  {
    id: '4',
    title: 'Binary Tree Level Order Traversal',
    description: 'Traverse a tree by level and return node values grouped by depth.',
    difficulty: 'Medium',
    category: 'Algorithms',
    status: 'Todo',
    xp: 120,
    constraints: ['Return a list of lists.', 'Traverse nodes level by level.', 'Handle an empty tree gracefully.'],
    starterCode: 'def level_order(root):\n    # Return node values grouped by tree depth\n    pass'
  },
  {
    id: '5',
    title: 'Design a URL Shortener',
    description: 'Sketch a system for redirects, analytics, and collision-safe short codes.',
    difficulty: 'Hard',
    category: 'System Design',
    status: 'Todo',
    xp: 300,
    constraints: ['Discuss write and read path tradeoffs.', 'Consider custom aliases and expiration.', 'Plan for analytics and rate limiting.'],
    starterCode: '# Describe your architecture for a URL shortener.\n# Cover API design, storage, caching, and analytics.\n'
  },
  {
    id: '6',
    title: 'Sliding Window Maximum',
    description: 'Track the maximum value in every fixed-size window efficiently.',
    difficulty: 'Hard',
    category: 'Algorithms',
    status: 'Todo',
    xp: 260,
    constraints: ['Aim for O(n) time.', 'Use a deque or equivalent structure.', 'Return the maximum for every full window.'],
    starterCode: 'def max_sliding_window(nums, k):\n    # Return the max for each sliding window of size k\n    pass'
  },
  {
    id: '7',
    title: 'Database Index Basics',
    description: 'Choose the right index strategy for a read-heavy workload.',
    difficulty: 'Easy',
    category: 'System Design',
    status: 'Solved',
    xp: 60,
    constraints: ['Explain the tradeoff between reads and writes.', 'Consider lookup patterns before choosing the index.', 'Mention how composite indexes work.'],
    starterCode: '# Explain which index you would add for a read-heavy query pattern.\n'
  }
];

const seedActivities: LearningActivity[] = [
  {
    id: 'activity-1',
    title: 'Completed React state management quiz',
    description: 'Scored 86% on the medium difficulty assessment.',
    timestamp: '2026-03-29T08:45:00.000Z',
    points: 40
  },
  {
    id: 'activity-2',
    title: 'Finished Python decorators lesson',
    description: 'Wrapped up the metaprogramming checkpoint and notes.',
    timestamp: '2026-03-28T14:20:00.000Z',
    points: 25
  },
  {
    id: 'activity-3',
    title: 'Reviewed upcoming dashboard goals',
    description: 'Checked deadlines and planned the next practice block.',
    timestamp: '2026-03-27T11:10:00.000Z',
    points: 10
  }
];

const seedDeadlines: LearningDeadline[] = [
  {
    id: 'deadline-1',
    title: 'Asyncio practice set',
    course: 'Advanced Python Mastery',
    deadline: '2026-04-02T12:00:00.000Z',
    priority: 'high'
  },
  {
    id: 'deadline-2',
    title: 'React state review',
    course: 'Frontend Track',
    deadline: '2026-04-05T12:00:00.000Z',
    priority: 'medium'
  },
  {
    id: 'deadline-3',
    title: 'Problem set checkpoint',
    course: 'Interview Prep',
    deadline: '2026-04-08T12:00:00.000Z',
    priority: 'low'
  }
];

const seedQuizQuestions: SeedQuizQuestion[] = [
  {
    id: 101,
    categoryId: 'python',
    difficulty: 'easy',
    question: 'What is the output type of `range(5)` in modern Python?',
    options: ['list', 'tuple', 'range object', 'generator'],
    correctAnswer: 2,
    explanation: '`range(5)` returns a lazy range object instead of a list.'
  },
  {
    id: 102,
    categoryId: 'python',
    difficulty: 'medium',
    question: 'Why would you use a decorator in Python?',
    options: ['To rename variables', 'To wrap reusable behavior around functions', 'To create database indexes', 'To speed up imports'],
    correctAnswer: 1,
    explanation: 'Decorators help apply reusable behavior such as logging, auth checks, or caching.'
  },
  {
    id: 103,
    categoryId: 'python',
    difficulty: 'hard',
    question: 'Which dunder method customizes how an object behaves in a `with` block?',
    options: ['__iter__', '__call__', '__enter__', '__repr__'],
    correctAnswer: 2,
    explanation: '`__enter__` and `__exit__` power context manager behavior.'
  },
  {
    id: 201,
    categoryId: 'javascript',
    difficulty: 'easy',
    question: 'What keyword declares a block-scoped variable?',
    options: ['var', 'const', 'global', 'def'],
    correctAnswer: 1,
    explanation: '`const` and `let` are block-scoped, while `var` is function-scoped.'
  },
  {
    id: 202,
    categoryId: 'javascript',
    difficulty: 'medium',
    question: 'What does `Array.prototype.map` return?',
    options: ['The original array', 'A new transformed array', 'A boolean', 'A single value only'],
    correctAnswer: 1,
    explanation: '`map` returns a new array with each item transformed by the callback.'
  },
  {
    id: 203,
    categoryId: 'javascript',
    difficulty: 'hard',
    question: 'What is a closure in JavaScript?',
    options: ['A CSS layout trick', 'A function bundled with its lexical scope', 'A type of database transaction', 'A way to minify code'],
    correctAnswer: 1,
    explanation: 'Closures let functions keep access to variables from their creation scope.'
  },
  {
    id: 301,
    categoryId: 'react',
    difficulty: 'easy',
    question: 'What is React primarily used for?',
    options: ['Database backups', 'Building user interfaces', 'Compiling TypeScript', 'Running Linux services'],
    correctAnswer: 1,
    explanation: 'React focuses on component-based user interface development.'
  },
  {
    id: 302,
    categoryId: 'react',
    difficulty: 'medium',
    question: 'Which hook is commonly used for local component state?',
    options: ['useEffect', 'useState', 'useContext', 'useRefetch'],
    correctAnswer: 1,
    explanation: '`useState` is the standard hook for local component state.'
  },
  {
    id: 303,
    categoryId: 'react',
    difficulty: 'hard',
    question: 'Why is keeping component state minimal often a good idea?',
    options: ['It increases bundle size', 'It reduces accidental duplication and sync bugs', 'It disables rerenders', 'It removes the need for props'],
    correctAnswer: 1,
    explanation: 'Minimal state reduces derived-state bugs and keeps components easier to reason about.'
  },
  {
    id: 401,
    categoryId: 'database',
    difficulty: 'easy',
    question: 'What does SQL stand for?',
    options: ['Structured Query Language', 'Simple Queue Language', 'System Query Logic', 'Serialized Query Layer'],
    correctAnswer: 0,
    explanation: 'SQL stands for Structured Query Language.'
  },
  {
    id: 402,
    categoryId: 'database',
    difficulty: 'medium',
    question: 'What is the main purpose of an index in a database?',
    options: ['To encrypt rows', 'To speed up lookups', 'To replace backups', 'To avoid schemas'],
    correctAnswer: 1,
    explanation: 'Indexes trade some write cost and storage for faster query performance.'
  },
  {
    id: 403,
    categoryId: 'database',
    difficulty: 'hard',
    question: 'What is a transaction isolation level meant to control?',
    options: ['Font rendering', 'Concurrent read and write visibility rules', 'Cloud region pricing', 'Object serialization format'],
    correctAnswer: 1,
    explanation: 'Isolation levels define how concurrent transactions observe one another.'
  },
  {
    id: 501,
    categoryId: 'algorithms',
    difficulty: 'easy',
    question: 'Which data structure follows first-in, first-out behavior?',
    options: ['Stack', 'Queue', 'Heap', 'Tree'],
    correctAnswer: 1,
    explanation: 'Queues process items in the order they arrived.'
  },
  {
    id: 502,
    categoryId: 'algorithms',
    difficulty: 'medium',
    question: 'What technique is commonly used when a solution depends on a previous fixed-size window?',
    options: ['Memoization', 'Sliding window', 'Binary serialization', 'Hash partitioning'],
    correctAnswer: 1,
    explanation: 'Sliding window is a standard pattern for contiguous ranges.'
  },
  {
    id: 503,
    categoryId: 'algorithms',
    difficulty: 'hard',
    question: 'Why is Big O notation useful?',
    options: ['It measures exact runtime in milliseconds', 'It compares algorithm growth as input size increases', 'It compresses code', 'It ensures zero bugs'],
    correctAnswer: 1,
    explanation: 'Big O helps compare algorithmic growth rates, not exact timing on one machine.'
  },
  {
    id: 601,
    categoryId: 'web-development',
    difficulty: 'easy',
    question: 'Which language is used to structure content on the web?',
    options: ['CSS', 'HTML', 'SQL', 'Bash'],
    correctAnswer: 1,
    explanation: 'HTML defines page structure and semantics.'
  },
  {
    id: 602,
    categoryId: 'web-development',
    difficulty: 'medium',
    question: 'What does responsive design aim to do?',
    options: ['Only support desktop screens', 'Adapt layout across device sizes', 'Remove all animations', 'Replace JavaScript'],
    correctAnswer: 1,
    explanation: 'Responsive design helps a layout adapt gracefully across screen sizes.'
  },
  {
    id: 603,
    categoryId: 'web-development',
    difficulty: 'hard',
    question: 'Why is reducing layout shift important?',
    options: ['It improves visual stability during load', 'It increases API speed', 'It avoids DNS lookups', 'It prevents caching'],
    correctAnswer: 0,
    explanation: 'Stable layouts make interfaces feel more polished and reduce accidental clicks.'
  }
];

const unwrapApiData = (payload: unknown) => (isContentRecord(payload) ? payload.data ?? payload : payload);
const getPayloadDataSource = (payload: unknown): LearningDataSource =>
  isContentRecord(payload) && (payload.demo_mode === true || String(payload.source || '').toLowerCase() === 'seed')
    ? 'demo'
    : 'live';

const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  return [];
};

const pickArray = <T>(payload: unknown, keys: string[]): T[] => {
  if (!isContentRecord(payload)) {
    return toArray<T>(payload);
  }

  for (const key of keys) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return toArray<T>(payload);
};

const normalizeCourseLevel = (value: unknown, fallback: CourseLevel = 'Intermediate'): CourseLevel => {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('beginner') || normalized.includes('easy')) {
    return 'Beginner';
  }

  if (normalized.includes('advanced') || normalized.includes('hard')) {
    return 'Advanced';
  }

  if (normalized.includes('intermediate') || normalized.includes('medium')) {
    return 'Intermediate';
  }

  return fallback;
};

const normalizeProblemDifficulty = (value: unknown, fallback: ProblemDifficulty = 'Medium'): ProblemDifficulty => {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('easy')) {
    return 'Easy';
  }

  if (normalized.includes('hard')) {
    return 'Hard';
  }

  if (normalized.includes('medium') || normalized.includes('intermediate')) {
    return 'Medium';
  }

  return fallback;
};

const normalizeProblemStatus = (value: unknown, fallback: ProblemStatus = 'Todo'): ProblemStatus => {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('solve') || normalized.includes('complete')) {
    return 'Solved';
  }

  if (normalized.includes('attempt') || normalized.includes('progress')) {
    return 'Attempted';
  }

  return fallback;
};

const normalizeDeadlinePriority = (value: unknown, fallback: DeadlinePriority = 'medium'): DeadlinePriority => {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('high') || normalized.includes('urgent')) {
    return 'high';
  }

  if (normalized.includes('low')) {
    return 'low';
  }

  if (normalized.includes('medium')) {
    return 'medium';
  }

  return fallback;
};

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

const clampProgress = (value: unknown, fallback: number) => Math.min(100, Math.max(0, toNumber(value, fallback)));

const buildFallbackCourseDetail = (id?: string) => {
  const matchedCourse = seedCourseDetails.find((course) => course.id === id);

  if (matchedCourse) {
    return matchedCourse;
  }

  if (!id) {
    return seedCourseDetails[0];
  }

  const baseCourse = seedCourseDetails[0];

  return {
    ...baseCourse,
    id,
    title: `Course ${id}: Guided Learning Path`,
    description: 'A curated course track with guided modules, checkpoints, and practice prompts.',
    modules: baseCourse.modules.map((module, index) => ({
      ...module,
      id: `${id}-${module.id}`,
      completed: index === 0
    }))
  };
};

const annotateCourseSummary = (
  course: LearningCourseSummary,
  dataSource: LearningDataSource,
  dataMessage?: string
): LearningCourseSummary => ({
  ...course,
  dataSource,
  dataMessage
});

const annotateCourseDetail = (
  course: LearningCourseDetail,
  dataSource: LearningDataSource,
  dataMessage?: string
): LearningCourseDetail => ({
  ...course,
  dataSource,
  dataMessage
});

const annotateProblem = (
  problem: LearningProblem,
  dataSource: LearningDataSource,
  dataMessage?: string
): LearningProblem => ({
  ...problem,
  dataSource,
  dataMessage
});

const mapCourseSummary = (course: ContentRecord | null | undefined, fallback: LearningCourseSummary): LearningCourseSummary => {
  const moduleCount = Array.isArray(course?.modules)
    ? course.modules.length
    : toNumber(course?.lessons ?? course?.lesson_count ?? course?.module_count, fallback.lessonCount);

  return {
    id: String(course?.id ?? fallback.id),
    title: toText(course?.title, fallback.title),
    description: toText(course?.description, fallback.description),
    instructor: toText(course?.instructor ?? course?.mentor, fallback.instructor),
    duration: toText(course?.duration ?? course?.estimated_duration, fallback.duration),
    level: normalizeCourseLevel(course?.difficulty || course?.level, fallback.level),
    lessonCount: moduleCount,
    progress: clampProgress(course?.progress ?? course?.completion_rate, fallback.progress),
    category: toText(course?.category ?? course?.track, fallback.category),
    status: String(course?.status || fallback.status).toLowerCase() === 'completed'
      ? 'completed'
      : String(course?.status || fallback.status).toLowerCase() === 'enrolled'
        ? 'enrolled'
        : fallback.status,
    nextDeadline: toText(course?.deadline ?? course?.next_deadline, fallback.nextDeadline || '')
  };
};

const mapCourseModule = (module: ContentRecord | null | undefined, fallbackModule: LearningCourseModule, index: number): LearningCourseModule => ({
  id: String(module?.id ?? fallbackModule.id ?? `module-${index + 1}`),
  title: toText(module?.title ?? module?.name, fallbackModule.title),
  lessons: toNumber(module?.lessons ?? module?.lesson_count, fallbackModule.lessons),
  completed: Boolean(module?.completed ?? module?.is_completed ?? fallbackModule.completed),
  summary: toText(module?.summary ?? module?.description, fallbackModule.summary)
});

const mapCourseDetail = (course: ContentRecord | null | undefined, fallback: LearningCourseDetail): LearningCourseDetail => {
  const summary = mapCourseSummary(course, fallback);
  const rawModules = toArray<ContentRecord>(course?.modules);

  return {
    ...fallback,
    ...summary,
    language: toText(course?.language, fallback.language),
    access: toText(course?.access, fallback.access),
    certificate: toText(course?.certificate, fallback.certificate),
    outcomes: toArray<string>(course?.outcomes).length > 0 ? toArray<string>(course.outcomes) : fallback.outcomes,
    modules:
      rawModules.length > 0
        ? rawModules.map((module, index) => mapCourseModule(module, fallback.modules[index] || fallback.modules[fallback.modules.length - 1], index))
        : fallback.modules
  };
};

const mapProblem = (problem: ContentRecord | null | undefined, fallback: LearningProblem): LearningProblem => ({
  id: String(problem?.id ?? fallback.id),
  title: toText(problem?.title, fallback.title),
  description: toText(problem?.description, fallback.description),
  difficulty: normalizeProblemDifficulty(problem?.difficulty || problem?.level, fallback.difficulty),
  category: toText(problem?.category ?? problem?.tag ?? problem?.language, fallback.category),
  status: normalizeProblemStatus(problem?.status, fallback.status),
  xp: toNumber(problem?.xp ?? problem?.points ?? problem?.score, fallback.xp),
  constraints: toArray<string>(problem?.constraints).length > 0 ? toArray<string>(problem.constraints) : fallback.constraints,
  starterCode: toText(problem?.starter_code ?? problem?.starterCode, fallback.starterCode)
});

const mapActivity = (activity: ContentRecord | null | undefined, fallback: LearningActivity, index: number): LearningActivity => ({
  id: String(activity?.id ?? fallback.id ?? `activity-${index + 1}`),
  title: toText(activity?.title ?? activity?.action, fallback.title),
  description: toText(activity?.description ?? activity?.detail ?? activity?.status ?? activity?.user, fallback.description),
  timestamp: toText(activity?.timestamp ?? activity?.created_at, fallback.timestamp),
  points: activity?.points != null ? toNumber(activity.points, fallback.points || 0) : fallback.points
});

const normalizeDashboardStats = (payload: unknown): DashboardStatsLike => {
  if (!isContentRecord(payload)) {
    return {};
  }

  if (isContentRecord(payload.stats)) {
    return payload.stats as DashboardStatsLike;
  }

  return payload as DashboardStatsLike;
};

const mapDeadline = (course: ContentRecord | null | undefined, fallback: LearningDeadline, index: number): LearningDeadline => ({
  id: String(course?.id ?? fallback.id ?? `deadline-${index + 1}`),
  title: toText(course?.deadline_title ?? course?.title, fallback.title),
  course: toText(course?.course ?? course?.title, fallback.course),
  deadline: toText(course?.deadline ?? course?.next_deadline, fallback.deadline),
  priority: normalizeDeadlinePriority(course?.priority, fallback.priority)
});

const buildAchievements = (stats: DashboardStatsLike): LearningAchievement[] => [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: 'Goal',
    points: 10,
    unlocked: toNumber(stats.completed_courses ?? stats.courses_completed, 0) > 0
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'Streak',
    points: 50,
    unlocked: toNumber(stats.study_streak ?? stats.streak, 0) >= 7
  },
  {
    id: 'problem-solver',
    title: 'Problem Solver',
    description: 'Solve 10 coding problems',
    icon: 'Code',
    points: 25,
    unlocked: toNumber(stats.problems_solved, 0) >= 10
  }
];

const buildDashboardStats = (stats: DashboardStatsLike): LearningDashboardStats => ({
  totalPoints: toNumber(stats.points ?? stats.total_points, 0),
  completedCourses: toNumber(stats.completed_courses ?? stats.courses_completed, 0),
  currentLevel: toNumber(stats.level, 1),
  studyStreak: toNumber(stats.study_streak ?? stats.streak, 0),
  problemsSolved: toNumber(stats.problems_solved, 0)
});

export const getFallbackCourseCatalog = () => seedCourseDetails.map((course) => ({
  id: course.id,
  title: course.title,
  description: course.description,
  instructor: course.instructor,
  duration: course.duration,
  level: course.level,
  lessonCount: course.lessonCount,
  progress: course.progress,
  category: course.category,
  status: course.status,
  nextDeadline: course.nextDeadline
}));

export const getCourseCatalog = async (): Promise<LearningCourseSummary[]> => {
  const fallbackCourses = getFallbackCourseCatalog();
  const demoMessage = 'Showing Sample Data for courses because live course data is unavailable in this environment.';

  try {
    const response = await fixedApiService.courses.getList({ limit: 12 });
    const payload = unwrapApiData(response);
    const dataSource = getPayloadDataSource(response);
    const rawCourses = pickArray<ContentRecord>(payload, ['courses', 'items', 'results']);

    if (rawCourses.length > 0) {
      return rawCourses.map((course, index) =>
        annotateCourseSummary(
          mapCourseSummary(course, fallbackCourses[index] || fallbackCourses[index % fallbackCourses.length]),
          dataSource,
          dataSource === 'demo' ? demoMessage : undefined
        )
      );
    }
  } catch {
    return fallbackCourses.map((course) => annotateCourseSummary(course, 'demo', demoMessage));
  }

  return fallbackCourses.map((course) => annotateCourseSummary(course, 'demo', demoMessage));
};

export const getLearningDashboardStats = async (): Promise<LearningDashboardStats> => {
  // Dashboard metrics should never use seeded progress because that misrepresents user data.
  if (!tokenUtils.hasActiveSession()) {
    return buildDashboardStats({});
  }

  try {
    const response = await fixedApiService.users.getStats();
    const payload = normalizeDashboardStats(unwrapApiData(response));
    return buildDashboardStats(payload);
  } catch {
    return buildDashboardStats({});
  }
};

export const getCourseDetail = async (id?: string): Promise<LearningCourseDetail> => {
  const fallbackCourse = buildFallbackCourseDetail(id);
  const demoMessage = 'Showing Sample Data for this course because live course data is unavailable in this environment.';

  if (!id) {
    return annotateCourseDetail(fallbackCourse, 'demo', demoMessage);
  }

  try {
    const response = await fixedApiService.courses.getById(id);
    const payload = unwrapApiData(response);
    const dataSource = getPayloadDataSource(response);
    const rawCourse = isContentRecord(payload)
      ? payload.course ?? payload.item ?? payload
      : Array.isArray(payload)
        ? payload[0]
        : payload;

    if (rawCourse && typeof rawCourse === 'object') {
      return annotateCourseDetail(
        mapCourseDetail(rawCourse as ContentRecord, fallbackCourse),
        dataSource,
        dataSource === 'demo' ? demoMessage : undefined
      );
    }
  } catch {
    return annotateCourseDetail(fallbackCourse, 'demo', demoMessage);
  }

  return annotateCourseDetail(fallbackCourse, 'demo', demoMessage);
};

export const getPracticeProblems = async (): Promise<LearningProblem[]> => {
  const demoMessage = 'Showing Sample Data for practice problems because live problem data is unavailable in this environment.';

  try {
    const response = await fixedApiService.problems.getList({ limit: 50 });
    const payload = unwrapApiData(response);
    const dataSource = getPayloadDataSource(response);
    const rawProblems = pickArray<ContentRecord>(payload, ['problems', 'items', 'results']);

    if (rawProblems.length > 0) {
      return rawProblems.map((problem, index) =>
        annotateProblem(
          mapProblem(problem, seedProblems[index] || seedProblems[index % seedProblems.length]),
          dataSource,
          dataSource === 'demo' ? demoMessage : undefined
        )
      );
    }
  } catch {
    return seedProblems.map((problem) => annotateProblem(problem, 'demo', demoMessage));
  }

  return seedProblems.map((problem) => annotateProblem(problem, 'demo', demoMessage));
};

export const getPracticeProblemById = async (id?: string): Promise<LearningProblem> => {
  const fallbackProblem = seedProblems.find((problem) => problem.id === id) || seedProblems[0];
  const demoMessage = 'Showing Sample Data for this problem because live problem data is unavailable in this environment.';

  if (!id) {
    return annotateProblem(fallbackProblem, 'demo', demoMessage);
  }

  try {
    const response = await fixedApiService.problems.getById(id);
    const payload = unwrapApiData(response);
    const dataSource = getPayloadDataSource(response);
    const rawProblem = isContentRecord(payload)
      ? payload.problem ?? payload.item ?? payload
      : Array.isArray(payload)
        ? payload[0]
        : payload;

    if (rawProblem && typeof rawProblem === 'object') {
      return annotateProblem(
        mapProblem(rawProblem as ContentRecord, fallbackProblem),
        dataSource,
        dataSource === 'demo' ? demoMessage : undefined
      );
    }
  } catch {
    return annotateProblem(fallbackProblem, 'demo', demoMessage);
  }

  return annotateProblem(fallbackProblem, 'demo', demoMessage);
};

export const getLearningActivity = async (): Promise<LearningActivity[]> => {
  if (!tokenUtils.hasActiveSession()) {
    return [];
  }

  try {
    const response = await fixedApiService.dashboard.getActivity();
    const payload = unwrapApiData(response);
    const rawActivities = pickArray<ContentRecord>(payload, ['activities', 'items', 'results']);

    if (rawActivities.length > 0) {
      return rawActivities.map((activity, index) => mapActivity(activity, seedActivities[index] || seedActivities[index % seedActivities.length], index));
    }
  } catch {
    return [];
  }

  return [];
};

export const getLearningDeadlines = async (): Promise<LearningDeadline[]> => {
  if (!tokenUtils.hasActiveSession()) {
    return [];
  }

  try {
    const response = await fixedApiService.courses.getList({ status: 'enrolled', limit: 8 });
    const payload = unwrapApiData(response);
    const rawCourses = pickArray<ContentRecord>(payload, ['courses', 'items', 'results']);
    const deadlineCourses = rawCourses.filter((course) => course?.deadline || course?.next_deadline);

    if (deadlineCourses.length > 0) {
      return deadlineCourses
        .slice(0, 6)
        .map((course, index) => mapDeadline(course, seedDeadlines[index] || seedDeadlines[index % seedDeadlines.length], index));
    }
  } catch {
    return [];
  }

  return [];
};

export const getLearningAchievements = async (): Promise<LearningAchievement[]> => {
  if (!tokenUtils.hasActiveSession()) {
    return buildAchievements({});
  }

  try {
    const response = await fixedApiService.users.getStats();
    const payload = normalizeDashboardStats(unwrapApiData(response));
    return buildAchievements(payload);
  } catch {
    return buildAchievements({});
  }
};

export const getQuizQuestions = (categoryId: string, difficulty: QuizDifficulty): QuizQuestion[] => {
  const difficultyRank = { easy: 0, medium: 1, hard: 2 } as const;

  return seedQuizQuestions
    .filter((question) => question.categoryId === categoryId)
    .sort((left, right) => {
      const leftDelta = Math.abs(difficultyRank[left.difficulty] - difficultyRank[difficulty]);
      const rightDelta = Math.abs(difficultyRank[right.difficulty] - difficultyRank[difficulty]);
      return leftDelta - rightDelta;
    })
    .map((question): QuizQuestion => ({
      id: question.id,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    }));
};
