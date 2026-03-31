import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';

interface SuccessMessageProps {
  children: React.ReactNode;
  className?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ children, className }) => {
  if (!children) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
        className
      )}
    >
      <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
};

export default SuccessMessage;
