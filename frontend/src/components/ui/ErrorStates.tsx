import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, Home, RefreshCw, Sparkles, Target } from 'lucide-react';
import { cn } from '../../utils';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  className?: string;
}

interface PageErrorProps {
  error?: Error | string;
  onRetry?: () => void;
  showHome?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  variant = 'error',
  showRetry = true,
  onRetry,
  showHome = true,
  showBack = false,
  onHome,
  className
}) => {
  const navigate = useNavigate();

  const variants = {
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  return (
    <div className={cn('space-y-4 rounded-lg border p-6 text-center', variants[variant], className)}>
      <div className="flex justify-center">
        <AlertTriangle className={cn('h-12 w-12', iconColors[variant])} />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm opacity-90">{message}</p>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        )}

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </button>
        )}

        {showHome && (
          <button
            onClick={() => (onHome ? onHome() : navigate('/'))}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ title = 'No data found', message = 'There are no items to display at the moment.', icon, action, className }) => {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-700 dark:bg-slate-800/50', className)}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}

      <div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>

      {action && (
        <button onClick={action.onClick} className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
          {action.label}
        </button>
      )}
    </div>
  );
};

const PageError: React.FC<PageErrorProps> = ({ error, onRetry, showHome = true }) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error occurred';

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-gray-50 px-4 py-10 dark:bg-slate-900">
      <div className="mx-4 w-full max-w-md">
        <ErrorState title="Page Error" message={errorMessage} onRetry={onRetry} showHome={showHome} showBack />
      </div>
    </div>
  );
};

const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState title="Network Error" message="Unable to connect to the server. Please check your internet connection and try again." onRetry={onRetry} />
);

const NotFoundError: React.FC<{ onHome?: () => void }> = ({ onHome }) => (
  <ErrorState title="Page Not Found" message="The page you are looking for doesn't exist or has moved." showRetry={false} onHome={onHome} />
);

const UnauthorizedError: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => (
  <ErrorState
    title="Access Denied"
    message="You need to be logged in to access this page."
    variant="warning"
    showRetry={false}
    showHome
    onHome={onLogin}
  />
);

const ServerError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState title="Server Error" message="Our servers are experiencing issues. Please try again in a few moments." onRetry={onRetry} />
);

const EmptyCourses: React.FC<{ onBrowse?: () => void }> = ({ onBrowse }) => (
  <EmptyState
    title="No Courses Available"
    message="There are no courses matching your criteria right now."
    icon={<BookOpen className="h-10 w-10 text-blue-500" />}
    action={onBrowse ? { label: 'Browse All Courses', onClick: onBrowse } : undefined}
  />
);

const EmptyActivities: React.FC<{ onStart?: () => void }> = ({ onStart }) => (
  <EmptyState
    title="No Recent Activity"
    message="You have not started any learning activities yet."
    icon={<Target className="h-10 w-10 text-blue-500" />}
    action={onStart ? { label: 'Start Learning', onClick: onStart } : undefined}
  />
);

const EmptyAchievements: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => (
  <EmptyState
    title="No Achievements Yet"
    message="Complete courses and challenges to unlock your first milestones."
    icon={<Sparkles className="h-10 w-10 text-blue-500" />}
    action={onExplore ? { label: 'Explore Courses', onClick: onExplore } : undefined}
  />
);

export { ErrorState, EmptyState, PageError, NetworkError, NotFoundError, UnauthorizedError, ServerError, EmptyCourses, EmptyActivities, EmptyAchievements };

export default ErrorState;
