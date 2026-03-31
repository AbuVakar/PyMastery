import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
  footerCompanyLinks,
  footerLearnLinks,
  footerProductLinks,
  footerSupportLinks,
  resolveNavigationHref
} from './navigationConfig';
import PythonSnakeIcon from './ui/PythonSnakeIcon';

type FooterSection = {
  title: string;
  links: Array<{ label: string; to: string }>;
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();

  const createSectionLinks = useMemo(
    () =>
      (items: typeof footerProductLinks) =>
        items
          .filter((item) => !item.authOnly || isAuthenticated)
          .filter((item) => !item.guestOnly || !isAuthenticated)
          .map((item) => ({
            label: item.label,
            to: resolveNavigationHref(item, isAuthenticated)
          })),
    [isAuthenticated]
  );

  const sections: FooterSection[] = [
    { title: 'Explore', links: createSectionLinks(footerProductLinks) },
    { title: 'Learn', links: createSectionLinks(footerLearnLinks) },
    { title: 'Company', links: createSectionLinks(footerCompanyLinks) },
    { title: 'Support', links: createSectionLinks(footerSupportLinks) },
  ];

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="group inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-700/30 transition-transform group-hover:scale-105">
                <PythonSnakeIcon className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-white">PyMastery</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Structured Python learning paths, AI mentor support, and project practice built for learners who want real career outcomes.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="mailto:support@pymastery.com"
                className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              >
                <Mail className="h-3 w-3" />
                support@pymastery.com
              </a>
              <Link
                to="/contact"
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
              >
                Contact support
              </Link>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>&copy; {currentYear} PyMastery. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="transition-colors hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-slate-300">
              Terms of Use
            </Link>
            <Link to="/contact" className="transition-colors hover:text-slate-300">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
