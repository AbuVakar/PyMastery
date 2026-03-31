/**
 * ResponsiveStats Component
 * Mobile-first responsive statistics display
 */

import React from 'react';
import { cn } from '../utils/cn';
import Card from './ui/Card';

interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface ResponsiveStatsProps {
  stats: StatItem[];
  layout?: 'grid' | 'horizontal' | 'vertical';
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

const ResponsiveStats: React.FC<ResponsiveStatsProps> = ({
  stats,
  layout = 'grid',
  cols: _cols = { mobile: 1, tablet: 2, desktop: 4 },
  className,
}) => {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'primary':
        return 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20';
      case 'secondary':
        return 'text-secondary-600 bg-secondary-50 dark:text-secondary-400 dark:bg-secondary-900/20';
      case 'success':
        return 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20';
      case 'warning':
        return 'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/20';
      case 'error':
        return 'text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getChangeClasses = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/20';
      case 'decrease':
        return 'text-error-600 bg-error-100 dark:text-error-400 dark:bg-error-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const renderStatItem = (stat: StatItem, index: number) => {
    const colorClasses = getColorClasses(stat.color);
    
    return (
      <Card
        key={index}
        variant="default"
        className="p-4 mobile:p-6"
      >
        <div className="flex items-center justify-between mb-3">
          {stat.icon && (
            <div className={cn('p-2 rounded-lg', colorClasses)}>
              {stat.icon}
            </div>
          )}
          {stat.change && (
            <div className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              getChangeClasses(stat.change.type)
            )}>
              {stat.change.value}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl mobile:text-3xl font-bold text-gray-900 dark:text-white">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </div>
          <div className="text-mobile-sm text-sm text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
        </div>
      </Card>
    );
  };

  if (layout === 'horizontal') {
    return (
      <div className={cn('flex overflow-x-auto space-x-4 pb-4', className)}>
        {stats.map((stat, index) => (
          <div key={index} className="flex-shrink-0 w-64 mobile:w-80">
            {renderStatItem(stat, index)}
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {stats.map((stat, index) => renderStatItem(stat, index))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {stats.map((stat, index) => renderStatItem(stat, index))}
    </div>
  );
};

export default ResponsiveStats;
