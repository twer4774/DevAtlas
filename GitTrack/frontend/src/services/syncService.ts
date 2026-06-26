import { githubService } from './githubService';
import { issueService } from './issueService';
import toast from 'react-hot-toast';

export interface SyncResult {
  comments: { imported: number; updated: number; skipped: number };
  status: { updated: boolean };
  success: boolean;
}

class SyncService {
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start auto-sync for an issue
   */
  startAutoSync(issueId: string, onUpdate: (issue: any) => void): void {
    // Clear existing interval if any
    this.stopAutoSync(issueId);

    const interval = setInterval(async () => {
      try {
        const result = await this.syncIssue(issueId, false); // silent sync
        
        if (result.success && (result.comments.imported > 0 || result.comments.updated > 0 || result.status.updated)) {
          
          // Show refresh notification with action buttons
          this.showRefreshNotification(result, async () => {
            try {
              const response = await issueService.getIssueById(issueId);
              
              if (response.success) {
                onUpdate(response.data);
              } else {
                console.error('❌ Failed to get issue data:', response);
                toast.error('Failed to refresh issue data');
              }
            } catch (error) {
              console.error('❌ Error refreshing issue data:', error);
              toast.error('Error refreshing issue data');
            }
          });
        } else {
        }
      } catch (error) {
        console.error('❌ Auto-sync error:', error);
        // Don't show error notifications for auto-sync to avoid spam
      }
    }, 30000); // 30초로 복원

    this.syncIntervals.set(issueId, interval);
  }

  /**
   * Stop auto-sync for an issue
   */
  stopAutoSync(issueId: string): void {
    const interval = this.syncIntervals.get(issueId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(issueId);
    }
  }

  /**
   * Manual sync for an issue (with notifications)
   */
  async syncIssueManual(issueId: string): Promise<SyncResult> {
    
    // Show loading toast for manual sync
    const loadingToast = toast.loading('Syncing with GitHub...', {
      duration: 10000
    });
    
    try {
      const result = await this.syncIssue(issueId, true);
      toast.dismiss(loadingToast);
      return result;
    } catch (error) {
      toast.dismiss(loadingToast);
      throw error;
    }
  }

  /**
   * Sync issue with GitHub (comments + status)
   */
  private async syncIssue(issueId: string, showNotifications: boolean = true): Promise<SyncResult> {
    const result: SyncResult = {
      comments: { imported: 0, updated: 0, skipped: 0 },
      status: { updated: false },
      success: false
    };

    try {
      // Get current issue data
      const issueResponse = await issueService.getIssueById(issueId);
      if (!issueResponse.success) {
        throw new Error('Failed to get issue data');
      }

      const issue = issueResponse.data;
      
      // Check if GitHub integration is available
      if (!issue.githubIssueNumber || !issue.project?.githubRepoUrl) {
        if (showNotifications) {
          toast.error('Issue is not linked to GitHub', {
            icon: '🔗',
            duration: 4000
          });
        }
        return result;
      }

      // Store original status for comparison
      const originalStatus = issue.status;

      // 1. Sync comments from GitHub
      let commentError = null;
      try {
        const commentResponse = await githubService.syncGitHubComments(issueId);
        if (commentResponse.success) {
          result.comments = commentResponse.data;
        }
      } catch (error: any) {
        console.error('❌ Comment sync error:', error);
        commentError = error;
      }

      // 2. Sync issue status from GitHub
      let statusError = null;
      try {
        const statusResponse = await githubService.syncIssueWithGitHub(issueId);
        if (statusResponse.success) {
          // Check if status actually changed
          if (statusResponse.data.status !== originalStatus) {
            result.status.updated = true;
          }
        }
      } catch (error: any) {
        console.error('❌ Status sync error:', error);
        statusError = error;
      }

      result.success = true;

      // Show detailed notifications for manual sync
      if (showNotifications) {
        let hasSuccess = false;
        
        if (result.comments.imported > 0) {
          toast.success(`${result.comments.imported} new comments imported from GitHub!`, {
            icon: '💬',
            duration: 4000
          });
          hasSuccess = true;
        }
        
        if (result.comments.updated > 0) {
          toast.success(`${result.comments.updated} comments updated from GitHub!`, {
            icon: '✏️',
            duration: 4000
          });
          hasSuccess = true;
        }
        
        if (result.status.updated) {
          toast.success('Issue status synced with GitHub!', {
            icon: '📊',
            duration: 4000
          });
          hasSuccess = true;
        }
        
        // Show errors if any
        if (commentError && !statusError) {
          toast.error(`Comment sync failed: ${commentError.message}`, {
            icon: '💬',
            duration: 5000
          });
        } else if (statusError && !commentError) {
          toast.error(`Status sync failed: ${statusError.message}`, {
            icon: '📊',
            duration: 5000
          });
        } else if (commentError && statusError) {
          toast.error('Sync failed - check GitHub connection', {
            icon: '⚠️',
            duration: 5000
          });
        }
        
        // Show success message only if no errors and something was synced
        if (!commentError && !statusError) {
          if (!hasSuccess) {
            toast.success('Everything is up to date with GitHub!', {
              icon: '✅',
              duration: 3000
            });
          }
        }
      }

      return result;

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      
      if (showNotifications) {
        const errorMessage = error.response?.data?.error?.message || error.message || 'Sync failed';
        toast.error(`Sync failed: ${errorMessage}`, {
          icon: '❌',
          duration: 5000
        });
      }
      
      return result;
    }
  }

