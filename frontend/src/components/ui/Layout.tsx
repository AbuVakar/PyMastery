import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { cn } from '../../utils';

interface LayoutProps {
  variant?: 'default' | 'sidebar' | 'minimal';
  showNavigation?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  variant = 'default', 
  showNavigation = true,
  className,
  children 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const baseLayoutClassName = 'flex min-h-full w-full flex-col bg-gray-50 dark:bg-slate-900';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (variant === 'minimal') {
    return (
      <div className={cn(baseLayoutClassName, className)}>
        {children || <Outlet />}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('flex min-h-full w-full bg-gray-50 dark:bg-slate-900', className)}>
        {/* Sidebar */}
        <div className={cn(
          'hidden lg:block lg:flex-shrink-0',
          sidebarOpen && 'block lg:block'
        )}>
          <Navigation variant="sidebar" />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Mobile sidebar */}
        <div className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Navigation variant="sidebar" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden">
            <Navigation variant="header" />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    );
  }

  // Default layout with header
  return (
    <div className={cn(baseLayoutClassName, className)}>
      {showNavigation && <Navigation variant="header" />}
      
      {/* Page content */}
      <main className={cn(
        'flex-1',
        showNavigation ? 'pt-0' : 'pt-0'
      )}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
