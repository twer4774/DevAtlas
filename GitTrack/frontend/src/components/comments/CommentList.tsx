import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { 
  MessageCircle, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  User
} from 'lucide-react';
import { Comment, CommentFormData } from '../../types';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Validation schema
const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters')
});

interface CommentListProps {
  issueId: string;
  initialComments?: Comment[];
  realTimeComments?: Comment[];
  onCommentAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  issueId,
  initialComments = [],
  realTimeComments,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Update comments when real-time comments change
  useEffect(() => {
    // 임시로 realTimeComments 업데이트 비활성화 (삭제 문제 해결용)
    // if (realTimeComments && realTimeComments.length > 0) {
    //   console.log('🔄 Updating comments from realTimeComments:', realTimeComments);
    //   setComments(realTimeComments);
    // }
    console.log('🔄 realTimeComments update disabled for debugging');
  }, [realTimeComments]);

  // Form for new comment
  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    watch: watchNew,
    reset: resetNew,
    formState: { errors: errorsNew }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  });

  // Form for editing comment
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  });

  const newCommentContent = watchNew('content');
  const editCommentContent = watchEdit('content');

  // Load comments if not provided initially
  useEffect(() => {
    if (initialComments.length === 0) {
      loadComments();
    }
  }, [issueId, initialComments.length]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getCommentsByIssueId(issueId);
      
      if (response.success) {
        setComments(response.data);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Create new comment
  const onSubmitNew = async (data: CommentFormData) => {
    try {
      const response = await commentService.createComment(issueId, data);
      
      if (response.success) {
        const newComment = response.data;
        setComments(prev => [...prev, newComment]);
        resetNew();
        toast.success('Comment added successfully!');
        onCommentAdded?.(newComment);
      } else {
        toast.error(response.error || 'Failed to add comment');
      }
    } catch (error: any) {
      console.error('Create comment error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to add comment';
      toast.error(errorMessage);
    }
  };

  // Update comment
  const onSubmitEdit = async (data: CommentFormData) => {
    if (!editingCommentId) return;

    try {
      const response = await commentService.updateComment(editingCommentId, data);
      
      if (response.success) {
        const updatedComment = response.data;
        setComments(prev => 
          prev.map(comment => 
            comment.id === editingCommentId ? updatedComment : comment
          )
        );
        setEditingCommentId(null);
        resetEdit();
        toast.success('Comment updated successfully!');
        onCommentUpdated?.(updatedComment);
      } else {
        toast.error(response.error || 'Failed to update comment');
      }
    } catch (error: any) {
      console.error('Update comment error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to update comment';
      toast.error(errorMessage);
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    console.log('🗑️ Delete button clicked for comment:', commentId);
    console.log('👤 Current user:', user);
    console.log('🔍 Comments:', comments);
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      console.log('❌ User cancelled deletion');
      return;
    }

    console.log('🚀 Proceeding with deletion...');

    try {
      const response = await commentService.deleteComment(commentId);
      console.log('📡 Delete response:', response);
      
      if (response.success) {
        console.log('✅ Delete successful, updating UI...');
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted successfully!');
        onCommentDeleted?.(commentId);
      } else {
        console.error('❌ Delete failed:', response.error);
        toast.error(response.error || 'Failed to delete comment');
      }
    } catch (error: any) {
      console.error('❌ Delete comment error:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Clearing session and redirecting to login...');
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }
      
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
        return;
      }
      
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete comment';
      toast.error(errorMessage);
    }
  };

  // Start editing comment
  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setValueEdit('content', comment.content);
    setShowPreview(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCommentId(null);
    resetEdit();
    setShowPreview(false);
  };

  const canEditComment = (comment: Comment) => {
    // 로컬 시스템에서는 모든 로그인한 사용자가 모든 댓글을 수정 가능
    const canEdit = !!user;
    console.log('🔍 Can edit comment:', {
      commentId: comment.id,
      commentAuthor: comment.author.name,
      currentUser: user?.name,
      canEdit: canEdit ? '✅ YES' : '❌ NO'
    });
    return canEdit;
  };

  const canDeleteComment = (comment: Comment) => {
    // 로컬 시스템에서는 모든 로그인한 사용자가 모든 댓글을 삭제 가능
    const canDelete = !!user;
    console.log('🗑️ Can delete comment:', {
      commentId: comment.id,
      commentAuthor: comment.author.name,
      currentUser: user?.name,
      canDelete: canDelete ? '✅ YES' : '❌ NO'
    });
    return canDelete;
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
            {/* Comment Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{comment.author.name}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                  {new Date(comment.createdAt).toLocaleTimeString()}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>
              
              {(canEditComment(comment) || canDeleteComment(comment)) && (
                <div className="flex items-center gap-1">
                  {canEditComment(comment) && (
                    <button
                      onClick={() => startEditing(comment)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit comment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comment Content */}
            {editingCommentId === comment.id ? (
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Edit Comment
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>

                  {showPreview ? (
                    <div className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-white">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{String(editCommentContent || '*No content*')}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      {...registerEdit('content')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Edit your comment..."
                    />
                  )}
                  
                  {errorsEdit.content && (
                    <p className="mt-1 text-sm text-red-600">{errorsEdit.content.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{String(comment.content || '')}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {/* New Comment Form */}
      {user && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleSubmitNew(onSubmitNew)} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="new-comment" className="block text-sm font-medium text-gray-700">
                  Add a comment
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Preview
                    </>
                  )}
                </button>
              </div>

              {showPreview ? (
                <div className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{String(newCommentContent || '*No content*')}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  {...registerNew('content')}
                  id="new-comment"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your comment here. You can use Markdown formatting..."
                />
              )}
              
              {errorsNew.content && (
                <p className="mt-1 text-sm text-red-600">{errorsNew.content.message}</p>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                Supports Markdown formatting. Use **bold**, *italic*, `code`, and more.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Add Comment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};