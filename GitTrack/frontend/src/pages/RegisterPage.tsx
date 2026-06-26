import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bug, UserPlus, CheckCircle, Zap } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegisterSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="flex min-h-screen">
        {/* Left side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 text-white">
          <div className="flex flex-col justify-center max-w-md mx-auto">
            <div className="flex items-center mb-8">
              <Bug className="h-10 w-10 mr-3" />
              <h1 className="text-3xl font-bold">IssueTracker</h1>
            </div>
            
            <h2 className="text-2xl font-semibold mb-6">
              Join Thousands of Teams
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Free to Start</h3>
                  <p className="text-green-100">Get started with our free plan and upgrade as you grow</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-green-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Quick Setup</h3>
                  <p className="text-green-100">Get up and running in minutes, not hours</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <UserPlus className="h-6 w-6 text-green-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Team Ready</h3>
                  <p className="text-green-100">Invite your team members and start collaborating</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Bug className="h-6 w-6 text-green-200" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Powerful Features</h3>
                  <p className="text-green-100">Everything you need to manage issues effectively</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6 lg:hidden">
                <Bug className="h-8 w-8 text-green-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">IssueTracker</h1>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h2>
              <p className="text-gray-600 mb-8">
                Join us and start managing your issues today
              </p>
            </div>

            <RegisterForm onSuccess={handleRegisterSuccess} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
            
            {/* Terms */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-green-600 hover:text-green-500">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:text-green-500">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};