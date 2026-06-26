import React, { useState, useEffect } from 'react';
import { User, GitBranch, Building, MapPin, Calendar, Star, GitFork, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface GitHubProfile {
  id: number;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  publicRepos: number;
  followers: number;
  following: number;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  private: boolean;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
}

interface Organization {
  id: number;
  login: string;
  name: string;
  description: string;
  url: string;
  avatarUrl: string;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [githubProfile, setGitHubProfile] = useState<GitHubProfile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'repos' | 'orgs'>('profile');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // 기본 프로필 정보 가져오기
      const profileResponse = await fetch('/api/profile/me', {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setGitHubProfile(profileData.githubProfile);
      }

      // GitHub 저장소 목록 가져오기
      if (user?.githubId) {
        try {
          const reposResponse = await fetch('/api/profile/github/repositories', {
            credentials: 'include'
          });
          if (reposResponse.ok) {
            const reposData = await reposResponse.json();
            setRepositories(reposData.repositories);
          }
        } catch (error) {
          console.error('Failed to fetch repositories:', error);
        }

        // GitHub 조직 목록 가져오기
        try {
          const orgsResponse = await fetch('/api/profile/github/organizations', {
            credentials: 'include'
          });
          if (orgsResponse.ok) {
            const orgsData = await orgsResponse.json();
            setOrganizations(orgsData.organizations);
          }
        } catch (error) {
          console.error('Failed to fetch organizations:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    try {
      const response = await fetch('/api/profile/github/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('GitHub account disconnected successfully');
        setGitHubProfile(null);
        setRepositories([]);
        setOrganizations([]);
        // 페이지 새로고침하여 사용자 정보 업데이트
        window.location.reload();
      } else {
        throw new Error('Failed to disconnect GitHub account');
      }
    } catch (error) {
      console.error('GitHub disconnect error:', error);
      toast.error('Failed to disconnect GitHub account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
                {user?.githubUsername && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GitBranch className="h-4 w-4 mr-1" />
                    {user.githubUsername}
                  </div>
                )}
              </div>
            </div>
            {user?.githubId && (
              <button
                onClick={handleDisconnectGitHub}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
              >
                Disconnect GitHub
              </button>
            )}
          </div>
        </div>

        {/* GitHub 연결 상태 */}
        {!user?.githubId ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <GitBranch className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                Connect your GitHub account to access additional features like repository management and organization-based permissions.
              </p>
            </div>
            <a
              href={`${'/api'}/auth/github`}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Connect GitHub Account
            </a>
          </div>
        ) : (
          <>
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    GitHub Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('repos')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'repos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Repositories ({repositories.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('orgs')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'orgs'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Organizations ({organizations.length})
                  </button>
                </nav>
              </div>

              {/* 탭 콘텐츠 */}
              <div className="p-6">
                {activeTab === 'profile' && githubProfile && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{githubProfile.publicRepos}</div>
                        <div className="text-sm text-gray-600">Public Repositories</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{githubProfile.followers}</div>
                        <div className="text-sm text-gray-600">Followers</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{githubProfile.following}</div>
                        <div className="text-sm text-gray-600">Following</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {githubProfile.bio && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                          <p className="text-gray-700">{githubProfile.bio}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {githubProfile.company && (
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            {githubProfile.company}
                          </div>
                        )}
                        {githubProfile.location && (
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {githubProfile.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'repos' && (
                  <div className="space-y-4">
                    {repositories.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No repositories found</p>
                    ) : (
                      repositories.map((repo) => (
                        <div key={repo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={repo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lg font-medium text-blue-600 hover:text-blue-800"
                                >
                                  {repo.name}
                                </a>
                                {repo.private && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Private
                                  </span>
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-gray-600 mt-1">{repo.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                {repo.language && (
                                  <span>{repo.language}</span>
                                )}
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 mr-1" />
                                  {repo.stars}
                                </div>
                                <div className="flex items-center">
                                  <GitFork className="h-4 w-4 mr-1" />
                                  {repo.forks}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(repo.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'orgs' && (
                  <div className="space-y-4">
                    {organizations.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No organizations found</p>
                    ) : (
                      organizations.map((org) => (
                        <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <img
                              src={org.avatarUrl}
                              alt={org.name}
                              className="h-12 w-12 rounded-full"
                            />
                            <div className="flex-1">
                              <a
                                href={org.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-medium text-blue-600 hover:text-blue-800"
                              >
                                {org.name || org.login}
                              </a>
                              {org.description && (
                                <p className="text-gray-600 mt-1">{org.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};