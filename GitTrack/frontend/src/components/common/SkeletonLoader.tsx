import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
    />
  );
};

// Text skeleton
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="1rem"
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton height="1.5rem" width="60%" />
        <TextSkeleton lines={3} />
        <div className="flex space-x-2">
          <Skeleton height="2rem" width="5rem" />
          <Skeleton height="2rem" width="5rem" />
        </div>
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height="1rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Issue list skeleton
export const IssueListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton height="1.25rem" width="70%" />
              <TextSkeleton lines={2} />
              <div className="flex space-x-2">
                <Skeleton height="1.5rem" width="4rem" />
                <Skeleton height="1.5rem" width="4rem" />
                <Skeleton height="1.5rem" width="4rem" />
              </div>
            </div>
            <div className="ml-4 space-y-2">
              <Skeleton height="2rem" width="6rem" />
              <Skeleton height="1rem" width="8rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Issue detail skeleton
export const IssueDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height="1rem" width="8rem" />
        <div className="flex space-x-2">
          <Skeleton height="2.5rem" width="5rem" />
          <Skeleton height="2.5rem" width="5rem" />
        </div>
      </div>

      {/* Issue content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Issue header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <Skeleton height="2rem" width="60%" />
            <div className="flex space-x-2">
              <Skeleton height="1.5rem" width="4rem" />
              <Skeleton height="1.5rem" width="4rem" />
              <Skeleton height="1.5rem" width="4rem" />
            </div>
          </div>
          <div className="flex space-x-6">
            <Skeleton height="1rem" width="10rem" />
            <Skeleton height="1rem" width="10rem" />
            <Skeleton height="1rem" width="8rem" />
          </div>
        </div>

        {/* Issue description */}
        <div className="px-6 py-6">
          <Skeleton height="1.5rem" width="8rem" className="mb-4" />
          <TextSkeleton lines={6} />
        </div>

        {/* Comments section */}
        <div className="px-6 py-6 border-t border-gray-200">
          <Skeleton height="1.5rem" width="6rem" className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton height="2rem" width="2rem" rounded />
                  <Skeleton height="1rem" width="8rem" />
                  <Skeleton height="1rem" width="6rem" />
                </div>
                <TextSkeleton lines={2} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton height="1rem" width="6rem" />
                <Skeleton height="2rem" width="3rem" />
              </div>
              <Skeleton height="3rem" width="3rem" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton height="1.5rem" width="8rem" className="mb-4" />
          <Skeleton height="20rem" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton height="1.5rem" width="8rem" className="mb-4" />
          <Skeleton height="20rem" />
        </div>
      </div>
    </div>
  );
};