import axios from 'axios';
import { User, ApiResponse } from '../types';


interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

class AuthService {
  private api = axios.create({
    baseURL: '/api',
    timeout: 10000, // 10초 타임아웃
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // OAuth는 세션 기반이므로 credentials를 포함하여 요청
    this.api.defaults.withCredentials = true;

    // Add token to requests if available (JWT 하위 호환성)
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 개발 모드에서 인증 우회 헤더 추가 (명시적으로 활성화된 경우에만)
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
        config.headers['x-dev-auth'] = 'bypass';
      }
      
      return config;
    });

    // Handle authentication errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          // OAuth 로그인 페이지로 리다이렉트하지 않고 현재 페이지에서 처리
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        password,
      });

      if (!response.data.success || !response.data.data) {
        const err = response.data.error;
        const errorMessage = (typeof err === 'object' ? err?.message : err) || 'Login failed';
        throw new Error(errorMessage);
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error.message || error.response.data.error;
        throw new Error(errorMessage);
      }
      throw new Error('Network error. Please try again.');
    }
  }

  async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    try {
      const response = await this.api.post<ApiResponse<RegisterResponse>>('/auth/register', {
        email,
        password,
        name,
      });

      if (!response.data.success || !response.data.data) {
        const err = response.data.error;
        throw new Error(typeof err === 'object' ? err.message : (err || 'Registration failed'));
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        // Handle validation errors with details
        if (error.response.data.error.details) {
          const validationErrors = error.response.data.error.details
            .map((detail: any) => detail.message)
            .join(', ');
          throw new Error(validationErrors);
        }
        
        // Handle other error types
        if (typeof error.response.data.error === 'string') {
          throw new Error(error.response.data.error);
        }
        
        if (error.response.data.error.message) {
          throw new Error(error.response.data.error.message);
        }
      }
      
      throw new Error('Network error. Please try again.');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/auth/me');

      // OAuth 응답 형식 처리
      if (response.data.user) {
        return response.data.user;
      }

      // 기존 API 응답 형식 처리 (하위 호환성)
      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to get user data');
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Network error. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, just clear local storage
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  }
}

export const authService = new AuthService();