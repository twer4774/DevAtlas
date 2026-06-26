import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Wifi, 
  Server, 
  Shield,
  FileX,
  Search
} from 'lucide-react';

interface ErrorStateProps {
  type?: 'generic' | 'network' | 'notFound' | 'unauthorized' | 'server' | 'empty';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const errorConfig = {
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    iconColor: 'text-red-500'
  },
  network: {
    icon: Wifi,
    title: 'Connection problem',
    message: 'Please check your internet connection and try again.',
    iconColor: 'text-orange-500'
  },
  notFound: {
    icon: Search,
    title: 'Not found',
    message: 'The page or resource you are looking for could not be found.',
    iconColor: 'text-gray-500'
  },
  unauthorized: {
    icon: Shield,
    title: 'Access denied',
    message: 'You do not have permission to access this resource.',
    iconColor: 'text-red-500'
  },
  server: {
    icon: Server,
    title: 'Server error',
    message: 'Our servers are experiencing issues. Please try again later.',
    iconColor: 'text-red-500'
  },
  empty: {
    icon: FileX,
    title: 'No data found',
    message: 'There is no data to display at the moment.',
    iconColor: 'text-gray-400'
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  action,
  secondaryAction,
  className = ''
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <Icon className={`w-16 h-16 mb-4 ${config.iconColor}`} />
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {title || config.title}
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message || config.message}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {action.label}
          </button>
        )}

        {!action && type !== 'empty' && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {secondaryAction.label}
          </button>
        )}

        {!secondaryAction && type !== 'empty' && (
          <button
            onClick={handleGoHome}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
};

// Specific error components
export const NetworkError: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState type="network" {...props} />
);

export const NotFoundError: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState type="notFound" {...props} />
);

export const UnauthorizedError: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState type="unauthorized" {...props} />
);

export const ServerError: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState type="server" {...props} />
);

export const EmptyState: React.FC<Omit<ErrorStateProps, 'type'>> = (props) => (
  <ErrorState type="empty" {...props} />
);