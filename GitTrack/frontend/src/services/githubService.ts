import { apiClient } from './apiClient';

export interface GitHubTestConnectionRequest {
  repoUrl: string;
  token: string;
}

export interface GitHubTestConnectionResponse {
  success: boolean;
  repoName: string;
  message: string;
}

export interface GitHubImportResult {
  imported: number;
  skipped: number;
  errors: number;
}

export interface GitHubRepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  author: string;
  authorAvatar: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  url: string;
}

class GitHubService {
  /**
   * Test GitHub connection
   */
  async testConnection(repoUrl: string, token: string) {
    const response = await apiClient.post<GitHubTestConnectionResponse>('/github/test-connection', {
      repoUrl,
      token
    });
    return response.data;
  }

  /**
   * Update project GitHub settings
   */
  async updateProjectSettings(projectId: string, repoUrl: string, token: string) {
    const response = await apiClient.put(`/github/projects/${projectId}/settings`, {
      githubRepoUrl: repoUrl,
      githubToken: token
    });
    return response.data;
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(projectId: string) {
    const response = await apiClient.get<GitHubRepositoryInfo>(`/github/projects/${projectId}/info`);
    return response.data;
  }

  /**
   * Get repository issues
   */
  async getRepositoryIssues(projectId: string, state: 'open' | 'closed' | 'all' = 'open') {
    const response = await apiClient.get<GitHubIssue[]>(`/github/projects/${projectId}/issues`, {
      params: { state }
    });
    return response.data;
  }

  /**
   * Import GitHub issues to local database
   */
  async importGitHubIssues(projectId: string) {
    const response = await apiClient.post<GitHubImportResult>(`/github/projects/${projectId}/import`);
    return response.data;
  }

  /**
   * Create GitHub issue from local issue
   */
  async createGitHubIssue(issueId: string) {
    const response = await apiClient.post(`/github/issues/${issueId}/create`);
    return response.data;
  }

  /**
   * Sync issue status with GitHub
   */
  async syncIssueWithGitHub(issueId: string) {
    const response = await apiClient.post(`/github/issues/${issueId}/sync`);
    return response.data;
  }

  /**
   * Update GitHub issue from local issue
   */
  async updateGitHubIssue(issueId: string) {
    const response = await apiClient.put(`/github/issues/${issueId}/update`);
    return response.data;
  }

  /**
   * Sync GitHub comments to local database
   */
  async syncGitHubComments(issueId: string) {
    const response = await apiClient.post(`/github/issues/${issueId}/sync-comments`);
    return response.data;
  }
}

export const githubService = new GitHubService();
export default githubService;