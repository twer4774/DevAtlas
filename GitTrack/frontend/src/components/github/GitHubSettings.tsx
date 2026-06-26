import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GitBranch, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { EnhancedProject } from '../../types/project-groups';
import { githubService } from '../../services/githubService';
import toast from 'react-hot-toast';

const githubSettingsSchema = z.object({
  githubRepoUrl: z.string()
    .url('Please enter a valid GitHub repository URL')
    .or(z.literal('')),
  githubToken: z.string()
    .min(4, 'GitHub token must be at least 4 characters long')
    .or(z.literal(''))
});

type GitHubSettingsData = z.infer<typeof githubSettingsSchema>;

interface GitHubSettingsProps {
  project: EnhancedProject;
  onUpdate: (project: EnhancedProject) => void;
}

export const GitHubSettings: React.FC<GitHubSettingsProps> = ({ project, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [connectionMessage, setConnectionMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<GitHubSettingsData>({
    resolver: zodResolver(githubSettingsSchema),
    defaultValues: {
      githubRepoUrl: project.githubRepos?.[0]?.url || '',
      githubToken: project.githubRepos?.[0]?.token || ''
    }
  });

  const githubRepoUrl = watch('githubRepoUrl');
  const githubToken = watch('githubToken');

  useEffect(() => {
    setValue('githubRepoUrl', project.githubRepos?.[0]?.url || '');
    setValue('githubToken', project.githubRepos?.[0]?.token || '');
  }, [project, setValue]);

  const onSubmit = async (data: GitHubSettingsData) => {
    setIsSubmitting(true);

    try {
      await githubService.updateProjectSettings(
        project.id,
        data.githubRepoUrl || '',
        data.githubToken || ''
      );
      toast.success('GitHub settings updated successfully!');
      onUpdate({ ...project });
      setConnectionStatus('none');
      setConnectionMessage('');
    } catch (error: any) {
      console.error('Update GitHub settings error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to update GitHub settings';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    if (!githubRepoUrl || !githubToken) {
      toast.error('Please enter both GitHub repository URL and token');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('none');
    setConnectionMessage('');
    
    try {
      const response = await githubService.testConnection(githubRepoUrl, githubToken);
      
      if (response.success) {
        setConnectionStatus('success');
        setConnectionMessage(`Successfully connected to ${response.repoName}`);
        toast.success('GitHub connection successful!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(response.message || 'Connection failed');
        toast.error('GitHub connection failed');
      }
    } catch (error: any) {
      console.error('GitHub connection test error:', error);
      setConnectionStatus('error');
      setConnectionMessage(error.response?.data?.error?.message || 'Connection failed');
      toast.error('GitHub connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">GitHub Integration</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* GitHub Repository URL */}
        <div>
          <label htmlFor="githubRepoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            {...register('githubRepoUrl')}
            type="text"
            id="githubRepoUrl"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/username/repository"
          />
          {errors.githubRepoUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.githubRepoUrl.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter the URL of your GitHub repository
          </p>
        </div>

        {/* GitHub Token */}
        <div>
          <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Personal Access Token
          </label>
          <input
            {...register('githubToken')}
            type="password"
            id="githubToken"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your GitHub token"
          />
          {errors.githubToken && (
            <p className="mt-1 text-sm text-red-600">{errors.githubToken.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Create a token with 'repo' scope at{' '}
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              GitHub Settings
            </a>
          </p>
        </div>

        {/* Test Connection */}
        {githubRepoUrl && githubToken && (
          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testingConnection}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="w-4 h-4" />
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            
            {connectionStatus !== 'none' && (
              <div className={`mt-2 flex items-center gap-2 text-sm ${
                connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {connectionMessage}
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};