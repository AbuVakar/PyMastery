import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AuthRuntimeStatus, fixedApiService } from '../services/fixedApi';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<AuthRuntimeStatus | null>(null);
  const emailServiceUnavailable = runtimeStatus?.email_service?.configured === false;

  useEffect(() => {
    let mounted = true;

    const loadRuntimeStatus = async () => {
      try {
        const status = await fixedApiService.auth.getRuntimeStatus();
        if (mounted) {
          setRuntimeStatus(status);
        }
      } catch {
        if (mounted) {
          setRuntimeStatus(null);
        }
      }
    };

    void loadRuntimeStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (emailServiceUnavailable) {
      setSubmitError('Email service not configured (demo mode). Password reset links are unavailable in this environment.');
      return;
    }

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);
    setEmailError('');
    setSubmitError('');

    try {
      await fixedApiService.auth.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Password reset email is unavailable right now. Please try again later.';
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="space-y-6 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Check your email</h1>
              <p className="text-gray-600 dark:text-gray-400">
                If an account exists for <span className="font-semibold text-blue-600 dark:text-blue-400">{email}</span>,
                we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Try a different email
              </Button>
              <Link
                to="/login"
                className="block text-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Back to sign in
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
            <p className="text-gray-600 dark:text-gray-400">
              No worries! Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {emailServiceUnavailable && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
              Email service not configured (demo mode). Password reset links are unavailable in this environment.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {submitError}
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="Enter your registered email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(validateEmail(event.target.value));
                if (submitError) setSubmitError('');
              }}
              error={emailError}
              required
              autoComplete="email"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              disabled={isLoading || emailServiceUnavailable}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || emailServiceUnavailable}
              className="w-full"
            >
              {isLoading ? 'Sending...' : emailServiceUnavailable ? 'Unavailable in Demo' : 'Send reset link'}
            </Button>
          </form>

          <div className="border-t border-gray-200 pt-6 text-center dark:border-gray-700">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
