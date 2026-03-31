import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorStates';
import { useToast } from '../components/Toast';
import { AuthRuntimeStatus, fixedApiService } from '../services/fixedApi';
import { buildApiUrl } from '../utils/apiBase';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { login, verifyOtp } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<AuthRuntimeStatus | null>(null);
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/dashboard';
  const googleError = new URLSearchParams(location.search).get('error');
  const googleErrorMessage =
    googleError === 'google_not_configured'
      ? 'Google sign-in is unavailable in demo mode for this environment.'
      : googleError === 'google_failed'
        ? 'Google sign-in could not be completed. Please try again or use email and password.'
        : googleError === 'google_cancelled'
          ? 'Google sign-in was cancelled before completion.'
          : googleError === 'no_code'
            ? 'Google sign-in did not return an authorization code.'
            : null;
  const isGoogleLoginAvailable = runtimeStatus?.google_oauth?.configured !== false;
  const emailDemoMessage = runtimeStatus?.email_service?.configured === false
    ? 'Email-based account actions are running in demo mode in this environment. Password reset and verification emails are unavailable.'
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

  const handleGoogleLogin = () => {
    if (!isGoogleLoginAvailable) {
      return;
    }

    window.location.assign(buildApiUrl('/api/v1/auth/google/login?source=login'));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((previousValue) => ({
      ...previousValue,
      [name]: newValue
    }));

    if (errors[name]) {
      setErrors((previousValue) => ({ ...previousValue, [name]: '' }));
    }

    if (loginError) {
      setLoginError(null);
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formData.email) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix all errors before submitting.'
      });
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      if (requiresOtp) {
        await verifyOtp(formData.email, otp);
        addToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Successfully logged in. Redirecting you now...'
        });
        navigate(redirectPath, { replace: true });
      } else {
        const result = await login(formData.email, formData.password);
        if (result?.requires_otp) {
          setRequiresOtp(true);
          addToast({
            type: 'info',
            title: 'Verification Code Sent',
            message: 'Check your email for the verification code to finish signing in.'
          });
          return;
        }

        addToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Successfully logged in. Redirecting you now...'
        });
        navigate(redirectPath, { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Network error. Please check your connection and try again.';
      setLoginError(errorMessage);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loginError && !isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <ErrorState
            title="Login Failed"
            message={loginError}
            onRetry={() => {
              setLoginError(null);
              setErrors({});
            }}
            showHome
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="space-y-5 p-6 ml-auto mr-auto w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to continue your learning journey.</p>
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!requiresOtp ? (
              <>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  autoComplete="email"
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  disabled={isLoading}
                />

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    autoComplete="current-password"
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                    disabled={isLoading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previousValue) => !previousValue)}
                    className="absolute right-3 top-8 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      id="remember-me"
                      name="rememberMe"
                      type="checkbox"
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    Remember me
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Enter verification code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setRequiresOtp(false)}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Change email or password
                </button>
              </div>
            )}

            <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full">
              {isLoading ? (requiresOtp ? 'Verifying...' : 'Signing in...') : (requiresOtp ? 'Verify code' : 'Sign in')}
              {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 flex-shrink text-sm text-gray-500 dark:text-gray-400">or continue with</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>

            <button
              id="google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={!isGoogleLoginAvailable}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {!isGoogleLoginAvailable && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Google sign-in unavailable in demo.
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400">
                Create one
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
