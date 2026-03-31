/**
 * ResponsiveLayout Component
 * Mobile-first responsive layout system for PyMastery
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  navigation?: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  header,
  sidebar,
  footer,
  navigation,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1366);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className={cn(
      'flex min-h-full w-full flex-col bg-gray-50 dark:bg-gray-900',
      'mobile-safe-padding',
      className
    )}>
      {/* Mobile Header */}
      {isMobile && header && (
        <header className="mobile-header">
          {header}
        </header>
      )}

      {/* Desktop/Tablet Header */}
      {!isMobile && header && (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container-responsive">
            {header}
          </div>
        </header>
      )}

      {/* Mobile Navigation */}
      {isMobile && navigation && (
        <nav className="mobile-nav">
          {navigation}
        </nav>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black bg-opacity-50"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Mobile Sidebar */}
            {isMobile && (
              <aside className={cn(
                'fixed top-0 left-0 z-50 h-full w-80 max-w-[90vw] bg-white shadow-xl dark:bg-gray-800',
                'transform transition-transform duration-300 ease-in-out',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}>
                <div className="mobile-header">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="button-touch text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="h-full overflow-y-auto pb-20">
                  {sidebar}
                </div>
              </aside>
            )}

            {/* Tablet/Desktop Sidebar */}
            {!isMobile && (
              <aside className={cn(
                'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
                isTablet ? 'w-64' : 'w-72'
              )}>
                <div className="h-full overflow-y-auto">
                  {sidebar}
                </div>
              </aside>
            )}
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 overflow-x-hidden',
          'mobile-safe-padding',
          isMobile ? 'pb-20' : '' // Account for mobile nav
        )}>
          <div className="container-responsive py-4 mobile:py-3">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container-responsive py-6 mobile:py-4">
            {footer}
          </div>
        </footer>
      )}

      {/* Mobile Menu Toggle */}
      {isMobile && sidebar && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-24 right-4 z-30 button-touch bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ResponsiveLayout;
