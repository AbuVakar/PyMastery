import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LegacyFeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    to: string;
  };
  secondaryAction?: {
    label: string;
    to: string;
  };
  highlights: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
  }>;
}

const LegacyFeaturePage: React.FC<LegacyFeaturePageProps> = ({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  highlights
}) => {
  return (
    <div className="bg-gray-50 px-4 py-10 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {eyebrow}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                Preview only. This area is not fully implemented yet, so this page is a product outline rather than a working feature.
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={primaryAction.to}
                  className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  {primaryAction.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                {secondaryAction && (
                  <Link
                    to={secondaryAction.to}
                    className="inline-flex items-center rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {secondaryAction.label}
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-6 dark:bg-slate-800/80">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What this preview outlines</div>
              <div className="mt-5 space-y-4">
                {highlights.map((highlight) => {
                  const Icon = highlight.icon;

                  return (
                    <div key={highlight.title} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-slate-900 dark:text-white">{highlight.title}</h2>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{highlight.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LegacyFeaturePage;
