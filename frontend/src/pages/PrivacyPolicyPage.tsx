import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 px-4 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-800 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Privacy Policy
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">How PyMastery handles your data</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-gray-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Information we collect</h2>
            <p className="mt-2">
              We collect the account details you provide, the learning progress you create on the platform, and
              essential technical data needed to keep the service secure and reliable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How we use it</h2>
            <p className="mt-2">
              Your information is used to authenticate your account, personalize learning experiences, respond to
              support requests, and improve platform reliability and safety.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email and support communications</h2>
            <p className="mt-2">
              We may send service emails for account access, password recovery, and support follow-ups. Marketing
              messages should only be sent when you have explicitly opted in.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your choices</h2>
            <p className="mt-2">
              You can contact support to request account help, correct personal information, or ask questions about how
              your data is used.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Read Terms of Use
          </Link>
          <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
