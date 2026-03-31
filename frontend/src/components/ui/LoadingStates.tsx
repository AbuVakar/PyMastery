import React from 'react';
import { cn } from '../../utils';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  className?: string;
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

interface LoadingDotsProps {
  className?: string;
}

interface LoadingPageProps {
  message?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className }) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={cn('animate-spin', sizes[size], className)}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('animate-pulse', 'bg-gray-200 dark:bg-gray-700 rounded', i === 0 ? 'h-4 w-3/4' : i === lines - 1 ? 'h-4 w-1/2' : 'h-4 w-full')} />
      ))}
    </div>
  );
};

const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 bg-blue-600 rounded-full animate-bounce',
            i === 0 ? 'animation-delay-0' : i === 1 ? 'animation-delay-200' : 'animation-delay-400'
          )}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
};

const Loading: React.FC<LoadingProps> = ({ size = 'medium', message, variant = 'spinner', className }) => {
  const renderLoadingVariant = () => {
    switch (variant) {
      case 'skeleton':
        return <LoadingSkeleton className={className} />;
      case 'dots':
        return <LoadingDots className={className} />;
      case 'pulse':
        return <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', size === 'small' ? 'h-8 w-16' : size === 'medium' ? 'h-12 w-24' : 'h-16 w-32', className)} />;
      default:
        return <LoadingSpinner size={size} className={className} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderLoadingVariant()}
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

const LoadingPage: React.FC<LoadingPageProps> = ({ message = 'Loading...', fullPage = true }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <LoadingSpinner size="large" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {message}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-gray-50 px-4 py-10 dark:bg-slate-900">
        {content}
      </div>
    );
  }

  return content;
};

const CardLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 space-y-4', className)}>
    <LoadingSkeleton lines={2} />
    <div className="space-y-2">
      <LoadingSkeleton lines={1} />
      <LoadingSkeleton lines={1} />
    </div>
  </div>
);

const TableLoading: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
        <LoadingSkeleton lines={1} className="w-8 h-8 rounded" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton lines={1} />
          <LoadingSkeleton lines={1} />
        </div>
        <LoadingSkeleton lines={1} className="w-16 h-8" />
      </div>
    ))}
  </div>
);

export {
  Loading,
  LoadingSpinner,
  LoadingSkeleton,
  LoadingDots,
  LoadingPage,
  CardLoading,
  TableLoading
};

export default Loading;
