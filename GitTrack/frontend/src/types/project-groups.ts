// Enhanced project types with grouping support

export type ProjectType = 
  | 'FRONTEND' 
  | 'BACKEND' 
  | 'MOBILE' 
  | 'DESKTOP' 
  | 'API' 
  | 'DATABASE' 
  | 'DEVOPS' 
  | 'FULLSTACK' 
  | 'OTHER';

export interface GitHubRepository {
  id: string;
  projectGroupId: string;
  name: string; // 저장소 역할명 (예: "frontend", "backend", "mobile")
  url: string;
  token?: string;
  branch: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  color?: string;
  githubOrganization?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  projects: EnhancedProject[];
  githubRepos?: GitHubRepository[];
  _count?: {
    projects: number;
    issues: number;
  };
}

export interface EnhancedProject {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  projectGroupId?: string;
  createdAt: string;
  updatedAt: string;
  projectGroup?: ProjectGroup;
  githubRepos?: GitHubRepository[]; // 연결된 GitHub 저장소들
  _count?: {
    issues: number;
  };
}

// GitHub Repository 생성/수정 요청 타입
export interface CreateGitHubRepositoryRequest {
  name: string;
  url: string;
  token?: string;
  branch?: string;
  isMain?: boolean;
}

export interface UpdateGitHubRepositoryRequest {
  name?: string;
  url?: string;
  token?: string;
  branch?: string;
  isMain?: boolean;
}

// Project Group 생성/수정 요청 타입
export interface CreateProjectGroupRequest {
  name: string;
  description: string;
  color?: string;
  githubOrganization?: string;
  githubRepos?: CreateGitHubRepositoryRequest[];
}

export interface UpdateProjectGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  githubOrganization?: string;
}

// Enhanced Project 생성/수정 요청 타입 (GitHub 필드 제거)
export interface CreateEnhancedProjectRequest {
  name: string;
  description: string;
  type: ProjectType;
  projectGroupId?: string;
  githubRepoIds?: string[]; // 연결할 GitHub 저장소 ID들
}

export interface UpdateEnhancedProjectRequest {
  name?: string;
  description?: string;
  type?: ProjectType;
  projectGroupId?: string;
  githubRepoIds?: string[]; // 연결할 GitHub 저장소 ID들
}

// 프로젝트 타입별 아이콘 및 색상 매핑
export const PROJECT_TYPE_CONFIG: Record<ProjectType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  FRONTEND: {
    label: 'Frontend',
    icon: '🎨',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  BACKEND: {
    label: 'Backend',
    icon: '⚙️',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  MOBILE: {
    label: 'Mobile',
    icon: '📱',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  DESKTOP: {
    label: 'Desktop',
    icon: '🖥️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  API: {
    label: 'API',
    icon: '🔌',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  DATABASE: {
    label: 'Database',
    icon: '🗄️',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  DEVOPS: {
    label: 'DevOps',
    icon: '🚀',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  FULLSTACK: {
    label: 'Full Stack',
    icon: '🌐',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  OTHER: {
    label: 'Other',
    icon: '📦',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
};

// User 타입 (기존 타입에서 가져옴)
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}