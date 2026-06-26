// Shared types for frontend application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
  githubId?: string;
  githubUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'task' | 'improvement' | 'feature';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  creator: User;
  project?: Project;
  comments: Comment[];
  attachments: Attachment[];
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Attachment {
  id: string;
  issueId: string;
  filename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  issueType: 'bug' | 'task' | 'improvement' | 'feature';
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type?: string;
  projectGroupId?: string;
  githubRepoUrl?: string;
  githubToken?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    issues: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | { message: string };
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IssueListResponse extends PaginatedResponse<Issue> {
  filters: {
    status?: string[];
    type?: string[];
    priority?: string[];
    assignee?: string[];
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

export interface IssueFormData {
  title: string;
  description: string;
  type: Issue['type'];
  priority: Issue['priority'];
  assigneeId?: string;
  projectId: string;
}

export interface CommentFormData {
  content: string;
}

// Request Types
export interface CreateIssueRequest {
  title: string;
  description: string;
  type: Issue['type'];
  priority: Issue['priority'];
  assigneeId?: string;
  projectId: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: Issue['type'];
  priority?: Issue['priority'];
  status?: Issue['status'];
  assigneeId?: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  githubRepoUrl?: string;
  githubToken?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  githubRepoUrl?: string;
  githubToken?: string;
}

// Filter Types
export interface IssueFilters {
  status?: Issue['status'][];
  type?: Issue['type'][];
  priority?: Issue['priority'][];
  assignee?: string[];
  search?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  issuesByType: Record<Issue['type'], number>;
  issuesByPriority: Record<Issue['priority'], number>;
}
