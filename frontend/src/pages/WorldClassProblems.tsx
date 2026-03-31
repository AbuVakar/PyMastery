import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Input, LoadingPage } from '../components/ui';
import { getPracticeProblems, LearningProblem } from '../services/learningContent';
import { cn } from '../utils';

const WorldClassProblems: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [problems, setProblems] = useState<LearningProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProblems = async () => {
      try {
        setIsLoading(true);
        const nextProblems = await getPracticeProblems();

        if (isMounted) {
          setProblems(nextProblems);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(problems.map((problem) => problem.category)))], [problems]);

  const filteredProblems = useMemo(
    () =>
      problems.filter(
        (problem) =>
          (filter === 'All' || problem.category === filter) &&
          (problem.title.toLowerCase().includes(search.toLowerCase()) || problem.description.toLowerCase().includes(search.toLowerCase()))
      ),
    [filter, problems, search]
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading practice problems..." />;
  }

  const showDemoBanner = problems.some((problem) => problem.dataSource === 'demo');

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Problem Set</h1>
            <p className="mt-1 text-gray-600 dark:text-slate-400">Challenge yourself with curated Python, frontend, and interview-style exercises.</p>
          </div>
          <div className="w-full md:w-80">
            <Input
              placeholder="Search problems..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                filter === category
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {showDemoBanner && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
            {problems.find((problem) => problem.dataSource === 'demo')?.dataMessage || 'Showing Sample Data for practice problems because live problem data is unavailable right now.'}
          </div>
        )}

        {filteredProblems.length === 0 ? (
          <EmptyState
            title="No matching problems"
            message="Try a different category or search term to surface more practice prompts."
            action={problems.length > 0 ? { label: 'Clear Filters', onClick: () => { setFilter('All'); setSearch(''); } } : undefined}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">Difficulty</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">XP</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredProblems.map((problem) => (
                    <tr key={problem.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60">
                      <td className="px-6 py-4">
                        {problem.status === 'Solved' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : problem.status === 'Attempted' ? (
                          <Clock3 className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-slate-600" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{problem.title}</div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">{problem.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">{problem.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">+{problem.xp}</td>
                      <td className="px-6 py-4">
                        <Link to={`/solve/${problem.id}`}>
                          <Button size="sm" variant="ghost">
                            Solve
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorldClassProblems;
