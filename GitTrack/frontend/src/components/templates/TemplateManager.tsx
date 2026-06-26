import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  FileText,
  Bug,
  CheckSquare,
  Lightbulb,
  Star
} from 'lucide-react';
import { Template } from '../../types';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Validation schema
const templateSchema = z.object({
  name: z.string()
    .min(2, 'Template name must be at least 2 characters long')
    .max(100, 'Template name cannot exceed 100 characters'),
  issueType: z.enum(['bug', 'task', 'improvement', 'feature'], {
    message: 'Please select an issue type'
  }),
  content: z.string()
    .min(10, 'Template content must be at least 10 characters long')
    .max(5000, 'Template content cannot exceed 5000 characters')
});

type TemplateFormData = z.infer<typeof templateSchema>;

export const TemplateManager: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      issueType: 'task'
    }
  });

  const content = watch('content');

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateService.getTemplates(selectedType || undefined);
      
      if (response.success) {
        setTemplates(response.data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await templateService.updateTemplate(editingTemplate.id, data);
        
        if (response.success) {
          setTemplates(prev => 
            prev.map(template => 
              template.id === editingTemplate.id ? response.data : template
            )
          );
          toast.success('Template updated successfully!');
          setEditingTemplate(null);
        } else {
          toast.error(response.error || 'Failed to update template');
        }
      } else {
        // Create new template
        const response = await templateService.createTemplate(data);
        
        if (response.success) {
          setTemplates(prev => [response.data, ...prev]);
          toast.success('Template created successfully!');
          setShowCreateForm(false);
        } else {
          toast.error(response.error || 'Failed to create template');
        }
      }
      
      reset();
      setShowPreview(false);
    } catch (error: any) {
      console.error('Template operation error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await templateService.deleteTemplate(template.id);
      
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        toast.success('Template deleted successfully!');
      } else {
        toast.error(response.error || 'Failed to delete template');
      }
    } catch (error: any) {
      console.error('Delete template error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete template';
      toast.error(errorMessage);
    }
  };

  const startEditing = (template: Template) => {
    setEditingTemplate(template);
    setValue('name', template.name);
    setValue('issueType', template.issueType);
    setValue('content', template.content);
    setShowCreateForm(false);
    setShowPreview(false);
  };

  const cancelEditing = () => {
    setEditingTemplate(null);
    setShowCreateForm(false);
    reset();
    setShowPreview(false);
  };

  const getTypeIcon = (type: Template['issueType']) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
      case 'task': return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'improvement': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'feature': return <Star className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: Template['issueType']) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-200';
      case 'task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'feature': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageTemplates = user?.role === 'admin';

  if (!canManageTemplates) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only administrators can manage templates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600">Create and manage issue templates for different types</p>
        </div>
        
        {!showCreateForm && !editingTemplate && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
          Filter by type:
        </label>
        <select
          id="type-filter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="task">Task</option>
          <option value="improvement">Improvement</option>
          <option value="feature">Feature</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTemplate) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            <button
              onClick={cancelEditing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter template name..."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  {...register('issueType')}
                  id="issueType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
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

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Template Content *
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
                    <ReactMarkdown>{String(content || '*No content provided*')}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  {...register('content')}
                  id="content"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter template content using Markdown..."
                />
              )}
              
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
              
              <p className="mt-1 text-sm text-gray-500">
                Supports Markdown formatting. This content will be used as the default description for new issues.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedType ? `No templates found for ${selectedType} type.` : 'Get started by creating a new template.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(template.issueType)}`}>
                        {getTypeIcon(template.issueType)}
                        {template.issueType}
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-gray-600 mb-3">
                      <ReactMarkdown>{String(template.content.substring(0, 200) + '...')}</ReactMarkdown>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created by {template.creator?.name}</span>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      {template.updatedAt !== template.createdAt && (
                        <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEditing(template)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};