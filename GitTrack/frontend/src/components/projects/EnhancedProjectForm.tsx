import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreateEnhancedProjectRequest, 
  ProjectType, 
  PROJECT_TYPE_CONFIG,
  ProjectGroup 
} from '../../types/project-groups';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  type: z.enum(['FRONTEND', 'BACKEND', 'MOBILE', 'DESKTOP', 'API', 'DATABASE', 'DEVOPS', 'FULLSTACK', 'OTHER']),
  githubRepoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubToken: z.string().optional(),
  projectGroupId: z.string().optional()
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EnhancedProjectFormProps {
  onSubmit: (data: CreateEnhancedProjectRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<ProjectFormData>;
  selectedGroupId?: string;
}

const EnhancedProjectForm: React.FC<EnhancedProjectFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  selectedGroupId
}) => {
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'FULLSTACK',
      githubRepoUrl: initialData?.githubRepoUrl || '',
      githubToken: initialData?.githubToken || '',
      projectGroupId: selectedGroupId || initialData?.projectGroupId || ''
    }
  });

  const selectedType = watch('type');
  const selectedConfig = PROJECT_TYPE_CONFIG[selectedType];

  useEffect(() => {
    loadProjectGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      setValue('projectGroupId', selectedGroupId);
    }
  }, [selectedGroupId, setValue]);

  const loadProjectGroups = async () => {
    try {
      setLoadingGroups(true);
      // TODO: Implement projectGroupService.getProjectGroups()
      // const response = await projectGroupService.getProjectGroups();
      
      // Mock data
      const mockGroups: ProjectGroup[] = [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Complete e-commerce solution',
          ownerId: '1',
          color: '#3B82F6',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projects: [],
          _count: { projects: 3, issues: 35 }
        },
        {
          id: '2',
          name: 'Blog System',
          description: 'Modern blog platform',
          ownerId: '1',
          color: '#10B981',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projects: [],
          _count: { projects: 2, issues: 10 }
        }
      ];
      
      setProjectGroups(mockGroups);
    } catch (error) {
      console.error('Failed to load project groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    const submitData: CreateEnhancedProjectRequest = {
      name: data.name,
      description: data.description,
      type: data.type,
      projectGroupId: data.projectGroupId || undefined
    };
    
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Project Group Selection */}
      <div>
        <label htmlFor="projectGroupId" className="block text-sm font-medium text-gray-700 mb-2">
          Project Group (Optional)
        </label>
        <select
          id="projectGroupId"
          {...register('projectGroupId')}
          disabled={loadingGroups}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">No group (standalone project)</option>
          {projectGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Group this project with related frontend/backend components
        </p>
      </div>

      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Frontend Web App, Backend API, Mobile App"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Project Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Project Type *
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(PROJECT_TYPE_CONFIG).map(([type, config]) => (
            <option key={type} value={type}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
        {selectedConfig && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedConfig.icon}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedConfig.bgColor} ${selectedConfig.color}`}>
                {selectedConfig.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what this project does and its role in the overall system..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* GitHub Integration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">GitHub Integration (Optional)</h3>
        
        <div>
          <label htmlFor="githubRepoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            id="githubRepoUrl"
            {...register('githubRepoUrl')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/username/repository"
          />
          {errors.githubRepoUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.githubRepoUrl.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            id="githubToken"
            {...register('githubToken')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          />
          <p className="mt-1 text-sm text-gray-500">
            Required for GitHub integration. Keep this secure and don't share it.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default EnhancedProjectForm;