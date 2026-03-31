import React from 'react';
import { cn } from '../../utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
  hover = false,
  clickable = false,
  onClick,
  padding = { mobile: '4', tablet: '6', desktop: '8' },
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-card hover:shadow-card-hover',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-mobile border border-gray-200/50 dark:border-gray-700/50',
  };

  const paddingClasses = cn(
    `p-${padding.mobile}`,
    `tablet:p-${padding.tablet || padding.mobile}`,
    `desktop:p-${padding.desktop || padding.tablet || padding.mobile}`
  );

  const interactiveClasses = cn(
    hover && 'hover:scale-102 hover:shadow-lg',
    clickable && 'cursor-pointer active:scale-98',
    clickable && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
  );

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses,
    interactiveClasses,
    className
  );

  return (
    <div
      onClick={onClick}
      className={classes}
    >
      {children}
    </div>
  );
};

export default Card;
