import React from 'react';
import { cn } from '../../utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '7xl';
}

const sizeClasses: Record<NonNullable<ResponsiveContainerProps['size']>, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  '7xl': 'max-w-[90rem]'
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children, className, size = '2xl' }) => {
  return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>{children}</div>;
};

export default ResponsiveContainer;
