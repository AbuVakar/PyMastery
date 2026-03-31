import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { useAuth } from './AuthProvider';
import { primaryNavigationLinks, resolveNavigationHref } from './navigationConfig';
import PythonSnakeIcon from './ui/PythonSnakeIcon';

interface ResolvedNavigationLink {
  label: string;
  href: string;
}

const splitHref = (href: string): { path: string; hash: string } => {
  const [path, hash] = href.split('#');
  return {
    path: path || '/',
    hash: hash ? `#${hash}` : ''
  };
};

// Only show these 5 links in the main nav — keeps it clean
const NAV_LABELS_ALLOWED = new Set(['Home', 'Learn', 'Projects', 'Roadmap', 'Contact Us']);

const Navbar: React.FC = () => {
  const { addToast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigationLinks = useMemo<ResolvedNavigationLink[]>(
    () =>
      primaryNavigationLinks
        .filter((item) => !item.authOnly || isAuthenticated)
        .filter((item) => !item.guestOnly || !isAuthenticated)
        .filter((item) => NAV_LABELS_ALLOWED.has(item.label))
        .map((item) => ({
          label: item.label,
          href: resolveNavigationHref(item, isAuthenticated)
        })),
    [isAuthenticated]
  );

  useEffect(() => {
    if (!isProfileOpen) return undefined;
    const handleClickOutside = (e: MouseEvent) => {
      if (!profileDropdownRef.current?.contains(e.target as Node)) setIsProfileOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsProfileOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => {
    const { path, hash } = splitHref(href);
    if (hash) return location.pathname === path && location.hash === hash;
    if (path === '/') return location.pathname === '/' && !location.hash;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    addToast({ type: 'success', title: 'Logged Out', message: 'See you again soon!' });
    navigate('/', { replace: true });
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95'
          : 'border-b border-transparent bg-white/80 backdrop-blur-md dark:bg-slate-950/80'
      }`}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25 transition-transform group-hover:scale-105">
            <PythonSnakeIcon className="h-5 w-5" />
          </div>
          <span className="text-[1.05rem] font-bold tracking-tight text-slate-900 dark:text-white">
            PyMastery
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={
                isActive(link.href)
                  ? 'rounded-lg px-3.5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400'
                  : 'rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {isAuthenticated ? (
            <div ref={profileDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((p) => !p)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                aria-expanded={isProfileOpen}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-[10px] font-bold text-white">
                  {(user?.name || 'L')[0].toUpperCase()}
                </span>
                <span className="max-w-[7rem] truncate">{user?.name || 'Learner'}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2.5 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                  <div className="px-3.5 pb-2.5 pt-2">
                    <p className="text-xs font-medium text-slate-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    {[
                      { to: '/dashboard', label: 'Dashboard' },
                      { to: '/profile', label: 'Profile' },
                      { to: '/settings', label: 'Settings' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setIsMobileMenuOpen((p) => !p)}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="sr-only">Toggle menu</span>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-3 top-[4.75rem] z-50 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/15 lg:hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-0.5">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={
                    isActive(link.href)
                      ? 'block rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 dark:border-slate-800">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
