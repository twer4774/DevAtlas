import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, Search, Filter } from 'lucide-react';
import { ProjectGroup } from '../types/project-groups';
import { useAuth } from '../contexts/AuthContext';
import { BannerAd } from '../components/AdSense';
import ProjectGroupCard from '../components/projects/ProjectGroupCard';
import { projectGroupService } from '../services/projectGroupService';
import toast from 'react-hot-toast';

export const ProjectGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  useEffect(() => {
    loadProjectGroups();
  }, []);

  const loadProjectGroups = async () => {
    try {
      setLoading(true);
      const response = await projectGroupService.getProjectGroups(showOnlyMine);
      
      if (response.success) {
        setProjectGroups(response.data || []);
      } else {
        const e = response.error;
        toast.error((typeof e === 'object' ? e?.message : e) || 'Failed to load project groups');
      }
    } catch (error: any) {
      console.error('Failed to load project groups:', error);
      toast.error('Failed to load project groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigate('/project-groups/new');
  };

  const handleEditGroup = (group: ProjectGroup) => {
    navigate(`/project-groups/${group.id}/edit`);
  };

  const handleDeleteGroup = async (group: ProjectGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will move all associated projects to standalone status.`)) {
      return;
    }

    try {
      const response = await projectGroupService.deleteProjectGroup(group.id);
      
      if (response.success) {
        toast.success('Project group deleted successfully');
        setProjectGroups(projectGroups.filter(g => g.id !== group.id));
      } else {
        const e2 = response.error;
        toast.error((typeof e2 === 'object' ? e2?.message : e2) || 'Failed to delete project group');
      }
    } catch (error: any) {
      console.error('Failed to delete project group:', error);
      toast.error('Failed to delete project group');
    }
  };

  const filteredGroups = projectGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !showOnlyMine || group.ownerId === user?.id;
    return matchesSearch && matchesOwner;
  });

  const isAdmin = user?.role === 'admin';
  const canCreateGroup = isAdmin; // 또는 다른 권한 로직

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Ad */}
      <BannerAd 
        adSlot="6789012345" 
        className="mb-6"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Groups</h1>
          <p className="text-gray-600">Organize your projects by grouping frontend, backend, and other components</p>
        </div>
        
        {canCreateGroup && (
          <button
            onClick={handleCreateGroup}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project Group
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search project groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            My Groups Only
          </label>
        </div>
      </div>

      {/* Project Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FolderPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || showOnlyMine ? 'No matching project groups' : 'No project groups yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || showOnlyMine 
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first project group to organize your frontend and backend projects.'
            }
          </p>
          {canCreateGroup && !searchTerm && !showOnlyMine && (
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project Group
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <ProjectGroupCard
              key={group.id}
              projectGroup={group}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              canEdit={isAdmin || group.ownerId === user?.id}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {filteredGroups.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{filteredGroups.length}</p>
              <p className="text-sm text-gray-600">Project Groups</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {filteredGroups.reduce((sum, group) => sum + (group._count?.projects || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Projects</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {filteredGroups.reduce((sum, group) => sum + (group._count?.issues || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Issues</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};