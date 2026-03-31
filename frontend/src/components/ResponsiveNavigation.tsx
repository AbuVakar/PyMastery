/**
 * ResponsiveNavigation Component
 * Mobile-first responsive navigation with adaptive menu
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  active?: boolean;
  children?: NavigationItem[];
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  className?: string;
  variant?: 'header' | 'sidebar' | 'bottom' | 'top';
  logo?: React.ReactNode;
  userMenu?: React.ReactNode;
  searchComponent?: React.ReactNode;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  className,
  variant = 'header',
  logo,
  userMenu,
  searchComponent,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const hasIcon = !!item.icon;
    const hasBadge = !!item.badge;

    const itemClasses = cn(
      'flex items-center w-full px-3 py-2 mobile:px-4 mobile:py-3 text-mobile-sm text-sm font-medium rounded-lg transition-colors',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      item.active && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
      depth > 0 && 'pl-8 mobile:pl-12'
    );

    const content = (
      <>
        {hasIcon && (
          <span className="w-5 h-5 mobile:w-6 mobile:h-6 mr-3 mobile:mr-4 flex-shrink-0">
            {item.icon}
          </span>
        )}
        <span className="flex-1 mobile-truncate">{item.label}</span>
        {hasBadge && (
          <span className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <svg
            className={cn(
              'w-4 h-4 mobile:w-5 mobile:h-5 ml-2 transition-transform',
              isExpanded ? 'rotate-90' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </>
    );

    if (item.href) {
      return (
        <a
          key={item.id}
          href={item.href}
          className={itemClasses}
          onClick={item.onClick}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => {
          if (hasChildren) {
            toggleExpanded(item.id);
          } else if (item.onClick) {
            item.onClick();
          }
        }}
        className={itemClasses}
      >
        {content}
      </button>
    );
  };

  const renderNavigationItems = (items: NavigationItem[], depth = 0) => {
    return (
      <div className={cn('space-y-1', depth > 0 && 'ml-2')}>
        {items.map((item) => (
          <div key={item.id}>
            {renderNavigationItem(item, depth)}
            {item.children && expandedItems.has(item.id) && (
              <div className="mt-1">
                {renderNavigationItems(item.children, depth + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Header Navigation (Desktop/Tablet)
  if (variant === 'header' && !isMobile) {
    return (
      <nav className={cn('flex items-center justify-between', className)}>
        {logo && (
          <div className="flex-shrink-0">
            {logo}
          </div>
        )}
        
        <div className="hidden tablet:flex items-center flex-1 max-w-lg mx-8">
          {searchComponent}
        </div>

        <div className="hidden tablet:flex items-center space-x-1">
          {renderNavigationItems(items)}
        </div>

        {userMenu && (
          <div className="hidden tablet:block ml-4">
            {userMenu}
          </div>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="button-touch p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </nav>
    );
  }

  // Sidebar Navigation
  if (variant === 'sidebar') {
    return (
      <nav className={cn('h-full overflow-y-auto', className)}>
        <div className="space-y-2 p-4 mobile:p-6">
          {renderNavigationItems(items)}
        </div>
      </nav>
    );
  }

  // Bottom Navigation (Mobile)
  if (variant === 'bottom' || (variant === 'header' && isMobile)) {
    return (
      <>
        {/* Mobile Menu Overlay */}
        {isMobile && variant === 'header' && mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Navigation */}
        {isMobile && variant === 'header' && mobileMenuOpen && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-xl">
            <div className="mobile-header">
              <div className="flex items-center justify-between">
                {logo && <div className="flex-shrink-0">{logo}</div>}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="button-touch p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 mobile:p-6">
              {renderNavigationItems(items)}
              {userMenu && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {userMenu}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        {variant === 'bottom' && (
          <div className="mobile-nav">
            {items.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center justify-center p-2 mobile:p-3 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  item.active && 'text-primary-600 dark:text-primary-400'
                )}
              >
                {item.icon && (
                  <div className="w-6 h-6 mobile:w-7 mobile:h-7 mb-1">
                    {item.icon}
                  </div>
                )}
                <span className="text-mobile-xs text-xs mobile-truncate">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </a>
            ))}
          </div>
        )}
      </>
    );
  }

  // Top Navigation (Tablet/Desktop)
  if (variant === 'top') {
    return (
      <nav className={cn('bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', className)}>
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 mobile:h-14">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}
            
            <div className="hidden tablet:flex items-center flex-1 max-w-md mx-8">
              {searchComponent}
            </div>

            <div className="hidden tablet:flex items-center space-x-4">
              {renderNavigationItems(items)}
            </div>

            {userMenu && (
              <div className="hidden tablet:block ml-4">
                {userMenu}
              </div>
            )}

            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="button-touch p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return null;
};

export default ResponsiveNavigation;
