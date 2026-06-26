import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, GitBranch, ExternalLink, Trash2, Edit } from 'lucide-react';
import { EnhancedProject } from '../types/project-groups';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { BannerAd, InArticleAd } from '../components/AdSense';
import toast from 'react-hot-toast';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<EnhancedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      
      if (response.success) {
        setProjects(response.data || []);
      } else {
        toast.error('Failed to load projects');
      }
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load projects';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await projectService.deleteProject(projectId);
      
      if (response.success) {
        toast.success('Project deleted successfully');
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        const e = response.error;
        toast.error((typeof e === 'object' ? e?.message : e) || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete project';
      toast.error(errorMessage);
    }
  };

  const isAdmin = user?.role === 'admin';

  // Debug: 콘솔에 사용자 정보 출력
  console.log('Current user:', user);
  console.log('Is admin:', isAdmin);
  console.log('User role:', user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Ad */}
      <BannerAd 
        adSlot="5927384610" 
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and GitHub integrations</p>
        </div>
        
        {/* 임시: 항상 버튼 표시 */}
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project {isAdmin ? '(Admin)' : '(Force)'}
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <GitBranch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first project.</p>
          {isAdmin && (
            <button
              onClick={() => navigate('/projects/new')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => navigate(`/projects/${project.id}/settings`)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Project Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id, project.name)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* GitHub Integration Status */}
                  <div className="mb-4">
                    {project.githubRepos?.[0]?.url ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <GitBranch className="w-4 h-4" />
                        <span>GitHub integrated</span>
                        <a
                          href={project.githubRepos[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <GitBranch className="w-4 h-4" />
                        <span>No GitHub integration</span>
                      </div>
                    )}
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Issues:</span>
                      <span className="ml-1 font-medium">{project._count?.issues || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-1 font-medium">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/issues?projectId=${project.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Issues
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => navigate(`/projects/${project.id}/settings`)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                        Settings
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Ad - only show if there are more than 6 projects */}
          {projects.length > 6 && (
            <InArticleAd 
              adSlot="8147259630"
              className="my-8"
            />
          )}

          {/* Remaining Projects */}
          {projects.length > 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(6).map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => navigate(`/projects/${project.id}/settings`)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Project Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id, project.name)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* GitHub Integration Status */}
                    <div className="mb-4">
                      {project.githubRepos?.[0]?.url ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <GitBranch className="w-4 h-4" />
                          <span>GitHub integrated</span>
                          <a
                            href={project.githubRepos[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <GitBranch className="w-4 h-4" />
                          <span>No GitHub integration</span>
                        </div>
                      )}
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Issues:</span>
                        <span className="ml-1 font-medium">{project._count?.issues || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-1 font-medium">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/issues?projectId=${project.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Issues
                      </button>
                      
                      {isAdmin && (
                        <button
                          onClick={() => navigate(`/projects/${project.id}/settings`)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <Settings className="w-3 h-3" />
                          Settings
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};