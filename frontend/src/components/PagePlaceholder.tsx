import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, LayoutDashboard, Sparkles, Wrench } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  homeLabel?: string;
  homeTo?: string;
}

const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  description = 'This page is still being wired into the restored app. The core navigation is working, and this section will be expanded next.',
  homeLabel = 'Return Home',
  homeTo = '/'
}) => {
  const displayTitle = title.replace(/([a-z])([A-Z])/g, '$1 $2').trim();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[65vh] max-w-5xl items-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Sparkles className="mr-2 h-4 w-4" />
              Feature preview
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{displayTitle}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={homeTo}
                className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {homeLabel}
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-6 dark:bg-slate-800/80">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <Wrench className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">Available right now</h2>
            <div className="mt-5 space-y-3">
              <Link
                to="/dashboard"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex items-center">
                  <LayoutDashboard className="mr-3 h-5 w-5 text-blue-500" />
                  <span className="font-medium text-slate-900 dark:text-white">Dashboard</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/courses"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 text-blue-500" />
                  <span className="font-medium text-slate-900 dark:text-white">Courses</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
              This placeholder is intentionally polished so unfinished legacy routes still feel part of the same app instead of looking broken.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagePlaceholder;
