import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  PlayCircle, 
  XCircle,
  Bug,
  ListTodo,
  Lightbulb,
  Star,
  Plus,
  Activity,
  Calendar,
  Filter,
  GitBranch,
  Grid3X3
} from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { 
  IssuesByTypeChart, 
  IssuesByPriorityChart, 
  IssueTrendsChart, 
  AssignmentChart 
} from '../components/dashboard/Charts';
import { BannerAd, SidebarAd } from '../components/AdSense';
import ProjectTreeView from '../components/TreeView/ProjectTreeView';
import { dashboardService } from '../services/dashboardService';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';

interface DashboardStats {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byType: {
    bug: number;
    task: number;
    improvement: number;
    feature: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: {
    newIssues: number;
    newComments: number;
  };
  topContributors: Array<{
    id: string;
    name: string;
    email: string;
    issuesCreated: number;
    commentsPosted: number;
    totalActivity: number;
  }>;
  projectStats?: Array<{
    id: string;
    name: string;
    _count: {
      issues: number;
    };
  }>;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tree'>('overview');

  useEffect(() => {
    loadDashboardData();
    loadProjects();
  }, [selectedProject]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, trendsResponse, assignmentsResponse] = await Promise.all([
        dashboardService.getDashboardStats(selectedProject || undefined),
        dashboardService.getIssueTrends(selectedProject || undefined),
        dashboardService.getAssignmentStats(selectedProject || undefined)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
      if (trendsResponse.success) {
        setTrends(trendsResponse.data);
      }
      
      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getProjects();
      if (response.success) {
        setProjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleFilterClick = (filterType: string, filterValue: string) => {
    const params = new URLSearchParams();
    params.set(filterType, filterValue);
    if (selectedProject) {
      params.set('projectId', selectedProject);
    }
    navigate(`/issues?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Top Banner Ad */}
        <BannerAd 
          adSlot="1234567890" 
          className="mb-6"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your issues.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <button
              onClick={() => navigate('/issues/create')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Issue
            </button>
            
            {/* Project Filter */}
            {projects.length > 0 && activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
                  Project:
                </label>
                <select
                  id="project-filter"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tree')}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${activeTab === 'tree'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4" />
                  <span>Project Tree</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatsCard
                title="Total Issues"
                value={stats.overview.total}
                icon={BarChart3}
                color="blue"
                onClick={() => navigate('/issues')}
              />
              <StatsCard
                title="Open Issues"
                value={stats.overview.open}
                icon={AlertCircle}
                color="red"
                onClick={() => handleFilterClick('status', 'open')}
              />
              <StatsCard
                title="In Progress"
                value={stats.overview.inProgress}
                icon={PlayCircle}
                color="yellow"
                onClick={() => handleFilterClick('status', 'in_progress')}
              />
              <StatsCard
                title="Resolved"
                value={stats.overview.resolved}
                icon={CheckCircle}
                color="green"
                onClick={() => handleFilterClick('status', 'resolved')}
              />
              <StatsCard
                title="Closed"
                value={stats.overview.closed}
                icon={XCircle}
                color="gray"
                onClick={() => handleFilterClick('status', 'closed')}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Issues by Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Type</h3>
                <div className="h-64">
                  <IssuesByTypeChart 
                    data={stats.byType}
                    onSegmentClick={(type) => handleFilterClick('type', type)}
                  />
                </div>
              </div>

              {/* Issues by Priority */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Priority</h3>
                <div className="h-64">
                  <IssuesByPriorityChart 
                    data={stats.byPriority}
                    onBarClick={(priority) => handleFilterClick('priority', priority)}
                  />
                </div>
              </div>
            </div>

            {/* Trends and Assignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Issue Trends */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Trends (Last 30 Days)</h3>
                <div className="h-64">
                  <IssueTrendsChart data={trends} />
                </div>
              </div>

              {/* Assignment Distribution */}
              {assignments && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Distribution</h3>
                  <div className="h-64">
                    <AssignmentChart data={assignments} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Create Issue</h3>
                    <p className="text-blue-100 text-sm">Report a new bug or task</p>
                  </div>
                  <Bug className="w-8 h-8 text-blue-200" />
                </div>
                <button
                  onClick={() => navigate('/issues/create')}
                  className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                >
                  Get Started
                </button>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">View Issues</h3>
                    <p className="text-green-100 text-sm">Browse all issues</p>
                  </div>
                  <ListTodo className="w-8 h-8 text-green-200" />
                </div>
                <button
                  onClick={() => navigate('/issues')}
                  className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                >
                  View All
                </button>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">My Issues</h3>
                    <p className="text-purple-100 text-sm">Issues assigned to you</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
                <button
                  onClick={() => navigate('/issues?assigneeId=me')}
                  className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                >
                  View Mine
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Activity</h3>
                    <p className="text-orange-100 text-sm">Recent updates</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-200" />
                </div>
                <button
                  onClick={() => navigate('/issues?sort=updatedAt')}
                  className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                >
                  View Recent
                </button>
              </div>
            </div>

            {/* Bottom Row with Sidebar Ad */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Content Area */}
              <div className="xl:col-span-3 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Contributors */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Top Contributors</h3>
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="space-y-3">
                      {stats.topContributors.slice(0, 5).map((contributor, index) => (
                        <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                index === 2 ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <span className="text-sm font-medium">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{contributor.name}</p>
                              <p className="text-xs text-gray-500">{contributor.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {contributor.totalActivity} activities
                            </p>
                            <p className="text-xs text-gray-500">
                              {contributor.issuesCreated} issues, {contributor.commentsPosted} comments
                            </p>
                          </div>
                        </div>
                      ))}
                      {stats.topContributors.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No contributors yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity & Project Stats */}
                  <div className="space-y-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (30 days)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{stats.recentActivity.newIssues}</p>
                          <p className="text-sm text-gray-600">New Issues</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{stats.recentActivity.newComments}</p>
                          <p className="text-sm text-gray-600">New Comments</p>
                        </div>
                      </div>
                    </div>

                    {/* Project Stats (only show when viewing all projects) */}
                    {!selectedProject && stats.projectStats && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Overview</h3>
                        <div className="space-y-2">
                          {stats.projectStats.slice(0, 5).map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <span className="text-sm font-medium text-gray-900">{project.name}</span>
                              <span className="text-sm text-gray-500">{project._count.issues} issues</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Ad */}
              <div className="xl:col-span-1">
                <div className="sticky top-6">
                  <SidebarAd 
                    adSlot="0987654321"
                    className="mb-6"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Tree View Tab */
          <div className="space-y-6">
            <ProjectTreeView className="min-h-screen" />
          </div>
        )}
    </div>
  );
};