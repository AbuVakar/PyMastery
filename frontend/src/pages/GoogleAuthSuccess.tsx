import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

/**
 * Google OAuth success handler.
 * The backend redirects here with JWT tokens in query params.
 */
const GoogleAuthSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshFromStorage } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const userId = params.get('user_id') || '';
    const name = params.get('user_name') || '';
    const email = params.get('user_email') || '';
    const avatar = params.get('user_avatar') || '';
    const expiresInSeconds = Number(params.get('expires_in') || '3600');

    if (!accessToken) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    localStorage.setItem('access_token', accessToken);

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }

    if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      localStorage.setItem('token_expires_at', expiresAt.toString());
    } else {
      localStorage.removeItem('token_expires_at');
    }

    localStorage.setItem(
      'user',
      JSON.stringify({
        id: userId,
        name,
        email,
        avatar,
        role: 'user',
        role_track: 'general',
        subscription: 'free',
        auth_provider: 'google',
        is_verified: true,
      })
    );

    refreshFromStorage();
    navigate('/dashboard', { replace: true });
  }, [navigate, params, refreshFromStorage]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-300">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
