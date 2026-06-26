import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import { RoleGuard, AdminOnly, UserOnly, RoleSwitch, RoleBadge } from '../RoleGuard';

// Mock the auth context
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the permissions hook
const mockPermissions = {
  user: null,
  hasPermission: jest.fn(),
  hasRole: jest.fn(),
  isAdmin: jest.fn(),
  isUser: jest.fn(),
  ownsResource: jest.fn(),
  canAccessResource: jest.fn(),
};

jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => mockPermissions,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('RoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role-based rendering', () => {
    it('should render children when user has required role', () => {
      mockPermissions.hasRole.mockReturnValue(true);

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']}>
            <div>Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPermissions.hasRole).toHaveBeenCalledWith(['admin']);
    });

    it('should not render children when user lacks required role', () => {
      mockPermissions.hasRole.mockReturnValue(false);

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']}>
            <div>Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks required role', () => {
      mockPermissions.hasRole.mockReturnValue(false);

      render(
        <TestWrapper>
          <RoleGuard roles={['admin']} fallback={<div>Access Denied</div>}>
            <div>Admin Content</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      mockPermissions.hasPermission.mockReturnValue(true);

      render(
        <TestWrapper>
          <RoleGuard permission="manage_users">
            <div>User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith('manage_users', undefined);
    });

    it('should not render children when user lacks required permission', () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      render(
        <TestWrapper>
          <RoleGuard permission="manage_users">
            <div>User Management</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('should pass resource to permission check', () => {
      mockPermissions.hasPermission.mockReturnValue(true);
      const resource = { id: '1', creatorId: 'user1' };

      render(
        <TestWrapper>
          <RoleGuard permission="edit_issue" resource={resource}>
            <div>Edit Issue</div>
          </RoleGuard>
        </TestWrapper>
      );

      expect(mockPermissions.hasPermission).toHaveBeenCalledWith('edit_issue', resource);
    });
  });
});

describe('AdminOnly', () => {
  it('should render children for admin users', () => {
    mockPermissions.hasRole.mockReturnValue(true);

    render(
      <TestWrapper>
        <AdminOnly>
          <div>Admin Only Content</div>
        </AdminOnly>
      </TestWrapper>
    );

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
    expect(mockPermissions.hasRole).toHaveBeenCalledWith(['admin']);
  });

  it('should not render children for non-admin users', () => {
    mockPermissions.hasRole.mockReturnValue(false);

    render(
      <TestWrapper>
        <AdminOnly>
          <div>Admin Only Content</div>
        </AdminOnly>
      </TestWrapper>
    );

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
  });
});

describe('UserOnly', () => {
  it('should render children for regular users', () => {
    mockPermissions.hasRole.mockReturnValue(true);

    render(
      <TestWrapper>
        <UserOnly>
          <div>User Only Content</div>
        </UserOnly>
      </TestWrapper>
    );

    expect(screen.getByText('User Only Content')).toBeInTheDocument();
    expect(mockPermissions.hasRole).toHaveBeenCalledWith(['user']);
  });
});

describe('RoleSwitch', () => {
  it('should render admin content for admin users', () => {
    mockPermissions.isAdmin.mockReturnValue(true);
    mockPermissions.isUser.mockReturnValue(false);

    render(
      <TestWrapper>
        <RoleSwitch
          admin={<div>Admin View</div>}
          user={<div>User View</div>}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Admin View')).toBeInTheDocument();
    expect(screen.queryByText('User View')).not.toBeInTheDocument();
  });

  it('should render user content for regular users', () => {
    mockPermissions.isAdmin.mockReturnValue(false);
    mockPermissions.isUser.mockReturnValue(true);

    render(
      <TestWrapper>
        <RoleSwitch
          admin={<div>Admin View</div>}
          user={<div>User View</div>}
        />
      </TestWrapper>
    );

    expect(screen.getByText('User View')).toBeInTheDocument();
    expect(screen.queryByText('Admin View')).not.toBeInTheDocument();
  });

  it('should render fallback when no role matches', () => {
    mockPermissions.isAdmin.mockReturnValue(false);
    mockPermissions.isUser.mockReturnValue(false);

    render(
      <TestWrapper>
        <RoleSwitch
          admin={<div>Admin View</div>}
          user={<div>User View</div>}
          fallback={<div>No Access</div>}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No Access')).toBeInTheDocument();
    expect(screen.queryByText('Admin View')).not.toBeInTheDocument();
    expect(screen.queryByText('User View')).not.toBeInTheDocument();
  });
});

describe('RoleBadge', () => {
  it('should render admin badge for admin users', () => {
    const adminUser = { role: 'admin' };

    render(
      <TestWrapper>
        <RoleBadge user={adminUser} />
      </TestWrapper>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toHaveClass('text-red-800');
  });

  it('should render user badge for regular users', () => {
    const regularUser = { role: 'user' };

    render(
      <TestWrapper>
        <RoleBadge user={regularUser} />
      </TestWrapper>
    );

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('User')).toHaveClass('text-blue-800');
  });

  it('should use current user when no user prop provided', () => {
    mockPermissions.user = { role: 'admin' };

    render(
      <TestWrapper>
        <RoleBadge />
      </TestWrapper>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should not render when no user available', () => {
    mockPermissions.user = null;

    const { container } = render(
      <TestWrapper>
        <RoleBadge />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});