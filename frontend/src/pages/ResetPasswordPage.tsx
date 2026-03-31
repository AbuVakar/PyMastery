import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { fixedApiService } from '../services/fixedApi';

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Contains an uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Contains a lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Contains a number', test: (pw) => /[0-9]/.test(pw) },
];

const ResetPasswordPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenMissing(true);
    }
  }, [token]);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!newPassword) {
      nextErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!passwordRules.every((r) => r.test(newPassword))) {
      nextErrors.newPassword = 'Password does not meet all requirements';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await fixedApiService.auth.confirmPasswordReset(token, newPassword);
      setIsSuccess(true);
      addToast({
        type: 'success',
        title: 'Password Reset!',
        message: 'Your password has been reset successfully. Redirecting to login...',
      });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.';
      addToast({ type: 'error', title: 'Reset Failed', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // Token missing state
  if (tokenMissing) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="space-y-6 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Invalid Link</h1>
              <p className="text-gray-600 dark:text-gray-400">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Request a new link
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="space-y-6 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Password Reset!</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your password has been successfully updated. Redirecting you to sign in...
              </p>
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
              <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Set new password</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* New Password */}
            <div className="relative">
              <Input
                id="new-password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                label="New password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                error={errors.newPassword}
                required
                autoComplete="new-password"
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                disabled={isLoading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-8 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password strength rules */}
            {newPassword.length > 0 && (
              <ul className="space-y-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                {passwordRules.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <li key={rule.label} className="flex items-center gap-2 text-sm">
                      {passed ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                      )}
                      <span className={passed ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                label="Confirm new password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                icon={<Lock className="h-5 w-5 text-gray-400" />}
                disabled={isLoading}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-8 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full">
              {isLoading ? 'Resetting...' : 'Reset password'}
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

export default ResetPasswordPage;
