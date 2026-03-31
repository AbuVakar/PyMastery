import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfUsePage: React.FC = () => {
  return (
    <div className="bg-gray-50 px-4 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-800 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Terms of Use
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Ground rules for using PyMastery</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-gray-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account responsibility</h2>
            <p className="mt-2">
              Keep your login details secure and make sure the information you provide is accurate. You are
              responsible for activity performed through your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Acceptable use</h2>
            <p className="mt-2">
              Use the platform for lawful learning, practice, and collaboration. Do not attempt to abuse the service,
              disrupt other learners, or misuse code execution and AI features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content and progress</h2>
            <p className="mt-2">
              Learning content is provided to help you study effectively. Platform metrics and progress indicators
              should reflect real activity and may be updated as the service evolves.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support and service changes</h2>
            <p className="mt-2">
              Some features depend on third-party services such as email, AI, or OAuth providers. Availability may vary
              by environment or deployment configuration.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Read Privacy Policy
          </Link>
          <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
