import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input } from '../components/ui';

const WorldClassLogin: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/dashboard';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }

      navigate(redirectPath, { replace: true });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[65vh] items-center justify-center bg-gray-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-3xl font-bold text-white shadow-lg shadow-blue-500/25">
            P
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {isLogin ? 'Enter your credentials to access your dashboard' : 'Join the platform and continue your Python journey'}
          </p>
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full Name"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                icon={<User className="h-4 w-4" />}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              icon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              icon={<Lock className="h-4 w-4" />}
            />

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-lg" isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6 text-center dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin((previousValue) => !previousValue)}
                className="font-bold text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                {isLogin ? 'Create one now' : 'Sign in here'}
              </button>
            </p>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorldClassLogin;
