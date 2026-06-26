import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  Tag, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  GitBranch,
  Wifi,
  History
} from 'lucide-react';
import { Issue } from '../../types';
import { issueService } from '../../services/issueService';
import { syncService } from '../../services/syncService';
import { useAuth } from '../../contexts/AuthContext';
import { EditIssueForm } from './EditIssueForm';
import { CommentList } from '../comments/CommentList';
import { AttachmentManager } from '../attachments/AttachmentManager';
import { StatusDropdown } from './StatusDropdown';
import { StatusHistory } from './StatusHistory';
import toast from 'react-hot-toast';

export const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  useEffect(() => {
    if (id) {
      loadIssue(id);
    }
  }, [id]);



  // Auto-sync with GitHub (comments + status)
  useEffect(() => {
    if (!issue?.id) return;
    if (!syncService.canSync(issue)) return;

    console.log('🔄 Starting auto-sync for issue:', issue.id);
    
    // Start auto-sync
    syncService.startAutoSync(issue.id, (updatedIssue) => {
      setIssue(updatedIssue);
    });

    // Cleanup on unmount
    return () => {
      syncService.stopAutoSync(issue.id);
    };
  }, [issue?.id, issue?.githubIssueNumber, issue?.project?.githubRepoUrl]);

  const loadIssue = async (issueId: string) => {
    try {
      setLoading(true);
      const response = await issueService.getIssueById(issueId);
      
      if (response.success) {
        setIssue(response.data);
      } else {
        toast.error('Failed to load issue');
        navigate('/issues');
      }
    } catch (error: any) {
      console.error('Failed to load issue:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load issue';
      toast.error(errorMessage);
      navigate('/issues');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!issue?.id) return;

    setSyncing(true);
    try {
      await syncService.syncIssueManual(issue.id);
      
      // Reload issue to get updated data
      await loadIssue(issue.id);
    } catch (error: any) {
      console.error('❌ Manual sync error:', error);
      // Error handling is done in syncService
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!issue || !id) return;
    
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await issueService.deleteIssue(id);
      
      if (response.success) {
        toast.success('Issue deleted successfully');
        navigate('/issues');
      } else {
        toast.error('Failed to delete issue');
      }
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete issue';
      toast.error(errorMessage);
    }
  };

  const getTypeIcon = (type: Issue['type']) => {
    switch (type) {
      case 'bug': return <AlertTriangle className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'improvement': return <Tag className="w-4 h-4" />;
      case 'feature': return <Tag className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Issue['type']) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-200';
      case 'task': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'feature': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditSuccess = (updatedIssue: Issue) => {
    setIssue(updatedIssue);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // 로컬 시스템에서는 모든 로그인한 사용자가 모든 이슈를 수정/삭제 가능
  const canEdit = !!user;
  const canDelete = !!user;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Issue not found.</p>
      </div>
    );
  }

  // Show edit form if in editing mode
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/issues')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </button>
        </div>
        
        <EditIssueForm
          issue={issue}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/issues')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </button>
        
        <div className="flex items-center gap-2">
          {/* Status History Button */}
          <button
            onClick={() => setShowStatusHistory(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>

          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Issue Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Issue Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-4">
              {issue.title}
            </h1>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Auto-sync status */}
              {issue.githubIssueNumber && issue.project?.githubRepoUrl && (
                <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                  <Wifi className="w-3 h-3" />
                  Auto-sync
                </div>
              )}
              
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(issue.type)}`}>
                {getTypeIcon(issue.type)}
                {issue.type}
              </span>
              
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              
              <StatusDropdown
                issue={issue}
                onStatusChange={setIssue}
                canEdit={!!canEdit}
              />
            </div>
          </div>

          {/* Issue Metadata */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Created by <strong>{issue.creator.name}</strong></span>
            </div>
            
            {issue.assignee && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Assigned to <strong>{issue.assignee.name}</strong></span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
            
            {issue.updatedAt !== issue.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Issue Description */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{String(issue.description || '')}</ReactMarkdown>
          </div>
        </div>

        {/* GitHub Integration Section */}
        {syncService.canSync(issue) && (
          <div className="px-6 py-4 border-t border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-green-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-900">
                      GitHub Integration Active
                    </span>
                    <a
                      href={issue.githubIssueUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      #{issue.githubIssueNumber}
                    </a>
                  </div>
                  <p className="text-xs text-green-700">
                    Auto-syncing comments and status every 30 seconds
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStatusHistory(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-white border border-green-300 hover:bg-green-50 rounded-md transition-colors"
                  title="View status change history"
                >
                  <Clock className="w-4 h-4" />
                  History
                </button>
                
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sync now with GitHub"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="px-6 py-6 border-t border-gray-200">
          <CommentList 
            issueId={issue.id}
            initialComments={issue.comments || []}
            onCommentAdded={(comment) => {
              // 새 댓글 추가 시 이슈 데이터 새로고침
              loadIssue(issue.id);
            }}
            onCommentUpdated={(comment) => {
              // 댓글 수정 시 이슈 데이터 새로고침
              loadIssue(issue.id);
            }}
            onCommentDeleted={(commentId) => {
              // 댓글 삭제 시 이슈 데이터 새로고침
              loadIssue(issue.id);
            }}
          />
        </div>

        {/* Attachments Section */}
        <div className="px-6 py-6 border-t border-gray-200">
          <AttachmentManager
            issueId={issue.id}
            canUpload={!!user}
            canDelete={!!canEdit}
          />
        </div>
      </div>

      {/* Status History Modal */}
      <StatusHistory
        issueId={issue.id}
        isOpen={showStatusHistory}
        onClose={() => setShowStatusHistory(false)}
      />
    </div>
  );
};