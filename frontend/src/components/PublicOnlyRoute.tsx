import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingStates';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/dashboard';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-white px-4 py-10 dark:bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
