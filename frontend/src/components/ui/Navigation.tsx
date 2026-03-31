import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  ChevronDown,
  Bell,
  Search
} from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils';
import { useAuth } from '../AuthProvider';

interface NavigationProps {
  variant?: 'header' | 'sidebar' | 'mobile';
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const Navigation: React.FC<NavigationProps> = ({ variant = 'header', className }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />
    },
    {
      label: 'Courses',
      href: '/courses',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="h-5 w-5" />
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleProfileMenuToggle = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const active = isActive(item.href);
    
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800',
          isMobile && 'w-full'
        )}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  if (variant === 'sidebar') {
    return (
      <nav className={cn('w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 p-4', className)}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PyMastery</span>
          </div>

          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map(item => renderNavItem(item))}
          </div>

          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  if (variant === 'mobile') {
    return (
      <>
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
            onClick={handleMobileMenuToggle}
          />
        )}
        
        {/* Mobile menu */}
        <div className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex flex-col h-full">
            {/* Mobile header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">PyMastery</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMobileMenuToggle}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-1">
                {mainNavItems.map(item => renderNavItem(item, true))}
              </div>

              {isAuthenticated && user ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate('/signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Header navigation (default)
  return (
    <header className={cn('bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PyMastery</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-1">
              {mainNavItems.map(item => renderNavItem(item))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            {isAuthenticated && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            )}

            {/* User menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileMenuToggle}
                  className="flex items-center space-x-2"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Profile dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email || 'user@example.com'}
                      </p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileMenuToggle}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <Navigation variant="mobile" />
    </header>
  );
};

export default Navigation;
