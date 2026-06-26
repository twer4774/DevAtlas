import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { templateService } from '../services/templateService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TemplateForm {
  name: string;
  issueType: 'bug' | 'task' | 'improvement' | 'feature';
  content: string;
}

export const CreateTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<TemplateForm>();

  const watchedContent = watch('content', '');

  // Only admin can create templates
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only administrators can create templates.</p>
          <button
            onClick={() => navigate('/templates')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: TemplateForm) => {
    setSaving(true);
    try {
      const response = await templateService.createTemplate(data);

      if (response.success) {
        toast.success('Template created successfully!');
        navigate('/templates');
      } else {
        toast.error(response.error?.message || 'Failed to create template');
      }
    } catch (error: any) {
      console.error('Create template error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to create template';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const defaultTemplates = {
    bug: `## Bug Description
Please provide a clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

## Additional Context
Add any other context about the problem here.`,

    task: `## Task Description
What needs to be done?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Resources
Links to relevant documentation or resources.

## Notes
Any additional notes or considerations.`,

    improvement: `## Current Situation
Describe the current state that needs improvement.

## Proposed Improvement
What improvement do you suggest?

## Benefits
- Benefit 1
- Benefit 2
- Benefit 3

## Implementation Notes
Any technical considerations or implementation details.

## Success Metrics
How will we measure the success of this improvement?`,

    feature: `## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
Is your feature request related to a problem? Please describe.

## Proposed Solution
Describe the solution you'd like.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Additional Context
Add any other context or screenshots about the feature request here.`
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Template</h1>
          <p className="text-gray-600">Create a reusable template for consistent issue creation</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', {
                  required: 'Template name is required',
                  minLength: {
                    value: 2,
                    message: 'Template name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Template name cannot exceed 100 characters'
                  }
                })}
                placeholder="Enter template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                id="issueType"
                {...register('issueType', {
                  required: 'Issue type is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const type = e.target.value as keyof typeof defaultTemplates;
                  if (type && defaultTemplates[type]) {
                    // Auto-fill with default template
                    const contentField = document.getElementById('content') as HTMLTextAreaElement;
                    if (contentField && !contentField.value.trim()) {
                      contentField.value = defaultTemplates[type];
                    }
                  }
                }}
              >
                <option value="">Select issue type</option>
                <option value="bug">Bug</option>
                <option value="task">Task</option>
                <option value="improvement">Improvement</option>
                <option value="feature">Feature</option>
              </select>
              {errors.issueType && (
                <p className="mt-1 text-sm text-red-600">{errors.issueType.message}</p>
              )}
            </div>
          </div>

          {/* Template Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Template Content *
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Preview
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div className={showPreview ? '' : 'lg:col-span-2'}>
                <textarea
                  id="content"
                  rows={16}
                  {...register('content', {
                    required: 'Template content is required',
                    minLength: {
                      value: 10,
                      message: 'Template content must be at least 10 characters'
                    },
                    maxLength: {
                      value: 5000,
                      message: 'Template content cannot exceed 5000 characters'
                    }
                  })}
                  placeholder="Enter template content using Markdown..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Use Markdown formatting. Supports headers, lists, code blocks, and more.
                </p>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div className="prose prose-sm max-w-none">
                    {watchedContent ? (
                      <ReactMarkdown>{String(watchedContent)}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 italic">Enter content to see preview</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/templates')}
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
              {saving ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};