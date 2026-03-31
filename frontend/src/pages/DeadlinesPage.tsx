import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import { EmptyState, LoadingPage } from '../components/ui';
import { getLearningDeadlines, LearningDeadline } from '../services/learningContent';

const DeadlinesPage: React.FC = () => {
  const [deadlines, setDeadlines] = useState<LearningDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDeadlines = async () => {
      try {
        const nextDeadlines = await getLearningDeadlines();
        if (isMounted) {
          setDeadlines(nextDeadlines);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDeadlines();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return value;
    }
  };

  const getPriorityClasses = (priority: LearningDeadline['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading deadlines..." />;
  }

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deadlines</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Upcoming milestones so you can stay on top of your work.</p>
        </div>

        {deadlines.length === 0 ? (
          <EmptyState
            title="No upcoming deadlines"
            message="You are all caught up right now."
            icon={<Calendar className="h-10 w-10 text-blue-500" />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {deadlines.map((deadline) => (
              <Card key={deadline.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{deadline.title}</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{deadline.course}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPriorityClasses(deadline.priority)}`}>{deadline.priority}</span>
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">Due {formatDate(deadline.deadline)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlinesPage;
