import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface WithRoleGuardOptions {
  roles?: string[];
  permission?: string;
  resource?: any;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Higher Order Component for role-based access control
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: WithRoleGuardOptions
) {
  const WrappedComponent = (props: P) => {
    const { hasRole, hasPermission } = usePermissions();
    const { roles, permission, resource, fallback = null, requireAll = false } = options;

    // Check role-based access
    if (roles && roles.length > 0) {
      const hasRequiredRole = requireAll 
        ? roles.every(role => hasRole([role]))
        : hasRole(roles);
      
      if (!hasRequiredRole) {
        return <>{fallback}</>;
      }
    }

    // Check permission-based access
    if (permission) {
      if (!hasPermission(permission, resource)) {
        return <>{fallback}</>;
      }
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * HOC for admin-only components
 */
export function withAdminOnly<P extends object>(Component: React.ComponentType<P>) {
  return withRoleGuard(Component, { roles: ['admin'] });
}

/**
 * HOC for user-only components
 */
export function withUserOnly<P extends object>(Component: React.ComponentType<P>) {
  return withRoleGuard(Component, { roles: ['user'] });
}