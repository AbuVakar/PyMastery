import React, { useEffect, useState } from 'react';
import { Clock3, Flame, Trophy } from 'lucide-react';
import Card from '../components/ui/Card';
import { EmptyActivities, LoadingPage } from '../components/ui';
import { getLearningActivity, LearningActivity } from '../services/learningContent';

const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      try {
        const nextActivities = await getLearningActivity();
        if (isMounted) {
          setActivities(nextActivities);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const getIcon = (activity: LearningActivity) => {
    if ((activity.points || 0) >= 30) {
      return Trophy;
    }

    if (activity.title.toLowerCase().includes('review')) {
      return Clock3;
    }

    return Flame;
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return value;
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading activity..." />;
  }

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">A cleaner view of your recent learning progress.</p>
        </div>

        {activities.length === 0 ? (
          <EmptyActivities />
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity);
              return (
                <Card key={activity.id} className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{activity.description}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">{formatDate(activity.timestamp)}</p>
                    </div>
                    {activity.points ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        +{activity.points} XP
                      </span>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
