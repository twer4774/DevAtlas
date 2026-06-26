import { useAuth } from '../contexts/AuthContext';

export interface PermissionConfig {
  action: string;
  resource?: any;
}

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (action: string, resource?: any): boolean => {
    if (!user) return false;

    const role = user.role as string;

    if (role === 'admin') return true;

    switch (action) {
      case 'create_issue':
      case 'view_issues':
      case 'comment_on_issue':
        return true;

      case 'edit_issue':
      case 'delete_issue':
        return resource && (resource.creatorId === user.id || role === 'admin');

      case 'assign_issue':
      case 'manage_templates':
      case 'manage_projects':
      case 'manage_users':
      case 'access_admin_panel':
      case 'view_user_management':
      case 'change_user_roles':
        return role === 'admin';

      case 'edit_comment':
      case 'delete_comment':
        return resource && (resource.authorId === user.id || role === 'admin');

      default:
        return false;
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return (user?.role as string) === 'admin';
  };

  const isUser = (): boolean => {
    return user?.role === 'user' || false;
  };

  const ownsResource = (resource: any, userIdField: string = 'creatorId'): boolean => {
    if (!user || !resource) return false;
    return resource[userIdField] === user.id;
  };

  const canAccessResource = (resource: any, userIdField: string = 'creatorId'): boolean => {
    if (!user) return false;
    return isAdmin() || ownsResource(resource, userIdField);
  };

  return { user, hasPermission, hasRole, isAdmin, isUser, ownsResource, canAccessResource };
};
