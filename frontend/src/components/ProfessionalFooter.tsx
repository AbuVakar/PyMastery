import React from 'react';
import { Link } from 'react-router-dom';

const learningLinks = [
  { label: 'Problems', to: '/problems' },
  { label: 'Courses', to: '/courses' },
  { label: 'Quiz', to: '/quiz' },
  { label: 'AI Chat', to: '/ai-chat' }
];

const platformLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Settings', to: '/settings' },
  { label: 'Activity', to: '/activity' },
  { label: 'Deadlines', to: '/deadlines' }
];

const communityLinks = [
  { label: 'Achievements', to: '/achievements' },
  { label: 'Profile', to: '/profile' },
  { label: 'Login', to: '/login' },
  { label: 'Sign Up', to: '/signup' }
];

const ProfessionalFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 font-bold text-white">P</div>
              <span className="text-xl font-bold text-white">PyMastery</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              A focused learning platform for Python, frontend engineering, interview prep, and guided practice.
            </p>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-white">Learning</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {learningLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-cyan-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-white">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {platformLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-cyan-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-white">Community</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {communityLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-cyan-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} PyMastery. All rights reserved.</p>
          <div className="flex space-x-6 text-xs text-gray-500">
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link to="/signup" className="hover:text-gray-300">
              Sign Up
            </Link>
            <Link to="/settings" className="hover:text-gray-300">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ProfessionalFooter;
