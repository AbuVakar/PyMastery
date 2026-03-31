import React from 'react';
import { cn } from '../../utils';
import ResponsiveContainer from './ResponsiveContainer';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '7xl';
  as?: keyof React.JSX.IntrinsicElements;
}

const PageShell: React.FC<PageShellProps> = ({
  children,
  className,
  containerClassName,
  size = '2xl',
  as: Component = 'div'
}) => {
  return (
    <Component className={cn('w-full bg-gray-50 dark:bg-slate-900', className)}>
      <ResponsiveContainer size={size} className={cn('py-8 sm:py-10', containerClassName)}>
        {children}
      </ResponsiveContainer>
    </Component>
  );
};

export default PageShell;
