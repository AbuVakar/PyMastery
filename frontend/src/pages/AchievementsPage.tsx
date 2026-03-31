import React, { useEffect, useState } from 'react';
import { Award, Flame, Star } from 'lucide-react';
import Card from '../components/ui/Card';
import { EmptyAchievements, LoadingPage } from '../components/ui';
import { getLearningAchievements, LearningAchievement } from '../services/learningContent';

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<LearningAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAchievements = async () => {
      try {
        const nextAchievements = await getLearningAchievements();
        if (isMounted) {
          setAchievements(nextAchievements);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAchievements();

    return () => {
      isMounted = false;
    };
  }, []);

  const getIcon = (achievement: LearningAchievement) => {
    if (achievement.id === 'week-warrior') {
      return Flame;
    }

    if (achievement.unlocked) {
      return Award;
    }

    return Star;
  };

  if (isLoading) {
    return <LoadingPage message="Loading achievements..." />;
  }

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Your milestones, badges, and progress markers in one place.</p>
        </div>

        {achievements.length === 0 ? (
          <EmptyAchievements />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon = getIcon(achievement);
              return (
                <Card key={achievement.id} className="p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{achievement.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{achievement.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{achievement.points} pts</span>
                    <span className={achievement.unlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}>
                      {achievement.unlocked ? 'Unlocked' : 'In Progress'}
                    </span>
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

export default AchievementsPage;
