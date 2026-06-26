import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Issue } from '../../types';
import { issueService } from '../../services/issueService';
import { projectService } from '../../services/projectService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useLoading } from '../../hooks/useLoading';
import { useAuth } from '../../contexts/AuthContext';
import { IssueListSkeleton } from '../common/SkeletonLoader';
import { ErrorState } from '../common/ErrorState';
import { StatusDropdown } from './StatusDropdown';


interface IssueFilters {
  status?: string;
  type?: string;
  priority?: string;
  projectId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const IssueList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IssueFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const { user } = useAuth();
  const { handleApiCallError } = useErrorHandler();
  const { isLoading, setLoading } = useLoading({
    issues: true,
    projects: false
  });

  // Get project ID from URL parameters
  const urlProjectId = searchParams.get('projectId');

  // Load issues with current filters and pagination
  const requestSeqRef = React.useRef(0);

  const loadIssues = useCallback(async () => {
    const seq = ++requestSeqRef.current; // 이 호출을 최신 호출로 표시
    try {
      setLoading('issues', true);
      setError(null);
      
      const requestParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      console.log('🔍 Loading issues with params:', requestParams);
      console.log('🔍 Current filters:', filters);
      console.log('🔍 URL project ID:', urlProjectId);
      console.log('🔍 Request URL will be:', `/issues?${new URLSearchParams(requestParams as any).toString()}`);
      
      const response = await issueService.getIssues(requestParams);
      
      // 최신 요청이 아니면 무시 (레이스 컨디션 방지)
      if (seq !== requestSeqRef.current) {
        console.log('⏭️ Stale response ignored');
        return;
      }
      
      console.log('✅ Issues response:', response);
      console.log('✅ Number of issues returned:', response.data?.length || 0);
      console.log('✅ Response data:', response.data);
      console.log('✅ Response success:', response.success);
      
      if (response.success) {
        setIssues(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      } else {
        setError('Failed to load issues');
      }
    } catch (error: any) {
      // 최신 요청이 아니면 에러도 무시
      if (seq !== requestSeqRef.current) return;
      console.error('❌ Error loading issues:', error);
      handleApiCallError(error, 'loading issues');
      setError('Failed to load issues');
    } finally {
      // 최신 요청이 아니면 로딩 상태 변경하지 않음
      if (seq === requestSeqRef.current) {
        setLoading('issues', false);
      }
    }
  }, [filters, pagination.page, pagination.limit, setLoading, handleApiCallError, urlProjectId]);

  // Load projects for filter dropdown
  const loadProjects = useCallback(async () => {
    try {
      const response = await projectService.getProjects();
      if (response.success) {
        setProjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Set project filter from URL parameter and reload issues
  useEffect(() => {
    if (urlProjectId) {
      console.log('🔍 Setting project filter from URL:', urlProjectId);
      // 이슈 상태 초기화
      setIssues([]);
      setFilters(prev => ({
        ...prev,
        projectId: urlProjectId
      }));
      // URL project ID가 변경되면 즉시 이슈를 다시 로드
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      // URL에 projectId가 없으면 필터에서 제거
      setIssues([]);
      setFilters(prev => ({
        ...prev,
        projectId: undefined
      }));
    }
  }, [urlProjectId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Handle filter changes
  const handleFilterChange = (key: keyof IssueFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sorting
  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle issue status change
  const handleIssueStatusChange = (updatedIssue: Issue) => {
    setIssues(prevIssues => 
      prevIssues.map(issue => 
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    );
  };

  // Check if user can edit issue
  const canEditIssue = (issue: Issue) => {
    return user ? (user.id === issue.creatorId || user.role === 'admin') : false;
  };

  const getTypeColor = (type: Issue['type']) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'improvement': return 'bg-yellow-100 text-yellow-800';
      case 'feature': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return filters.sortOrder === 'asc' ? 
      <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" /> : 
      <ArrowUpDown className="w-4 h-4 text-blue-600" />;
  };

  // Show error state
  if (error && issues.length === 0) {
    return (
      <ErrorState
        title="Failed to load issues"
        message={error}
        action={{
          label: 'Try Again',
          onClick: loadIssues
        }}
      />
    );
  }

  // Show loading skeleton
  if (isLoading('issues') && issues.length === 0) {
    return <IssueListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
        <Link
          to="/issues/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Issue
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
              showFilters 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">All Types</option>
                  <option value="bug">Bug</option>
                  <option value="task">Task</option>
                  <option value="improvement">Improvement</option>
                  <option value="feature">Feature</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={filters.projectId || ''}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-600">
                {pagination.total} issue{pagination.total !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Issues Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No issues found.</p>
            <Link
              to="/issues/create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first issue
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-5">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Title
                    {getSortIcon('title')}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Type
                    {getSortIcon('type')}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Priority
                    {getSortIcon('priority')}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    Created
                    {getSortIcon('createdAt')}
                  </button>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <div key={issue.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Title */}
                    <div className="col-span-5">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                      >
                        {issue.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        Created by {issue.creator.name}
                        {issue.assignee && ` • Assigned to ${issue.assignee.name}`}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(issue.type)}`}>
                        {issue.type}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <StatusDropdown
                        issue={issue}
                        onStatusChange={handleIssueStatusChange}
                        canEdit={canEditIssue(issue)}
                      />
                    </div>

                    {/* Created Date */}
                    <div className="col-span-1">
                      <span className="text-xs text-gray-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              pagination.page === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading('issues') && issues.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
    </div>
  );
};