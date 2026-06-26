import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Plus, 
  Trash2, 
  FolderOpen, 
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { ProjectGroup, PROJECT_TYPE_CONFIG } from '../../types/project-groups';

interface ProjectGroupCardProps {
  projectGroup: ProjectGroup;
  onEdit?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  canEdit?: boolean;
}

const ProjectGroupCard: React.FC<ProjectGroupCardProps> = ({
  projectGroup,
  onEdit,
  onDelete,
  canEdit = false
}) => {
  const navigate = useNavigate();

  const handleAddProject = () => {
    navigate(`/projects/new?groupId=${projectGroup.id}`);
  };

  const handleViewProjects = () => {
    navigate(`/projects?groupId=${projectGroup.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div 
        className="p-4 border-l-4"
        style={{ 
          borderLeftColor: projectGroup.color || '#3B82F6',
          backgroundColor: `${projectGroup.color || '#3B82F6'}10`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {projectGroup.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {projectGroup.description}
            </p>
          </div>
          
          {canEdit && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit?.(projectGroup)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit Group"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(projectGroup)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Projects:</span>
            <span className="font-medium">{projectGroup._count?.projects || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Issues:</span>
            <span className="font-medium">{projectGroup._count?.issues || 0}</span>
          </div>
        </div>
      </div>

      {/* Projects Preview */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Projects</h4>
          {projectGroup.projects.length > 3 && (
            <button
              onClick={handleViewProjects}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View all ({projectGroup.projects.length})
            </button>
          )}
        </div>
        
        {projectGroup.projects.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectGroup.projects.slice(0, 3).map((project) => {
              const config = PROJECT_TYPE_CONFIG[project.type];
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/issues?projectId=${project.id}`)}
                >
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {project._count?.issues || 0} issues
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={handleViewProjects}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Projects
          </button>
          
          {canEdit && (
            <button
              onClick={handleAddProject}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Owner: {projectGroup.owner?.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(projectGroup.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectGroupCard;