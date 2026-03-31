import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, MailCheck, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import { fixedApiService } from '../services/fixedApi';

type VerificationState = 'verifying' | 'success' | 'error' | 'missing-token';

const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<VerificationState>(() => (token ? 'verifying' : 'missing-token'));
  const [message, setMessage] = useState(() =>
    token
      ? 'Verifying your email address...'
      : 'This verification link is missing a token. Please request a new verification email.'
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyEmail = async () => {
      try {
        const response = await fixedApiService.auth.confirmEmailVerification(token);

        if (!isMounted) {
          return;
        }

        setStatus('success');
        setMessage(response.message || 'Your email address has been verified successfully.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Email verification could not be completed. Please request a new verification email.'
        );
      }
    };

    void verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const icon =
    status === 'success' ? (
      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
    ) : status === 'verifying' ? (
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
    ) : (
      <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
    );

  const iconWrapperClassName =
    status === 'success'
      ? 'bg-green-100 dark:bg-green-900/30'
      : status === 'verifying'
        ? 'bg-blue-100 dark:bg-blue-900/30'
        : 'bg-red-100 dark:bg-red-900/30';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="space-y-6 p-8 text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconWrapperClassName}`}>
            {icon}
          </div>

          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {status === 'success' ? 'Email Verified' : status === 'verifying' ? 'Verifying Email' : 'Verification Unavailable'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Continue to Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400"
            >
              <MailCheck className="h-4 w-4" />
              Create or review another account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
