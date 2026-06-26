import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { Template } from '../types';
import { templateService } from '../services/templateService';
import { useAuth } from '../contexts/AuthContext';
import { BannerAd } from '../components/AdSense';
import toast from 'react-hot-toast';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');

  const issueTypes = [
    { value: '', label: 'All Types' },
    { value: 'bug', label: 'Bug' },
    { value: 'task', label: 'Task' },
    { value: 'improvement', label: 'Improvement' },
    { value: 'feature', label: 'Feature' }
  ];

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
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load templates';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await templateService.deleteTemplate(templateId);
      
      if (response.success) {
        toast.success('Template deleted successfully');
        setTemplates(templates.filter(t => t.id !== templateId));
      } else {
        toast.error(response.error?.message || 'Failed to delete template');
      }
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete template';
      toast.error(errorMessage);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-200';
      case 'task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'feature': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = (template: Template) => {
    return user?.role === 'admin' || template.creator?.id === user?.id;
  };

  const canDelete = (template: Template) => {
    return user?.role === 'admin' || template.creator?.id === user?.id;
  };

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
        adSlot="4815162342" 
        className="mb-6"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600">Manage issue templates for consistent issue creation</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {issueTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/templates/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {selectedType 
              ? `No templates found for ${selectedType} issues.`
              : 'Get started by creating your first template.'
            }
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/templates/new')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 overflow-hidden transition-all duration-200 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(template.issueType)}`}>
                      {template.issueType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => navigate(`/templates/${template.id}`)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canEdit(template) && (
                      <button
                        onClick={() => navigate(`/templates/${template.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canDelete(template) && (
                      <button
                        onClick={() => deleteTemplate(template.id, template.name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Template Preview */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </div>
                </div>

                {/* Template Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created by: {template.creator?.name || 'Unknown'}</div>
                  <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/templates/${template.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Details
                  </button>
                  
                  <button
                    onClick={() => navigate(`/issues/create?template=${template.id}`)}
                    className="text-sm text-green-600 hover:text-green-800 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};