import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRoles?: string[];
  requiredPermission?: string;
  resource?: any;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requiredRoles,
  requiredPermission,
  resource,
  fallbackPath = '/dashboard'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { hasRole, hasPermission } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement (legacy support)
  if (requireAdmin && user?.role !== 'admin') {
    return <AccessDenied />;
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) {
      return <AccessDenied fallbackPath={fallbackPath} />;
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    if (!hasPermission(requiredPermission, resource)) {
      return <AccessDenied fallbackPath={fallbackPath} />;
    }
  }

  return <>{children}</>;
};

// Access denied component
const AccessDenied: React.FC<{ fallbackPath?: string }> = ({ fallbackPath = '/dashboard' }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have the required permissions to access this page.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Current role: <span className="font-medium">{user?.role || 'Unknown'}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <Navigate to={fallbackPath} replace />
          </div>
        </div>
      </div>
    </div>
  );
};