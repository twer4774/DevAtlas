import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Trash2, 
  GitBranch, 
  ExternalLink,
  Calendar,
  BarChart3,
  Tag
} from 'lucide-react';
import { EnhancedProject, PROJECT_TYPE_CONFIG } from '../../types/project-groups';

interface EnhancedProjectCardProps {
  project: EnhancedProject;
  onEdit?: (project: EnhancedProject) => void;
  onDelete?: (project: EnhancedProject) => void;
  canEdit?: boolean;
  showGroup?: boolean;
}

const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  canEdit = false,
  showGroup = true
}) => {
  const navigate = useNavigate();
  const config = PROJECT_TYPE_CONFIG[project.type];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2 mt-2">
              {project.description}
            </p>
          </div>
          
          {canEdit && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit?.(project)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit Project"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(project)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Project Group Info */}
        {showGroup && project.projectGroup && (
          <div className="mb-4 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Group:</span>
              <span 
                className="text-sm font-medium px-2 py-1 rounded text-white"
                style={{ backgroundColor: project.projectGroup.color || '#3B82F6' }}
              >
                {project.projectGroup.name}
              </span>
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Issues:</span>
            <span className="font-medium">{project._count?.issues || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">
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
          
          {canEdit && (
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
  );
};

export default EnhancedProjectCard;