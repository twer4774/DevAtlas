import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { Issue, UpdateIssueRequest, User } from '../../types';
import { EnhancedProject } from '../../types/project-groups';
import { issueService } from '../../services/issueService';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

// Validation schema
const updateIssueSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters long')
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional(),
  type: z.enum(['bug', 'task', 'improvement', 'feature']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assigneeId: z.string().optional()
});

type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;

interface EditIssueFormProps {
  issue: Issue;
  onSuccess?: (issue: Issue) => void;
  onCancel?: () => void;
}

export const EditIssueForm: React.FC<EditIssueFormProps> = ({
  issue,
  onSuccess,
  onCancel
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [projects, setProjects] = useState<EnhancedProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UpdateIssueFormData>({
    resolver: zodResolver(updateIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      type: issue.type,
      priority: issue.priority,
      status: issue.status,
      assigneeId: issue.assigneeId || ''
    }
  });

  const description = watch('description');

  // Load projects and users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsResponse] = await Promise.all([
          projectService.getProjects()
        ]);
        
        if (projectsResponse.success) {
          setProjects(projectsResponse.data || []);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: UpdateIssueFormData) => {
    setIsSubmitting(true);
    
    try {
      // Only send fields that have changed
      const updateData: UpdateIssueRequest = {};
      
      if (data.title !== issue.title) updateData.title = data.title;
      if (data.description !== issue.description) updateData.description = data.description;
      if (data.type !== issue.type) updateData.type = data.type;
      if (data.priority !== issue.priority) updateData.priority = data.priority;
      if (data.status !== issue.status) updateData.status = data.status;
      if (data.assigneeId !== (issue.assigneeId || '')) {
        updateData.assigneeId = data.assigneeId || undefined;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast('No changes to save');
        onCancel?.();
        return;
      }

      const response = await issueService.updateIssue(issue.id, updateData);
      
      if (response.success) {
        toast.success('Issue updated successfully!');
        onSuccess?.(response.data);
      } else {
        toast.error(response.error || 'Failed to update issue');
      }
    } catch (error: any) {
      console.error('Update issue error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to update issue';
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

  const statuses = [
    { value: 'open', label: 'Open', color: 'text-blue-600' },
    { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
    { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
    { value: 'closed', label: 'Closed', color: 'text-gray-600' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Issue</h2>
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
            Title
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

        {/* Type, Priority, and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
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

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
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

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              {...register('status')}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
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

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};