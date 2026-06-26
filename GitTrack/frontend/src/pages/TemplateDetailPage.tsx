import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileText, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Template } from '../types';
import { templateService } from '../services/templateService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const TemplateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await templateService.getTemplateById(templateId);
      
      if (response.success) {
        setTemplate(response.data);
      } else {
        toast.error('Failed to load template');
        navigate('/templates');
      }
    } catch (error: any) {
      console.error('Failed to load template:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load template';
      toast.error(errorMessage);
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async () => {
    if (!template || !id) return;
    
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await templateService.deleteTemplate(id);
      
      if (response.success) {
        toast.success('Template deleted successfully');
        navigate('/templates');
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

  const canEdit = () => {
    return template && (user?.role === 'admin' || template.creator?.id === user?.id);
  };

  const canDelete = () => {
    return template && (user?.role === 'admin' || template.creator?.id === user?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Template not found.</p>
      </div>
    );
  }

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
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/issues/create?template=${template.id}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Use Template
          </button>
          
          {canEdit() && (
            <button
              onClick={() => navigate(`/templates/${template.id}/edit`)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          
          {canDelete() && (
            <button
              onClick={deleteTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Template Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Template Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h1>
              <span className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-full border ${getTypeColor(template.issueType)}`}>
                <FileText className="w-4 h-4 mr-1" />
                {template.issueType}
              </span>
            </div>
          </div>

          {/* Template Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created by:</span>
              <span className="ml-1">{template.creator?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-1">{new Date(template.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Last updated:</span>
              <span className="ml-1">{new Date(template.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Template Content */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Content</h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{String(template.content || '')}</ReactMarkdown>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Use this template to create consistent {template.issueType} issues
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/templates')}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                View All Templates
              </button>
              
              <button
                onClick={() => navigate(`/issues/create?template=${template.id}`)}
                className="text-sm text-green-600 hover:text-green-800 transition-colors font-medium"
              >
                Create Issue from Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};