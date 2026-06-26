import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Upload, GitBranch } from 'lucide-react';
import { Issue } from '../../types';
import { githubService } from '../../services/githubService';
import toast from 'react-hot-toast';

interface GitHubSyncProps {
  issue: Issue;
  onIssueUpdated: (issue: Issue) => void;
}

export const GitHubSync: React.FC<GitHubSyncProps> = ({ issue, onIssueUpdated }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [commentSyncResult, setCommentSyncResult] = useState<{ imported: number; skipped: number } | null>(null);

  const hasGitHubIntegration = issue.project?.githubRepoUrl && issue.project?.githubToken;
  const isLinkedToGitHub = Boolean(issue.githubIssueNumber && issue.githubIssueUrl);

  const createGitHubIssue = async () => {
    if (!hasGitHubIntegration) return;
    
    setLoading('create');
    try {
      const response = await githubService.createGitHubIssue(issue.id);
      
      if (response.success) {
        toast.success('Issue created on GitHub successfully!');
        onIssueUpdated({
          ...issue,
          githubIssueNumber: response.data.githubIssueNumber,
          githubIssueUrl: response.data.githubIssueUrl
        });
      } else {
        toast.error(response.error?.message || 'Failed to create GitHub issue');
      }
    } catch (error: any) {
      console.error('Create GitHub issue error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to create GitHub issue';
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const syncWithGitHub = async () => {
    if (!isLinkedToGitHub) return;
    
    setLoading('sync');
    try {
      const response = await githubService.syncIssueWithGitHub(issue.id);
      
      if (response.success) {
        toast.success('Issue synced with GitHub successfully!');
        onIssueUpdated(response.data);
      } else {
        toast.error(response.error?.message || 'Failed to sync with GitHub');
      }
    } catch (error: any) {
      console.error('Sync with GitHub error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to sync with GitHub';
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const updateGitHubIssue = async () => {
    if (!isLinkedToGitHub) return;
    
    setLoading('update');
    try {
      const response = await githubService.updateGitHubIssue(issue.id);
      
      if (response.success) {
        toast.success('GitHub issue updated successfully!');
      } else {
        toast.error(response.error?.message || 'Failed to update GitHub issue');
      }
    } catch (error: any) {
      console.error('Update GitHub issue error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to update GitHub issue';
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const syncGitHubComments = async () => {
    if (!isLinkedToGitHub) return;
    
    setLoading('sync-comments');
    try {
      console.log('🔄 Syncing GitHub comments for issue:', issue.id);
      const response = await githubService.syncGitHubComments(issue.id);
      
      if (response.success) {
        const result = response.data;
        setCommentSyncResult(result);
        
        if (result.imported > 0) {
          toast.success(`${result.imported} new comments imported from GitHub!`);
          // Refresh the page to show new comments
          window.location.reload();
        } else {
          toast.success('All GitHub comments are already up to date!');
        }
        
        console.log('✅ Comment sync result:', result);
      } else {
        toast.error(response.error?.message || 'Failed to sync GitHub comments');
      }
    } catch (error: any) {
      console.error('❌ Sync GitHub comments error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to sync GitHub comments';
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  if (!hasGitHubIntegration) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <GitBranch className="w-5 h-5" />
          <span className="text-sm">GitHub integration not configured for this project</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-medium text-gray-900">GitHub Integration</h3>
        </div>
        
        {isLinkedToGitHub && (
          <a
            href={issue.githubIssueUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            #{issue.githubIssueNumber}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        {!isLinkedToGitHub ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This issue is not linked to GitHub. Create a GitHub issue to enable synchronization.
            </p>
            <button
              onClick={createGitHubIssue}
              disabled={loading === 'create'}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {loading === 'create' ? 'Creating...' : 'Create GitHub Issue'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <GitBranch className="w-4 h-4" />
              <span>Linked to GitHub issue #{issue.githubIssueNumber}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-700">
                <p className="font-medium">✅ Auto-sync enabled</p>
                <p className="text-xs">Comments sync automatically every 30 seconds</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={syncGitHubComments}
                  disabled={loading === 'sync-comments'}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Manually sync comments now"
                >
                  <RefreshCw className="w-4 h-4" />
                  {loading === 'sync-comments' ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
            
            {commentSyncResult && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Last sync result:</strong> {commentSyncResult.imported} new comments imported, {commentSyncResult.skipped} already existed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};