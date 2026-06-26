import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, GitBranch, TestTube, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { EnhancedProject } from '../types/project-groups';
import { projectService } from '../services/projectService';
import { githubService } from '../services/githubService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface GitHubSettingsForm {
  githubRepoUrl: string;
  githubToken: string;
}

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<EnhancedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<GitHubSettingsForm>();

  const watchedValues = watch();

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await projectService.getProjectById(projectId);
      
      if (response.success && response.data) {
        const projectData = response.data;
        setProject(projectData);

        // Reset form with initial values
        reset({
          githubRepoUrl: projectData.githubRepos?.[0]?.url || '',
          githubToken: projectData.githubRepos?.[0]?.token || ''
        });
      } else {
        toast.error('Failed to load project');
        navigate('/projects');
      }
    } catch (error: any) {
      console.error('Failed to load project:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load project';
      toast.error(errorMessage);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const testGitHubConnection = async () => {
    const { githubRepoUrl, githubToken } = watchedValues;
    
    if (!githubRepoUrl || !githubToken) {
      toast.error('Please enter both repository URL and token');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await githubService.testConnection(githubRepoUrl, githubToken);
      
      if (response.success) {
        setTestResult({
          success: true,
          message: response.message || 'Connection successful!'
        });
        toast.success('GitHub connection test successful!');
      } else {
        setTestResult({
          success: false,
          message: response.message || 'Connection test failed'
        });
        toast.error('GitHub connection test failed');
      }
    } catch (error: any) {
      console.error('GitHub connection test error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Connection test failed';
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const importGitHubIssues = async () => {
    if (!project?.id) return;

    if (!project.githubRepos?.[0]?.url || !project.githubRepos?.[0]?.token) {
      toast.error('Please save GitHub settings first before importing issues');
      return;
    }

    if (!confirm('This will import all GitHub issues and comments to the local database. Existing issues will not be duplicated. Continue?')) {
      return;
    }

    setImporting(true);
    try {
      console.log('🚀 Starting GitHub issues import for project:', project.id);
      const result = await githubService.importGitHubIssues(project.id);
      toast.success(
        `Import completed! ${result.imported} issues imported, ${result.skipped} skipped, ${result.errors} errors.`
      );
      console.log('✅ Import results:', result);
    } catch (error: any) {
      console.error('❌ Import GitHub issues error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to import GitHub issues';
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const onSubmit = async (data: GitHubSettingsForm) => {
    if (!project || !id) return;

    setSaving(true);
    try {
      // If GitHub settings are provided, use GitHub service to update and test
      if (data.githubRepoUrl && data.githubToken) {
        await githubService.updateProjectSettings(id, data.githubRepoUrl, data.githubToken);
        toast.success('GitHub integration configured successfully!');
        setTestResult({ success: true, message: 'GitHub integration is now active' });
        await loadProject(id);
      } else {
        // Update project basic info only
        const response = await projectService.updateProject(id, {
          name: project.name,
          description: project.description
        });

        if (response.success && response.data) {
          setProject(response.data);
          toast.success('Project settings saved successfully!');
          setTestResult(null);
        } else {
          const e = response.error;
          toast.error((typeof e === 'object' ? e?.message : e) || 'Failed to save project settings');
        }
      }
    } catch (error: any) {
      console.error('Save project settings error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save project settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Only admin can access project settings
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only administrators can access project settings.</p>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Settings</h1>
          <p className="text-gray-600">Configure GitHub integration for {project.name}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* GitHub Repository URL */}
          <div>
            <label htmlFor="githubRepoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              id="githubRepoUrl"
              {...register('githubRepoUrl', {
                pattern: {
                  value: /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/?$/,
                  message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)'
                }
              })}
              placeholder="https://github.com/owner/repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.githubRepoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.githubRepoUrl.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Enter the full GitHub repository URL (e.g., https://github.com/owner/repo)
            </p>
          </div>

          {/* GitHub Token */}
          <div>
            <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              id="githubToken"
              {...register('githubToken')}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 text-sm text-gray-500">
              <p>Create a personal access token with the following permissions:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">repo</code> - Full control of private repositories</li>
                <li><code className="bg-gray-100 px-1 rounded">issues</code> - Read and write access to issues</li>
                <li><code className="bg-gray-100 px-1 rounded">pull_requests</code> - Read and write access to pull requests</li>
              </ul>
              <p className="mt-2">
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Create a new token on GitHub →
                </a>
              </p>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={testGitHubConnection}
              disabled={testing || !watchedValues.githubRepoUrl || !watchedValues.githubToken}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4" />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 text-sm ${
                testResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* GitHub Integration Actions */}
      {project.githubRepos?.[0]?.url && project.githubRepos?.[0]?.token && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900 mb-2">GitHub Integration Active</h3>
                <p className="text-sm text-green-800 mb-4">
                  Your project is connected to GitHub. You can now import existing GitHub issues and comments.
                </p>
              </div>
            </div>
            
            <button
              onClick={importGitHubIssues}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitBranch className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import GitHub Issues'}
            </button>
          </div>
          
          <div className="mt-4 text-xs text-green-700">
            <p><strong>What will be imported:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>All GitHub issues (open and closed)</li>
              <li>Issue comments and discussions</li>
              <li>Issue labels mapped to types and priorities</li>
              <li>Original creation and update timestamps</li>
            </ul>
            <p className="mt-2"><strong>Note:</strong> Existing issues will not be duplicated.</p>
          </div>
        </div>
      )}

      {/* GitHub Integration Info */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <GitBranch className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">GitHub Integration Features</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Create GitHub issues directly from the issue management system</li>
              <li>• Sync issue status between GitHub and the local system</li>
              <li>• Automatic status updates when GitHub issues are closed/reopened</li>
              <li>• Link local issues to existing GitHub issues</li>
              <li>• Import existing GitHub issues and comments</li>
              <li>• Webhook support for real-time synchronization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};