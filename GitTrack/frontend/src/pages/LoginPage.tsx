import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bug, Shield, Users, BarChart3 } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';
  
  // URL에서 OAuth 에러 파라미터 확인
  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error');
  
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'oauth_cancelled':
        return 'GitHub 로그인이 취소되었습니다. 다시 시도해주세요.';
      case 'no_user':
        return '사용자 정보를 가져올 수 없습니다. 다시 시도해주세요.';
      case 'session':
        return '세션 저장에 실패했습니다. 다시 시도해주세요.';
      default:
        return null;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
          <div className="flex flex-col justify-center max-w-md mx-auto">
            <div className="flex items-center mb-8">
              <Bug className="h-10 w-10 mr-3" />
              <h1 className="text-3xl font-bold">IssueTracker</h1>
            </div>
            
            <h2 className="text-2xl font-semibold mb-6">
              Streamline Your Project Management
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Bug className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Issue Tracking</h3>
                  <p className="text-blue-100">Track bugs, tasks, and feature requests with ease</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Team Collaboration</h3>
                  <p className="text-blue-100">Work together with your team members efficiently</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analytics & Reports</h3>
                  <p className="text-blue-100">Get insights into your project progress</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                  <p className="text-blue-100">Your data is protected with enterprise-grade security</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6 lg:hidden">
                <Bug className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">IssueTracker</h1>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in to your account to continue
              </p>
            </div>

            {/* OAuth 에러 메시지 표시 */}
            {oauthError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      {getErrorMessage(oauthError)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <LoginForm onSuccess={handleLoginSuccess} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
            
            {/* Demo credentials */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@example.com / admin123!</p>
                <p><strong>User:</strong> user@example.com / user123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};