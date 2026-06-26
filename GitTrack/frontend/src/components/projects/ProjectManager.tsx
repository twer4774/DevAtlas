import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GitBranch, ExternalLink, Settings } from 'lucide-react';
import { EnhancedProject } from '../../types/project-groups';
import { projectService } from '../../services/projectService';
import { GitHubSettings } from '../github/GitHubSettings';
import toast from 'react-hot-toast';

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<EnhancedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuringGitHub, setConfiguringGitHub] = useState<EnhancedProject | null>(null);

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
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubUpdate = (updatedProject: EnhancedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setConfiguringGitHub(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Manage projects and configure GitHub integration</p>
        </div>
      </div>

      {/* GitHub Configuration */}
      {configuringGitHub && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Configure GitHub for "{configuringGitHub.name}"
            </h3>
            <button
              onClick={() => setConfiguringGitHub(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <GitHubSettings
            project={configuringGitHub}
            onUpdate={handleGitHubUpdate}
          />
        </div>
      )}

      {/* Projects List */}
      {!configuringGitHub && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                        {project.githubRepos?.[0]?.url && (
                          <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <GitBranch className="w-3 h-3" />
                            <span>GitHub</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        
                        {project.githubRepos?.[0]?.url && (
                          <a
                            href={project.githubRepos![0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <GitBranch className="w-4 h-4" />
                            Repository
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setConfiguringGitHub(project)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Configure GitHub integration"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};