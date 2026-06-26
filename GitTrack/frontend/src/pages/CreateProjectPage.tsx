import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, GitBranch } from 'lucide-react';
import { CreateEnhancedProjectRequest, ProjectType, PROJECT_TYPE_CONFIG } from '../types/project-groups';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProjectForm extends CreateEnhancedProjectRequest { }

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProjectForm>();

  // Only admin can create projects
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only administrators can create projects.</p>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ProjectForm) => {
    setSaving(true);
    try {
      const projectData: CreateEnhancedProjectRequest = {
        name: data.name,
        description: data.description,
        type: data.type,
        projectGroupId: data.projectGroupId || undefined
      };

      const response = await projectService.createProject(projectData);

      if (response.success) {
        toast.success('Project created successfully!');
        navigate('/projects');
      } else {
        const e = response.error;
        toast.error((typeof e === 'object' ? e?.message : e) || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Create project error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to create project';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Set up a new project with optional GitHub integration</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', {
                required: 'Project name is required',
                minLength: {
                  value: 2,
                  message: 'Project name must be at least 2 characters'
                },
                maxLength: {
                  value: 100,
                  message: 'Project name cannot exceed 100 characters'
                }
              })}
              placeholder="Enter project name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description', {
                required: 'Project description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters'
                },
                maxLength: {
                  value: 500,
                  message: 'Description cannot exceed 500 characters'
                }
              })}
              placeholder="Describe your project..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Project Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Project Type *
            </label>
            <select
              id="type"
              {...register('type', {
                required: 'Project type is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select project type</option>
              {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Project Group Selection */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-900">Project Organization (Optional)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Assign this project to a project group for better organization. GitHub repositories are managed at the group level.
            </p>

            {/* Project Group Selection */}
            <div>
              <label htmlFor="projectGroupId" className="block text-sm font-medium text-gray-700 mb-2">
                Project Group
              </label>
              <select
                id="projectGroupId"
                {...register('projectGroupId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No group (standalone project)</option>
                {/* TODO: Load project groups from API */}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                GitHub repositories and integrations are configured at the project group level.{' '}
                <a
                  href="/project-groups/new"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Create a project group
                </a>
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};