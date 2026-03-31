/**
 * ResponsiveGrid Component
 * Mobile-first responsive grid system
 */

import React from 'react';
import { cn } from '../utils/cn';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  autoFit?: boolean;
  minItemWidth?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: '4', tablet: '6', desktop: '8' },
  autoFit = false,
  minItemWidth: _minItemWidth = '250px',
}) => {
  const gridClasses = cn(
    'grid',
    {
      // Auto-fit grid
      'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]': autoFit,
      
      // Fixed column grids
      [`grid-cols-${cols.mobile}`]: cols.mobile && !autoFit,
      [`tablet:grid-cols-${cols.tablet}`]: cols.tablet && !autoFit,
      [`desktop:grid-cols-${cols.desktop}`]: cols.desktop && !autoFit,
      
      // Responsive gaps
      [`gap-${gap.mobile}`]: gap.mobile,
      [`tablet:gap-${gap.tablet}`]: gap.tablet,
      [`desktop:gap-${gap.desktop}`]: gap.desktop,
    },
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
