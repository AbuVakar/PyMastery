import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../utils';

interface ErrorMessageProps {
  children: React.ReactNode;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ children, className }) => {
  if (!children) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
        className
      )}
    >
      <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
};

export default ErrorMessage;
