import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/Toast';
import { AuthRuntimeStatus, fixedApiService } from '../services/fixedApi';
import { buildApiUrl } from '../utils/apiBase';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [runtimeStatus, setRuntimeStatus] = useState<AuthRuntimeStatus | null>(null);
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/dashboard';
  const googleError = new URLSearchParams(location.search).get('error');
  const googleErrorMessage =
    googleError === 'google_not_configured'
      ? 'Google sign-up is unavailable in demo mode for this environment.'
      : googleError === 'google_failed'
        ? 'Google sign-up could not be completed. Please try again or create an account with email and password.'
        : googleError === 'google_cancelled'
          ? 'Google sign-up was cancelled before completion.'
          : googleError === 'no_code'
            ? 'Google sign-up did not return an authorization code.'
            : null;
  const isGoogleSignupAvailable = runtimeStatus?.google_oauth?.configured !== false;
  const emailDemoMessage = runtimeStatus?.email_service?.configured === false
    ? 'Email verification is running in demo mode in this environment. You can create an account, but verification emails are unavailable.'
    : null;

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

  const handleGoogleSignup = () => {
    if (!isGoogleSignupAvailable) {
      return;
    }

    window.location.assign(buildApiUrl('/api/v1/auth/google/login?source=signup'));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((previousValue) => ({
      ...previousValue,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((previousValue) => ({ ...previousValue, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password)) {
      nextErrors.password = 'Use uppercase, lowercase, a number, and a special character';
    }
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) nextErrors.agreeTerms = 'You must accept the terms to continue';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please review the highlighted fields.'
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const registerResult = await register(formData.name, formData.email, formData.password);

      addToast({
        type: 'success',
        title: 'Account Created',
        message: 'Your account is ready. Redirecting you now...'
      });

      if (registerResult.warning) {
        addToast({
          type: 'warning',
          title: 'Email Verification Unavailable',
          message: registerResult.warning
        });
      }

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setErrors({ general: errorMessage });
      addToast({
        type: 'error',
        title: 'Network Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClassName =
    'w-full rounded-xl border bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        <Card className="space-y-5 p-6 md:p-8 ml-auto mr-auto w-full max-w-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Start learning with a clean, fully connected account flow.</p>
          </div>

          {googleErrorMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
              {googleErrorMessage}
            </div>
          )}

          {emailDemoMessage && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
              {emailDemoMessage}
            </div>
          )}

          {errors.general && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${inputBaseClassName} pl-11 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputBaseClassName} pl-11 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputBaseClassName} pl-11 pr-11 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previousValue) => !previousValue)}
                  className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`${inputBaseClassName} pl-11 pr-11 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previousValue) => !previousValue)}
                  className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
            </div>

            <label className="flex items-start text-sm text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.agreeTerms && <p className="text-sm text-red-600 dark:text-red-400">{errors.agreeTerms}</p>}

            <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-slate-700" />
              <span className="mx-3 flex-shrink text-sm text-gray-500 dark:text-slate-400">or sign up with</span>
              <div className="flex-grow border-t border-gray-200 dark:border-slate-700" />
            </div>

            <button
              id="google-signup-btn"
              type="button"
              onClick={handleGoogleSignup}
              disabled={!isGoogleSignupAvailable}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {!isGoogleSignupAvailable && (
              <p className="text-center text-xs text-gray-500 dark:text-slate-400">
                Google sign-up unavailable in demo.
              </p>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
