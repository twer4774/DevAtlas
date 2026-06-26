import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: string[];
  permission?: string;
  resource?: any;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles/permissions
}

/**
 * Component that conditionally renders children based on user roles or permissions
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  permission,
  resource,
  fallback = null,
  requireAll = false,
}) => {
  const { hasRole, hasPermission } = usePermissions();

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

  return <>{children}</>;
};

/**
 * Component that renders content only for admin users
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  return (
    <RoleGuard roles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Component that renders content only for regular users
 */
export const UserOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  return (
    <RoleGuard roles={['user']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Component that renders different content based on user role
 */
export const RoleSwitch: React.FC<{
  admin?: React.ReactNode;
  user?: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ admin, user, fallback = null }) => {
  const { isAdmin, isUser } = usePermissions();

  if (isAdmin() && admin) {
    return <>{admin}</>;
  }

  if (isUser() && user) {
    return <>{user}</>;
  }

  return <>{fallback}</>;
};

/**
 * Component that shows user role badge
 */
export const RoleBadge: React.FC<{
  user?: { role: string };
  className?: string;
}> = ({ user, className = '' }) => {
  const { user: currentUser } = usePermissions();
  const targetUser = user || currentUser;

  if (!targetUser) return null;

  const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    user: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const roleLabels = {
    admin: 'Admin',
    user: 'User',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        roleColors[targetUser.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      } ${className}`}
    >
      {roleLabels[targetUser.role as keyof typeof roleLabels] || targetUser.role}
    </span>
  );
};