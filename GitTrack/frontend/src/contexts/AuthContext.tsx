import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

function parsePortalJwt(token: string): { id: string; username: string; name: string; avatar_url?: string; org_id?: string; org_name?: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.sub || '',
      username: payload.username || '',
      name: payload.username || '',
      avatar_url: payload.avatar_url,
      org_id: payload.org_id,
      org_name: payload.org_name,
      role: payload.org_role === 'owner' ? 'admin' : 'member',
    }
  } catch {
    return null
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(!initialUser);

  // 디버깅: 로딩 상태 변화 추적
  useEffect(() => {
    console.log('🔄 Loading state changed:', isLoading);
  }, [isLoading]);

  // 임시: 개발 중 무한 로딩 방지 - 더 빠르게 설정
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Auth initialization timeout - forcing completion');
        setIsLoading(false);
      }
    }, 5000); // 5초 후 강제 완료

    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    // Skip initialization if initialUser is provided (for testing)
    if (initialUser !== undefined) {
      return;
    }

    const initializeAuth = async () => {
      // Check for Portal token first
      const portalToken = localStorage.getItem('devatlas-org-token')
      if (portalToken) {
        const portalUser = parsePortalJwt(portalToken)
        if (portalUser) {
          setUser(portalUser as any)
          setToken(portalToken)
          setIsLoading(false)
          return
        }
      }

      try {
        // OAuth 인증 확인 (세션 기반)
        console.log('🔄 Checking OAuth authentication...');
        console.log('🔧 Current environment variables:', {
          DEV: import.meta.env.DEV,
          VITE_DEV_AUTH_BYPASS: import.meta.env.VITE_DEV_AUTH_BYPASS,
          NODE_ENV: import.meta.env.NODE_ENV
        });
        
        const userData = await authService.getCurrentUser();
        console.log('✅ OAuth auth initialized successfully:', userData);
        setUser(userData);
        // OAuth는 세션 기반이므로 토큰을 localStorage에서 제거
        localStorage.removeItem('token');
        setToken(null);
      } catch (error) {
        console.error('❌ Failed to initialize OAuth auth:', error);
        
        // JWT 토큰 확인 (하위 호환성) - 개발용 인증 우회가 비활성화된 경우에만
        const token = localStorage.getItem('token');
        const isDevBypassEnabled = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
        
        if (token && !isDevBypassEnabled) {
          try {
            console.log('🔄 Falling back to JWT token...');
            const userData = await authService.getCurrentUser();
            console.log('✅ JWT auth initialized successfully:', userData);
            setUser(userData);
            setToken(token);
          } catch (jwtError) {
            console.error('❌ JWT auth also failed:', jwtError);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } else {
          if (isDevBypassEnabled) {
            console.log('⚠️ Dev auth bypass is enabled - skipping JWT fallback');
          } else {
            console.log('ℹ️ No JWT token found');
          }
          localStorage.removeItem('token'); // 기존 토큰 정리
          setUser(null);
          setToken(null);
        }
      } finally {
        console.log('🏁 Auth initialization completed');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [initialUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register(email, password, name);
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // OAuth 로그아웃 API 호출
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // 로컬 상태 정리
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { useAuth };