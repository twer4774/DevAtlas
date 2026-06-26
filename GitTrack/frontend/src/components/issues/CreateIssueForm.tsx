import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { User, Template } from '../../types';
import { EnhancedProject } from '../../types/project-groups';
import { issueService } from '../../services/issueService';
import { projectService } from '../../services/projectService';
import { templateService } from '../../services/templateService';
import { attachmentService } from '../../services/attachmentService';
import { githubService } from '../../services/githubService';
import { specService, Spec } from '../../services/specService';
import { FileUpload } from '../attachments/FileUpload';
import toast from 'react-hot-toast';

// Validation schema
const createIssueSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(5000, 'Description cannot exceed 5000 characters'),
  type: z.enum(['bug', 'task', 'improvement', 'feature'], {
    message: 'Please select an issue type'
  }),
  priority: z.enum(['urgent', 'high', 'medium', 'low'], {
    message: 'Please select a priority level'
  }),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, 'Please select a project')
});

type CreateIssueFormData = z.infer<typeof createIssueSchema>;

interface CreateIssueFormProps {
  onSuccess?: (issue: any) => void;
  onCancel?: () => void;
  defaultProjectId?: string;
}

export const CreateIssueForm: React.FC<CreateIssueFormProps> = ({
  onSuccess,
  onCancel,
  defaultProjectId
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [projects, setProjects] = useState<EnhancedProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Spec-driven development states
  const [showSpecOption, setShowSpecOption] = useState(false);
  const [createWithSpec, setCreateWithSpec] = useState(false);
  const [specTemplate, setSpecTemplate] = useState<any>(null);
  const [isLoadingSpecTemplate, setIsLoadingSpecTemplate] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      priority: 'medium',
      type: 'task'
    }
  });

  const description = watch('description');
  const selectedType = watch('type');

  // Load projects and users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading form data...');
        
        const [projectsResponse] = await Promise.all([
          projectService.getProjects()
        ]);
        
        console.log('Projects response:', projectsResponse);
        
        if (projectsResponse.success) {
          const projectsData = projectsResponse.data || [];
          setProjects(projectsData);
          console.log('Projects loaded:', projectsData);

          // Set default project if not already set
          if (!defaultProjectId && projectsData.length > 0) {
            setValue('projectId', projectsData[0].id);
            console.log('Default project set:', projectsData[0].id);
          }
        } else {
          console.error('Failed to load projects:', projectsResponse.error);
          toast.error('Failed to load projects');
        }

        // Load users for assignee dropdown
        try {
          // Create a user service to get actual users from the database
          const userService = {
            async getUsers() {
              const token = localStorage.getItem('token');
              const response = await fetch(`${'/api'}/admin/users`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                return { success: true, data: data.data || [] };
              } else {
                return { success: false, data: [] };
              }
            }
          };

          const usersResponse = await userService.getUsers();
          if (usersResponse.success) {
            setUsers(usersResponse.data);
            console.log('Users loaded from database:', usersResponse.data);
          } else {
            // Fallback to empty list if can't load users
            setUsers([]);
            console.log('Could not load users, using empty list');
          }
        } catch (userError) {
          console.error('Failed to load users:', userError);
          setUsers([]);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, [defaultProjectId, setValue]);

  // Load templates when issue type changes
  useEffect(() => {
    const loadTemplates = async () => {
      if (selectedType) {
        try {
          const response = await templateService.getTemplatesByType(selectedType as any);
          if (response.success) {
            setTemplates(response.data);
          }
        } catch (error) {
          console.error('Failed to load templates:', error);
        }
      }
    };

    loadTemplates();
    
    // Show spec option for feature and improvement types
    setShowSpecOption(['feature', 'improvement'].includes(selectedType));
  }, [selectedType]);

  // Load spec template when user chooses to create with spec
  const loadSpecTemplate = async () => {
    if (!selectedType) return;
    
    setIsLoadingSpecTemplate(true);
    try {
      const response = await specService.generateSpecTemplate(selectedType as any);
      if (response.success) {
        setSpecTemplate(response.data);
        toast.success('Spec template loaded! Fill out the sections below.');
      } else {
        toast.error('Failed to load spec template');
      }
    } catch (error) {
      console.error('Failed to load spec template:', error);
      toast.error('Failed to load spec template');
    } finally {
      setIsLoadingSpecTemplate(false);
    }
  };

  // Handle spec creation workflow
  const handleCreateWithSpec = async () => {
    setCreateWithSpec(true);
    await loadSpecTemplate();
  };

  // Apply template
  const applyTemplate = async (templateId: string) => {
    try {
      const response = await templateService.applyTemplate(templateId);
      if (response.success) {
        setValue('title', response.data.title);
        setValue('description', response.data.description);
        setValue('priority', response.data.priority);
        toast.success('Template applied successfully!');
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply template');
    }
  };

  const onSubmit = async (data: CreateIssueFormData) => {
    console.log('🚀 Starting issue creation...');
    console.log('Form data:', data);
    
    setIsSubmitting(true);
    
    try {
      // Validate data before sending
      if (!data.title || data.title.trim().length < 3) {
        toast.error('Title must be at least 3 characters long');
        return;
      }
      
      if (!data.description || data.description.trim().length < 10) {
        toast.error('Description must be at least 10 characters long');
        return;
      }
      
      if (!data.projectId) {
        toast.error('Please select a project');
        return;
      }

      console.log('✅ Validation passed, calling API...');
      
      // First create the issue
      const response = await issueService.createIssue(data);
      
      console.log('📡 API Response:', response);
      
      if (response.success) {
        const createdIssue = response.data;
        console.log('✅ Issue created successfully:', createdIssue);
        
        // If there are files to upload, upload them
        if (selectedFiles.length > 0) {
          try {
            console.log('📎 Uploading attachments...');
            await attachmentService.uploadAttachments(createdIssue.id, selectedFiles);
            toast.success(`Issue created successfully with ${selectedFiles.length} file(s) attached!`);
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            toast.success('Issue created successfully, but some files failed to upload.');
          }
        } else {
          toast.success('Issue created successfully!');
        }

        // Auto-create GitHub issue if project has GitHub integration
        console.log('🔍 Checking GitHub integration for project:', createdIssue.project);
        console.log('GitHub Repo URL:', createdIssue.project?.githubRepoUrl);
        console.log('GitHub Token exists:', !!createdIssue.project?.githubToken);
        
        if (createdIssue.project?.githubRepoUrl && createdIssue.project?.githubToken) {
          console.log('🔗 Project has GitHub integration, creating GitHub issue...');
          console.log('Issue ID:', createdIssue.id);
          
          try {
            const githubResponse = await githubService.createGitHubIssue(createdIssue.id);
            console.log('📡 GitHub API Response:', githubResponse);
            
            if (githubResponse.success) {
              console.log('✅ GitHub issue created successfully');
              console.log('GitHub issue number:', githubResponse.data.githubIssueNumber);
              console.log('GitHub issue URL:', githubResponse.data.githubIssueUrl);
              toast.success('Issue created and synced to GitHub!');
              // Update the issue with GitHub info
              createdIssue.githubIssueNumber = githubResponse.data.githubIssueNumber;
              createdIssue.githubIssueUrl = githubResponse.data.githubIssueUrl;
            } else {
              console.error('❌ Failed to create GitHub issue:', githubResponse.error);
              toast.error(`Issue created locally, but failed to sync to GitHub: ${githubResponse.error?.message || 'Unknown error'}`);
            }
          } catch (githubError: any) {
            console.error('❌ GitHub sync error:', githubError);
            console.error('Error details:', {
              message: githubError.message,
              response: githubError.response?.data,
              status: githubError.response?.status
            });
            toast.error(`Issue created locally, but failed to sync to GitHub: ${githubError.response?.data?.error?.message || githubError.message}`);
          }
        } else {
          console.log('ℹ️ No GitHub integration configured for this project');
          if (!createdIssue.project?.githubRepoUrl) {
            console.log('❌ Missing GitHub Repository URL');
          }
          if (!createdIssue.project?.githubToken) {
            console.log('❌ Missing GitHub Token');
          }
        }
        
        onSuccess?.(createdIssue);
      } else {
        console.error('❌ API returned error:', response.error);
        toast.error(response.error?.message || response.error || 'Failed to create issue');
      }
    } catch (error: any) {
      console.error('❌ Create issue error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = 'Failed to create issue';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        errorMessage = 'You are not authorized. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create issues.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Project not found. Please select a valid project.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueTypes = [
    { value: 'bug', label: 'Bug', color: 'text-red-600' },
    { value: 'task', label: 'Task', color: 'text-blue-600' },
    { value: 'improvement', label: 'Improvement', color: 'text-yellow-600' },
    { value: 'feature', label: 'Feature', color: 'text-green-600' }
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-green-600' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Issue</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Enter issue title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Project and Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              {...register('projectId')}
              id="projectId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              {...register('type')}
              id="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
        </div>

        {/* Priority and Assignee Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              {...register('priority')}
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <select
              {...register('assigneeId')}
              id="assigneeId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Spec-Driven Development Option */}
        {showSpecOption && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">🎯 Spec-Driven Development</h3>
                <p className="text-sm text-blue-700">
                  For {selectedType === 'feature' ? 'new features' : 'improvements'}, consider creating a specification first to ensure clear requirements and design.
                </p>
              </div>
              {!createWithSpec && (
                <button
                  type="button"
                  onClick={handleCreateWithSpec}
                  disabled={isLoadingSpecTemplate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isLoadingSpecTemplate ? 'Loading...' : 'Create with Spec'}
                </button>
              )}
            </div>
            
            {createWithSpec && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">Specification Template</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateWithSpec(false);
                      setSpecTemplate(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Skip Spec
                  </button>
                </div>
                
                {specTemplate && (
                  <div className="space-y-4">
                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                      💡 <strong>Tip:</strong> Fill out these sections to create a comprehensive specification. 
                      This will help ensure clear requirements and smooth implementation.
                    </div>
                    
                    {/* Requirements Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📋 Requirements
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder={specTemplate.requirements}
                        defaultValue={specTemplate.requirements}
                      />
                    </div>
                    
                    {/* Acceptance Criteria Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✅ Acceptance Criteria
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder={specTemplate.acceptance}
                        defaultValue={specTemplate.acceptance}
                      />
                    </div>
                    
                    {/* Design Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🎨 Design & Architecture
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder={specTemplate.design}
                        defaultValue={specTemplate.design}
                      />
                    </div>
                    
                    {/* Implementation Plan Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔧 Implementation Plan
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder={specTemplate.implementation}
                        defaultValue={specTemplate.implementation}
                      />
                    </div>
                    
                    {/* Testing Plan Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🧪 Testing Plan
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder={specTemplate.testing}
                        defaultValue={specTemplate.testing}
                      />
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-700">
                        🚀 <strong>Next Steps:</strong> After filling out the specification, this will be saved as a spec document 
                        and linked to your issue. You can create multiple issues from the same spec later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Template Selection */}
        {templates.length > 0 && !createWithSpec && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Template (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className="p-3 text-left border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Click on a template to auto-fill the title and description fields.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>
          </div>

          {showPreview ? (
            <div className="min-h-[200px] p-4 border border-gray-300 rounded-md bg-gray-50">
              <div className="prose max-w-none">
                <ReactMarkdown>{String(description || '*No description provided*')}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              {...register('description')}
              id="description"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Describe the issue in detail. You can use Markdown formatting..."
            />
          )}
          
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
          
          <p className="mt-1 text-sm text-gray-500">
            Supports Markdown formatting. Use **bold**, *italic*, `code`, and more.
          </p>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Attachments (Optional)
          </label>
          <FileUpload
            onFilesSelected={setSelectedFiles}
            maxFiles={5}
            maxFileSize={10}
            disabled={isSubmitting}
          />
          {selectedFiles.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedFiles.length} file(s) selected. Files will be uploaded after the issue is created.
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </form>
    </div>
  );
};