  /**
   * Show refresh notification with action buttons
   */
  private showRefreshNotification(result: SyncResult, onRefresh: () => void): void {
    
    // Build notification message
    const changes: string[] = [];
    
    if (result.comments.imported > 0) {
      changes.push(`${result.comments.imported} new comment${result.comments.imported > 1 ? 's' : ''}`);
    }
    
    if (result.comments.updated > 0) {
      changes.push(`${result.comments.updated} updated comment${result.comments.updated > 1 ? 's' : ''}`);
    }
    
    if (result.status.updated) {
      changes.push('status change');
    }

    const message = `GitHub sync: ${changes.join(', ')} detected`;

    // Create a custom notification with buttons
    const notificationId = `refresh-${Date.now()}`;
    
    // Create notification element
    const createNotification = () => {
      // Remove any existing notifications
      const existingNotifications = document.querySelectorAll('[data-refresh-notification]');
      existingNotifications.forEach(el => el.remove());

      const notification = document.createElement('div');
      notification.setAttribute('data-refresh-notification', notificationId);
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 16px;
        min-width: 350px;
        max-width: 400px;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        animation: slideIn 0.3s ease-out;
      `;

      notification.innerHTML = `
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0; margin-top: 2px;">
            <span style="font-size: 20px;">🔄</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 14px;">
              ${message}
            </div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 12px;">
              Refresh to see the latest changes?
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="reload-btn-${notificationId}" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                Refresh
              </button>
              <button id="dismiss-btn-${notificationId}" style="
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(notification);

      // Add event listeners
      const reloadBtn = document.getElementById(`reload-btn-${notificationId}`);
      const dismissBtn = document.getElementById(`dismiss-btn-${notificationId}`);

      if (reloadBtn) {
        reloadBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          notification.remove();
          
          // Show loading toast
          toast.loading('Reloading page...', {
            duration: 2000
          });
          
          // Force full page reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        });
      } else {
        console.error('❌ Refresh button not found!');
      }

      if (dismissBtn) {
        dismissBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          notification.remove();
        });
      } else {
        console.error('❌ Dismiss button not found!');
      }

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 10000);
    };

    createNotification();
  }

  /**
   * Check if issue can be synced
   */
  canSync(issue: any): boolean {
    return !!(issue?.githubIssueNumber && issue?.project?.githubRepoUrl);
  }

  /**
   * Clean up all intervals
   */
  cleanup(): void {
    this.syncIntervals.forEach((interval, issueId) => {
      clearInterval(interval);
    });
    this.syncIntervals.clear();
  }
}

export const syncService = new SyncService();
export default syncService;