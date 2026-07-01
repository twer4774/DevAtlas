import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Settings, BarChart3, FileText, FolderOpen } from 'lucide-react';
import { TemplateManager } from '../components/templates/TemplateManager';
import { ProjectManager } from '../components/projects/ProjectManager';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplateManager />;
      case 'projects':
        return <ProjectManager />;
      case 'overview':
      default:
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage users, settings, and system configuration</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <FolderOpen className="h-8 w-8 text-purple-600" />
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">Project Management</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage projects and configure GitHub integration.
                </p>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Manage Projects
                </button>
              </div>

              {/* Template Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-indigo-600" />
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">Template Management</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Create and manage issue templates for different types.
                </p>
                <button 
                  onClick={() => setActiveTab('templates')}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Manage Templates
                </button>
              </div>

              {/* User Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">User Management</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  조직 멤버, 역할, 초대 링크는 Portal에서 통합 관리됩니다.
                </p>
                <button
                  onClick={() => window.open('http://localhost:5174', '_blank')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Portal에서 관리 →
                </button>
              </div>

              {/* System Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Settings className="h-8 w-8 text-green-600" />
                  <h2 className="ml-3 text-lg font-semibold text-gray-900">System Settings</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Configure system-wide settings and preferences.
                </p>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Settings
                </button>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-blue-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">멤버 관리는 Portal에서</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              조직 멤버, 역할, 초대 링크는 Portal에서 통합 관리됩니다.
            </p>
            <button
              onClick={() => window.open('http://localhost:5174', '_blank')}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Portal 열기 →
            </button>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">System Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              System settings functionality will be implemented here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};